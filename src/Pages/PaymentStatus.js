import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { GlobalContext } from "../Context/GlobalContext";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";

export default function PaymentStatus() {
  const { getPhonePePaymentStatus } = useContext(GlobalContext);
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Fetching payment status...");
  const [subMessage, setSubMessage] = useState("");
  const attemptCount = useRef(0);
  const MAX_ATTEMPTS = 8;
  const POLL_INTERVAL = 8000;

  const transactionId = location.search.replace("?", "").split("--")[0];

  const checkStatus = async () => {
    console.log(`🔄 Attempt ${attemptCount.current + 1} for transaction ${transactionId}`);
    try {
      const response = await getPhonePePaymentStatus({ merchantOrderId: transactionId });
      const txnStatus = response?.data?.state || "UNKNOWN";

      if (txnStatus === "COMPLETED") {
        clearInterval(window.__vastrahubStatusInterval__);
        setStatus("success");
        setMessage("✅ Payment Successful!");
        
        setSubMessage("Thank you for your payment. We have received your payment against this order.");
      } else if (txnStatus === "PENDING") {
        if (attemptCount.current < MAX_ATTEMPTS - 1) {
          setStatus("pending");
          setMessage("⏳ Payment Pending");
          setSubMessage("We're still waiting for payment confirmation. Please do not refresh or close this page.");
        } else {
          clearInterval(window.__vastrahubStatusInterval__);
          setStatus("pending");
          setMessage("⏳ Payment Still Pending");
          setSubMessage("We couldn't confirm your payment automatically. You can also check your payment status anytime from the My Orders section.");
        }
      } else {
        clearInterval(window.__vastrahubStatusInterval__);
        setStatus("pending");
        setMessage("❌ Payment Failed");
        setSubMessage("We’re updating your order status. Please don’t refresh this page.");

        try {
          const orderId = transactionId.replace("TXN", "");
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            orderStatus: "FAILED",
            paymentDone: false,
            paymentResponse: response.data,
          });

          setStatus("failed");
          setSubMessage("The transaction was unsuccessful. Please try again or use another payment method.");
        } catch (err) {
          console.error("⚠️ Firestore update failed:", err);
          setStatus("error");
          setMessage("⚠️ Failed to update order");
          setSubMessage("We couldn’t update your order. Please contact support.");
        }
      }
    } catch (err) {
      clearInterval(window.__vastrahubStatusInterval__);
      console.error("Payment status fetch error:", err);
      setStatus("error");
      setMessage("⚠️ Payment Status Error");
      setSubMessage("Something went wrong while verifying your payment. Please contact support.");
    } finally {
      attemptCount.current++;
    }
  };

  useEffect(() => {
    if (!transactionId) {
      setStatus("error");
      setMessage("Invalid Payment Link");
      setSubMessage("The payment verification link is malformed or incomplete.");
      return;
    }

    checkStatus(); // initial
    window.__vastrahubStatusInterval__ = setInterval(() => {
      if (attemptCount.current >= MAX_ATTEMPTS) {
        clearInterval(window.__vastrahubStatusInterval__);
        return;
      }
      checkStatus();
    }, POLL_INTERVAL);

    return () => clearInterval(window.__vastrahubStatusInterval__);
  }, []); // intentionally empty

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
        <Typography variant="body1" sx={{ mt: 2, color: "#555", fontSize: "1.1rem" }}>
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
