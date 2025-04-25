import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { GlobalContext } from "../Context/GlobalContext";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

export default function PaymentStatus() {
  const { getPhonePePaymentStatus } = useContext(GlobalContext);
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Fetching payment status...");
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    const rawQuery = location.search.replace("?", "");
    const [transactionId] = rawQuery.split("--");

    console.log("🔍 Extracted transactionId:", transactionId);

    if (!transactionId) {
      setStatus("error");
      setMessage("Invalid Payment Link");
      setSubMessage("The payment verification link is malformed or incomplete.");
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await getPhonePePaymentStatus({ merchantOrderId: transactionId });

        const txnStatus = response?.data?.state || "UNKNOWN";

        if (txnStatus === "COMPLETED") {
          setStatus("success");
          setMessage("✅ Payment Successful!");
          setSubMessage("Thank you for your payment. We have received your payment against this order.");
        } else if (txnStatus === "PENDING") {
          setStatus("pending");
          setMessage("⏳ Payment Pending");
          setSubMessage("We're still waiting for payment confirmation. Please do not refresh or close this page.");
        } else {
          setStatus("failed");
          setMessage("❌ Payment Failed");
          setSubMessage("The transaction was unsuccessful. Please try again or use another payment method.");
        }
      } catch (err) {
        console.error("Error fetching payment status:", err);
        setStatus("error");
        setMessage("⚠️ Payment Status Error");
        setSubMessage("Something went wrong while verifying your payment. Please contact support.");
      }
    };

    checkStatus();
  }, [location.search, getPhonePePaymentStatus]);

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

        {status !== "loading" && (
          <Divider sx={{ mt: 4, mb: 2 }} />
        )}

        {status === "success" && (
          <Typography variant="caption" sx={{ color: "gray" }}>
            You may close this window or return to the homepage.
          </Typography>
        )}
      </Box>
    </Container>
  );
}
