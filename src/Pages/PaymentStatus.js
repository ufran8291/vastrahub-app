import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { GlobalContext } from "../Context/GlobalContext";
import { db } from "../Configs/FirebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export default function PaymentStatus() {
  const navigate = useNavigate();
  const {
    getPhonePePaymentStatus,
    sendEmail,
    createSalesOrder,
    syncStockDataForIds,
  } = useContext(GlobalContext);

  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Fetching payment status...");
  const [subMessage, setSubMessage] = useState("");
  const attemptCount = useRef(0);
  const MAX_ATTEMPTS = 8;
  const POLL_INTERVAL = 8000;

  const transactionId = location.search.replace("?", "").split("--")[0];
  const orderId = transactionId.replace("TXN", "");

  const getOrderData = async () => {
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error("Order does not exist");
    return { orderRef, orderData: snap.data() };
  };

  const updateStockManually = async (orderData) => {
    for (const item of orderData.orderItems) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const updatedSizes = productData.sizes.map((size) => {
          if (size.size === item.size) {
            const newPieces = size.piecesInStock - item.noOfPieces;
            return {
              ...size,
              piecesInStock: newPieces,
              boxesInStock:
                Math.floor(newPieces / size.boxPieces) +
                (newPieces % size.boxPieces > 0 ? 1 : 0),
            };
          }
          return size;
        });
        await setDoc(productRef, { sizes: updatedSizes }, { merge: true });
      }
    }
  };

  const sendOrderConfirmation = async (email, name) => {
    const emailSubject = "Order Confirmation - Your Order is Placed";
    const emailContent = `Hello ${name},\n\nThank you for your order!\n\nYour order has been placed successfully. You can view the order details in your profile.\n\nWarm regards,\nThe VastraHub Team`;
    await sendEmail({ email, subject: emailSubject, content: emailContent });
  };

  const handleSuccessFlow = async (apiResponse) => {
    const { orderRef, orderData } = await getOrderData();

    // Update Firestore order
    await updateDoc(orderRef, {
      orderStatus: "ORDERED",
      paymentDone: true,
      paymentResponse: apiResponse.data,
    });

    // Prepare payload for GoFrugal
    const onlineReferenceNo = Date.now().toString();
    const newOrderPayload = {
      onlineReferenceNo,
      createdAt: new Date().toISOString(),
      totalTaxAmount: Number(orderData.gst),
      totalDiscountAmount: 0,
      status: "pending",
      totalQuantity: orderData.orderItems.reduce(
        (sum, item) => sum + Number(item.noOfPieces),
        0
      ),
      totalAmount: Number(orderData.grandTotal),
      paymentMode: orderData.paymentMode,
      shippingId: orderData.userId,
      shippingName: orderData.userName,
      shippingMobile: orderData.userPhone,
      shippingAddress1: orderData.userAddress,
      shippingCountry: orderData.shippingCountry,
      shippingPincode: orderData.shippingPincode,
      shippingStateCode: Number(orderData.shippingStateCode),
      shipmentItems: orderData.orderItems.length,
      customerName: orderData.userBusinessName,
      customerMobile: orderData.userPhone,
      customerEmail: orderData.userEmail,
      orderRemarks: orderData.orderRemarks,
      Channel: orderData.Channel,
      orderItems: orderData.orderItems.map((item, index) => ({
        rowNo: index + 1,
        itemId: Number(item.inventoryId),
        itemReferenceCode: String(item.inventoryId),
        salePrice: Number(item.pricePerPiece),
        quantity: Number(item.noOfPieces),
        itemAmount: Number(item.noOfPieces) * Number(item.pricePerPiece),
        taxPercentage: Number(item.gst),
        discountPercentage: 0,
      })),
    };

    let isStoreOpen = true;
    try {
      const storeSnap = await getDoc(doc(db, "banners", "other-data"));
      if (storeSnap.exists()) isStoreOpen = storeSnap.data().isStoreOpen;
    } catch (e) {
      console.warn("Could not check store status:", e);
    }

    if (isStoreOpen) {
      try {
        await createSalesOrder(newOrderPayload);
      } catch (err) {
        await addDoc(collection(db, "unsync-orders"), {
          ...newOrderPayload,
          firestoreOrderId: orderId,
          error: err.message,
          createdAt: new Date().toISOString(),
        });
        await updateStockManually(orderData);
      }
    } else {
      await addDoc(collection(db, "unsync-orders"), {
        ...newOrderPayload,
        firestoreOrderId: orderId,
        error: "Store closed",
        createdAt: new Date().toISOString(),
      });
      await updateStockManually(orderData);
    }

    await sendOrderConfirmation(orderData.userEmail, orderData.userName);
    // ── CLEAR USER'S CART ───────────────────────────────────────────
    try {
      const cartCol = collection(db, "users", orderData.userId, "cart");
      const cartSnap = await getDocs(cartCol);
      await Promise.all(cartSnap.docs.map((d) => deleteDoc(d.ref)));
      console.log("🗑️  Cleared user cart after successful order");
    } catch (e) {
      console.warn("Could not clear cart:", e);
    }
    setStatus("success");
    setMessage("✅ Payment Successful!");
    setSubMessage(
      "Thank you for your payment. Your order is confirmed and an email has been sent to you."
    );
  };

  const checkStatus = async () => {
    console.log(
      `🔄 Attempt ${attemptCount.current + 1} for transaction ${transactionId}`
    );
    try {
      const response = await getPhonePePaymentStatus({
        merchantOrderId: transactionId,
      });
      const txnStatus = response?.data?.state || "UNKNOWN";

      if (txnStatus === "COMPLETED") {
        clearInterval(window.__vastrahubStatusInterval__);
        await handleSuccessFlow(response);
      } else if (txnStatus === "PENDING") {
        if (attemptCount.current < MAX_ATTEMPTS - 1) {
          setStatus("pending");
          setMessage("⏳ Payment Pending");
          setSubMessage(
            "We're still waiting for payment confirmation. Please do not refresh or close this page."
          );
        } else {
          clearInterval(window.__vastrahubStatusInterval__);
          setStatus("pending");
          setMessage("⏳ Payment Still Pending");
          setSubMessage(
            "We couldn't confirm your payment automatically. You can also check your payment status anytime from the My Orders section."
          );
        }
      } else {
        clearInterval(window.__vastrahubStatusInterval__);
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          orderStatus: "FAILED",
          paymentDone: false,
          paymentResponse: response.data,
        });
        setStatus("failed");
        setMessage("❌ Payment Failed");
        setSubMessage(
          "The transaction was unsuccessful. Please try again or use another payment method."
        );
      }
    } catch (err) {
      clearInterval(window.__vastrahubStatusInterval__);
      console.error("Payment status fetch error:", err);
      setStatus("error");
      setMessage("⚠️ Payment Status Error");
      setSubMessage(
        "Something went wrong while verifying your payment. Please contact support."
      );
    } finally {
      attemptCount.current++;
    }
  };

  useEffect(() => {
    if (!transactionId) {
      setStatus("error");
      setMessage("Invalid Payment Link");
      setSubMessage(
        "The payment verification link is malformed or incomplete."
      );
      return;
    }

    checkStatus();
    window.__vastrahubStatusInterval__ = setInterval(() => {
      if (attemptCount.current >= MAX_ATTEMPTS) {
        clearInterval(window.__vastrahubStatusInterval__);
        return;
      }
      checkStatus();
    }, POLL_INTERVAL);

    return () => clearInterval(window.__vastrahubStatusInterval__);
  }, []);

  const getIcon = () => {
    const iconSize = 70;
    switch (status) {
      case "success":
        return <FaCheckCircle size={iconSize} color="green" />;
      case "pending":
        return <FaHourglassHalf size={iconSize} color="#f0ad4e" />;
      case "failed":
        return <FaTimesCircle size={iconSize} color="red" />;
      case "error":
        return <FaExclamationTriangle size={iconSize} color="darkred" />;
      default:
        return <CircularProgress size={iconSize} />;
    }
  };

  return (
    <Container sx={{ mt: 10, mb: 10, textAlign: "center", px: 2 }}>
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          p: { xs: 3, sm: 5 },
          maxWidth: 600,
          mx: "auto",
          backgroundColor: "#fff",
        }}
      >
        {getIcon()}
        <Typography
          variant="h4"
          sx={{
            mt: 3,
            fontWeight: "bold",
            color: {
              success: "green",
              pending: "#f0ad4e",
              failed: "red",
              error: "darkred",
            }[status],
          }}
        >
          {message}
        </Typography>
        <Typography
          variant="body1"
          sx={{ mt: 2, color: "#555", fontSize: "1.1rem" }}
        >
          {subMessage}
        </Typography>
        {status !== "loading" && <Divider sx={{ mt: 4, mb: 2 }} />}
        {status === "success" && (
          <Typography variant="caption" sx={{ color: "gray" }}>
            You may close this window or return to the homepage.
          </Typography>
        )}
      </Box>
    </Container>
  );
}
