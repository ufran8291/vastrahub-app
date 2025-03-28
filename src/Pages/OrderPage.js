// src/Pages/OrderPage.js
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Backdrop, // <-- Import Backdrop from MUI
} from "@mui/material";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

export default function OrderPage() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;
  const isPremium = firestoreUser?.isPremium;

  // Order details – for this example, we fetch the latest cart items.
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // User/Order fields
  const [address, setAddress] = useState("");
  const [transport, setTransport] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [gstinPan, setGstinPan] = useState("");
  const [payLater, setPayLater] = useState(false); // toggle for paylater if premium

  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Order placement state
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState(""); // new state for dynamic status messages

  const {
    syncStockData,
    checkStockAvailability,
    sendEmail,
    syncStockDataForIds,
    createSalesOrder,
    checkSessionTokenConsistency,
  } = useContext(GlobalContext);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to place an order.");
      navigate("/otp-verify");
      return;
    }
    checkSessionTokenConsistency();
    // Pre-fill user details from firestoreUser
    setAddress(firestoreUser.address || "");
    setTransport(firestoreUser.transportService || "");
    setEmail(firestoreUser.email || "");
    setPhone(firestoreUser.primaryPhone || "");
    setGstinPan(firestoreUser.gstin || firestoreUser.pan || "");
    fetchCartItems();
    // eslint-disable-next-line
  }, [isLoggedIn]);

  const fetchCartItems = async () => {
    setLoadingCart(true);
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      let items = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), cartItemId: docSnap.id });
      });
      setCartItems(items);
      recalcTotals(items);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast.error("Failed to load cart items.");
    } finally {
      setLoadingCart(false);
    }
  };

  // Calculate totals using:
  // lineTotal = noOfPieces * pricePerPiece
  // lineWithoutTax = lineTotal / (1 + gstRate/100)
  // lineTax = lineTotal - lineWithoutTax
  const recalcTotals = (items) => {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let total = 0;
    for (let item of items) {
      const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
      const lineTotal = item.noOfPieces * item.pricePerPiece;
      const lineWithoutTax = lineTotal / (1 + gstRate / 100);
      const lineTax = lineTotal - lineWithoutTax;
      totalWithoutTax += lineWithoutTax;
      totalTax += lineTax;
      total += lineTotal;
    }
    setSubtotal(+totalWithoutTax.toFixed(2));
    setTax(+totalTax.toFixed(2));
    setGrandTotal(+total.toFixed(2));
  };

  // Helper function to clear the user's cart
  const clearCart = async () => {
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        deletePromises.push(
          deleteDoc(doc(db, "users", uid, "cart", docSnap.id))
        );
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const handlePlaceOrder = async () => {
    // Begin order placement process and show overlay loader
    setPlacingOrder(true);
    setOrderStatus("Validating order details...");
    
    // 1. Check if user is logged in.
    if (!isLoggedIn) {
      toast.info("Please log in to place an order.");
      navigate("/otp-verify");
      setPlacingOrder(false);
      setOrderStatus("");
      return;
    }
    
    // 2. Validate cart items:
    //    - Ensure there are at least 2 boxes ordered overall.
    //    - Ensure grand total is >= ₹10,000.
    const totalBoxesOrdered = cartItems.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    );
    if (totalBoxesOrdered < 2) {
      toast.error("Please order at least 2 boxes in total.");
      setPlacingOrder(false);
      setOrderStatus("");
      return;
    }
    if (grandTotal < 10000) {
      toast.error("Grand total must be at least ₹10,000.");
      setPlacingOrder(false);
      setOrderStatus("");
      return;
    }
  
    // 3. Confirm stock availability for each item in the cart.
    setOrderStatus("Verifying stock availability...");
    let stockCheckPassed = true;
    try {
      // First, get store status from Firestore.
      const storeDoc = await getDoc(doc(db, "banners", "other-data"));
      let storeOpen = false;
      if (storeDoc.exists()) {
        storeOpen = storeDoc.data().isStoreOpen;
      }
      if (storeOpen) {
        try {
          const inventoryIds = Array.from(
            new Set(cartItems.map((item) => Number(item.inventoryId)))
          );
          console.log("Extracted inventoryIds:", inventoryIds);
  
          const availableStock = await checkStockAvailability(inventoryIds);
          console.log("Available stock from cloud function:", availableStock);
  
          // Validate each cart item using the cloud function data.
          for (const item of cartItems) {
            const invId = Number(item.inventoryId);
            const available = availableStock[invId];
            if (available === undefined) {
              toast.error(`No stock info for ${item.productTitle} (Size: ${item.size}).`);
              console.log(`Stock check failed: no stock info for ${item.productTitle} (Size: ${item.size}).`);
              stockCheckPassed = false;
              break;
            }
            if (available < item.noOfPieces) {
              toast.error(`Insufficient stock for ${item.productTitle} (Size: ${item.size}).`);
              console.log(`Stock check failed: insufficient stock for ${item.productTitle} (Size: ${item.size}).`);
              stockCheckPassed = false;
              break;
            }
          }
        } catch (cloudErr) {
          console.error("Error using cloud function for stock check:", cloudErr);
          toast.info("Falling back to Firestore for stock verification...");
          stockCheckPassed = await firestoreStockCheck();
        }
      } else {
        console.log("Store is closed. Using Firestore for stock verification...");
        stockCheckPassed = await firestoreStockCheck();
      }
    } catch (error) {
      console.error("Error in stock check process:", error);
      toast.info("Falling back to Firestore for stock verification...");
      stockCheckPassed = await firestoreStockCheck();
    }
    if (!stockCheckPassed) {
      setPlacingOrder(false);
      setOrderStatus("");
      return;
    }
  
    // Helper function to perform Firestore-based stock check.
    async function firestoreStockCheck() {
      let allPassed = true;
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          toast.error(`Product ${item.productTitle} not found in Firestore.`);
          allPassed = false;
          break;
        }
        const productData = productSnap.data();
        // Find the size object in the product's sizes array matching the cart item’s size.
        const sizeObj = productData.sizes.find((s) => s.size === item.size);
        if (!sizeObj) {
          toast.error(`Size ${item.size} not available for ${item.productTitle}.`);
          allPassed = false;
          break;
        }
        if (sizeObj.piecesInStock < item.noOfPieces) {
          toast.error(`Insufficient stock for ${item.productTitle} (Size: ${item.size}).`);
          allPassed = false;
          break;
        }
        console.log(
          `Firestore check passed for ${item.productTitle} (Size: ${item.size}): requested ${item.noOfPieces}, available ${sizeObj.piecesInStock}`
        );
      }
      return allPassed;
    }
  
    // 4. Prepare order totals and the order object.
    setOrderStatus("Preparing order details...");
    const orderItemsData = await Promise.all(
      cartItems.map(async (item) => {
        let invId = item.inventoryId;
        // If inventoryId is undefined, fetch it from the product document.
        if (!invId) {
          const prodRef = doc(db, "products", item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const productData = prodSnap.data();
            const sizeObj = productData.sizes.find((s) => s.size === item.size);
            if (sizeObj) {
              invId = sizeObj.inventoryId;
            }
          }
        }
        const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
        const lineTotal = item.noOfPieces * item.pricePerPiece;
        const lineWithoutTax = lineTotal / (1 + gstRate / 100);
        const lineTax = lineTotal - lineWithoutTax;
        return {
          productId: item.productId,
          productTitle: item.productTitle,
          size: item.size,
          quantity: item.quantity,
          noOfPieces: item.noOfPieces,
          boxPieces: item.boxPieces,
          pricePerPiece: item.pricePerPiece,
          lineTotal,
          lineWithoutTax,
          lineTax,
          inventoryId: invId, // Use the fetched or existing inventoryId.
        };
      })
    );
  
    const currentISODate = new Date().toISOString();
    // Determine shipping state code dynamically based on user's state.
    const stateCodes = {
      "Himachal Pradesh": 2,
      "Punjab": 3,
      "Chandigarh": 4,
      "Uttarakhand": 5,
      "Haryana": 6,
      "Delhi": 7,
      "Rajasthan": 8,
      "Uttar Pradesh": 9,
      "Bihar": 10,
      "Sikkim": 11,
      "Arunanchal Pradesh": 12,
      "Nagaland": 13,
      "Manipur": 14,
      "Mizoram": 15,
      "Tripura": 16,
      "Meghalaya": 17,
      "Assam": 18,
      "West Bengal": 19,
      "Jharkhand": 20,
      "Odisha": 21,
      "Chattisgarh": 22,
      "Madhya Pradesh": 23,
      "Gujarat": 24,
      "Dadra And Nagar Haveli And Daman And Diu": 26,
      "Maharashtra": 27,
      "Andhra Pradesh": 28,
      "Karnataka": 29,
      "Goa": 30,
      "Lakshadweep": 31,
      "Kerela": 32,
      "Tamil Nadu": 33,
      "Puducherry": 34,
      "Andaman and Nicobar Islands": 35,
      "Telangana": 36,
      "Andhra Pradesh": 37,
      "Ladakh": 38,
      "Other Territory": 97,
    };
    const shippingStateCode = stateCodes[firestoreUser.state] || 14; // Default to 14 if state not found.
  
    // Use user's saved pincode if valid; otherwise default to "431001".
    const pincode =
      (firestoreUser.pincode && firestoreUser.pincode.length === 6)
        ? firestoreUser.pincode
        : "431001";
  
    // Build the base order object.
    const currentDateTime = new Date();
    const orderData = {
      userId: uid,
      userName: firestoreUser.name,
      userBusinessName: firestoreUser.businessName || "N/A",
      userEmail: firestoreUser.email,
      userPhone: firestoreUser.primaryPhone,
      userAlternatePhone: firestoreUser.alternatePhone || "",
      userGstinPan: firestoreUser.gstin || firestoreUser.pan || "",
      userAddress: firestoreUser.address || "",
      transport: firestoreUser.transportService || "N/A",
      paymentMode: "", // will be set below
      shippingCountry: "India",
      shippingPincode: pincode,
      shippingStateCode: shippingStateCode,
      orderRemarks: `PAN: ${firestoreUser.pan || "N/A"} GST: ${firestoreUser.gstin || "N/A"}`,
      Channel: "E-Commerce API",
      orderItems: orderItemsData,
      subtotal: subtotal,
      gst: tax,
      grandTotal: grandTotal,
      orderStatus: "", // will be set below
      orderType: "ecommerce-website",
      createdAt: currentDateTime,
      paymentDone: false,
    };
  
    // 5. Branch based on whether the payment mode is "Pay Later" or not.
    if (payLater) {
      setOrderStatus("Placing your order (Pay Later)...");
      // For Pay Later: Save order immediately.
      orderData.paymentMode = "Dashboard";
      orderData.orderStatus = "ORDERED";
      orderData.paymentDone = true;
  
      try {
        // Save order to Firestore.
        console.log("Saving order (Pay Later)...", orderData);
        const orderDocRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Order saved in Firestore with id:", orderDocRef.id);
  
        // Prepare payload for cloud function.
        const newOrderPayload = {
          onlineReferenceNo: Number((orderData.userPhone + Date.now()).slice(0, 15)),
          createdAt: currentISODate,
          totalTaxAmount: Number(orderData.gst),
          totalDiscountAmount: 0.0,
          status: "pending",
          totalQuantity: orderData.orderItems.reduce(
            (sum, item) => sum + Number(item.noOfPieces),
            0
          ),
          totalAmount: Number(orderData.grandTotal),
          paymentMode: orderData.paymentMode,
          shippingId: orderData.userId,
          shippingName: orderData.userName,
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
            // Use inventoryId for both itemId and itemReferenceCode.
            itemId: Number(item.inventoryId),
            itemReferenceCode: String(item.inventoryId),
            salePrice: Number(item.pricePerPiece),
            quantity: Number(item.noOfPieces),
            itemAmount: Number(item.noOfPieces) * Number(item.pricePerPiece),
            taxPercentage: Number(item.gst),
            discountPercentage: 0.0,
          })),
        };
        console.log("Payload to Cloud Function (Pay Later):", newOrderPayload);
  
        // Check if store is open before calling cloud function.
        const storeDoc = await getDoc(doc(db, "banners", "other-data"));
        let isStoreOpen = false;
        if (storeDoc.exists()) {
          isStoreOpen = storeDoc.data().isStoreOpen;
        }
        console.log("Store open status:", isStoreOpen);
  
        let createSalesOrderResponse;
        if (isStoreOpen) {
          setOrderStatus("Processing order via cloud function...");
          try {
            createSalesOrderResponse = await createSalesOrder(newOrderPayload);
            console.log("Cloud Function response:", createSalesOrderResponse);
          } catch (err) {
            console.error("Error calling createSalesOrder cloud function:", err);
          }
        } else {
          console.log("Store is closed. Skipping cloud function call.");
        }
  
        // If store is closed or cloud function call failed, save order to unsync-orders and manually update stock.
        if (!isStoreOpen || !createSalesOrderResponse || createSalesOrderResponse.error) {
          console.log("Falling back to unsynced orders.");
          await addDoc(collection(db, "unsync-orders"), {
            ...newOrderPayload,
            firestoreOrderId: orderDocRef.id,
            error: createSalesOrderResponse ? createSalesOrderResponse.error : "Store closed or cloud function call failed",
            createdAt: new Date().toISOString(),
          });
  
          // Manually update stock for each ordered item.
          for (const item of cartItems) {
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
              console.log(`Updated stock for productId: ${item.productId}`);
            }
          }
        }
  
        // Send confirmation email.
        setOrderStatus("Sending confirmation email...");
        try {
          const emailSubject = "Order Confirmation - Your Order is Placed";
          const emailContent = `Hello ${orderData.userName},
  
  Thank you for your order!
  
  Your order has been placed successfully. You can view the order details in your profile.
  
  Warm regards,
  The VastraHub Team`;
          await sendEmail({
            email: orderData.userEmail,
            subject: emailSubject,
            content: emailContent,
          });
          toast.info("Order confirmation email sent.");
        } catch (emailErr) {
          console.error("Error sending confirmation email:", emailErr);
          toast.error("Order placed but failed to send confirmation email.");
        }
  
        toast.success("Order placed successfully!");
        setOrderStatus("Order placed successfully!");
        await clearCart();
        navigate("/");
      } catch (error) {
        console.error("Error placing order:", error);
        toast.error("Failed to place order: " + error.message);
      } finally {
        setPlacingOrder(false);
        setOrderStatus("");
      }
    } else {
      // 6. Else branch: Payment mode is not Pay Later.
      setOrderStatus("Redirecting to payment gateway...");
      try {
        orderData.paymentMode = "pending";
        orderData.orderStatus = "PG";
        orderData.paymentDone = false;
        const orderDocRef = await addDoc(collection(db, "orders"), orderData);
        console.log("Order saved (PG mode) with id:", orderDocRef.id);
        // TODO: handle payment here 
        navigate("/payment", { state: orderData });
      } catch (error) {
        console.error("Error saving order for payment:", error);
        toast.error("Failed to save order for payment: " + error.message);
      } finally {
        setPlacingOrder(false);
        setOrderStatus("");
      }
    }
  };
  
  // Cancel button: return to cart page
  const handleCancel = () => {
    navigate("/cart");
  };

  // Motion variants for form sections and summary
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
    }),
  };

  if (loadingCart) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      sx={{ mt: 4, mb: 10, fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
      <Fade triggerOnce>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontFamily: "Lora, serif" }}
        >
          Review Your Order
        </Typography>
      </Fade>

      {/* User & Order Details Form */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 3,
            p: 3,
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Your Details
          </Typography>
          <TextField
            fullWidth
            label="Address"
            variant="outlined"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Preferred Transport"
            variant="outlined"
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Alternate Phone (Optional)"
            variant="outlined"
            value={alternatePhone}
            onChange={(e) => setAlternatePhone(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="GSTIN/PAN"
            variant="outlined"
            value={gstinPan}
            disabled
            sx={{ mb: 2 }}
          />
          {isPremium && (
            <FormControlLabel
              control={
                <Switch
                  checked={payLater}
                  onChange={(e) => setPayLater(e.target.checked)}
                  color="primary"
                />
              }
              label="Pay Later Option"
            />
          )}
          {isPremium && payLater && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              You have selected Pay Later. We will contact you regarding payment.
            </Typography>
          )}
        </Box>
      </motion.div>

      {/* Order Summary */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 10,
            p: 3,
            border: "1px solid #1976d2",
            borderRadius: "8px",
            backgroundColor: "#f8f8f8",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          {cartItems.map((item) => {
            const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
            const lineTotal = item.noOfPieces * item.pricePerPiece;
            const lineWithoutTax = lineTotal / (1 + gstRate / 100);
            const lineTax = lineTotal - lineWithoutTax;
            return (
              <Box
                key={item.cartItemId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  p: 1,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {item.productTitle} - Size: {item.size}
                  </Typography>
                  <Typography variant="body2">
                    {item.quantity} Boxes (No of Pieces: {item.noOfPieces})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">
                    Line Total: ₹{lineTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">
              Subtotal: ₹{subtotal.toFixed(2)}
            </Typography>
            <Typography variant="h6">Total Tax: ₹{tax.toFixed(2)}</Typography>
            <Typography variant="h6">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Order Action Button */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-start" }}>
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: "bold",
              py: 1.5,
              px: 3,
              textTransform: "none",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            {placingOrder ? (
              <CircularProgress size={24} color="inherit" />
            ) : isPremium && payLater ? (
              "Place Order"
            ) : (
              "Make Payment"
            )}
          </Button>
        </Box>
      </motion.div>

      {/* Fixed Bottom Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #ddd",
          p: "15px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <Box sx={{ textAlign: "left", fontSize: "0.9rem", lineHeight: "1.4" }}>
          <div>
            <strong>Total Without Tax:</strong> ₹{subtotal.toFixed(2)}
          </div>
          <div>
            <strong>Total Tax:</strong> ₹{tax.toFixed(2)}
          </div>
          <div>
            <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
          </div>
        </Box>
        <Button
          variant="contained"
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            textTransform: "none",
            "&:hover": { backgroundColor: "#000" },
          }}
        >
          {placingOrder ? (
            <CircularProgress size={24} color="inherit" />
          ) : isPremium && payLater ? (
            "Place Order"
          ) : (
            "Make Payment"
          )}
        </Button>
      </Box>

      {/* Overlay Loader using Backdrop */}
      <Backdrop
        open={placingOrder}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: "#fff",
          flexDirection: "column",
        }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {orderStatus || "Processing your order, please wait..."}
        </Typography>
      </Backdrop>
    </Container>
  );
}
