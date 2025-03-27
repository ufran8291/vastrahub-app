// src/Pages/OrderDetails.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// MUI Icons
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

export default function OrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = location.state || {};
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (!orderId) {
      toast.error("No order specified.");
      navigate("/my-orders");
      return;
    }
    fetchOrder();
  }, [orderId, navigate]);

  const fetchOrder = async () => {
    setLoadingOrder(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } else {
        toast.error("Order not found.");
        navigate("/my-orders");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loadingOrder) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!order) {
    return null;
  }

  // Motion variants for section cards
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <Container
      sx={{
        mt: 4,
        mb: 4,
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <Fade triggerOnce>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <ReceiptLongIcon sx={{ fontSize: 40, mr: 1, color: "#1976d2" }} />
          <Typography variant="h4" sx={{ fontFamily: "Lora, serif" }}>
            Order Details
          </Typography>
        </Box>
      </Fade>
      <Fade triggerOnce cascade>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Order ID:</strong> {order.id}
          </Typography>
          <Typography variant="body1">
            <strong>Status:</strong> {order.orderStatus}
          </Typography>
          <Typography variant="body1">
            <strong>Placed on:</strong> {formatDate(order.createdAt)}
          </Typography>
        </Box>
      </Fade>
      <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 4,
            p: 3,
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <LocalShippingIcon sx={{ mr: 1, color: "#1976d2" }} />
            <Typography variant="h6">Shipping Details</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">Address: {order.userAddress}</Typography>
          <Typography variant="body1">Transport: {order.transport}</Typography>
          <Typography variant="body1">Email: {order.userEmail}</Typography>
          <Typography variant="body1">Phone: {order.userPhone}</Typography>
          {order.alternatePhone && (
            <Typography variant="body1">
              Alternate Phone: {order.userAlternatePhone}
            </Typography>
          )}
          <Typography variant="body1">GSTIN/PAN: {order.userGstinPan}</Typography>
          {order.payLater && (
            <Typography variant="body1" sx={{ color: "green", fontWeight: "bold" }}>
              Payment Method: Pay Later
            </Typography>
          )}
        </Box>
      </motion.div>
      <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Order Items
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Product</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Boxes</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Pieces</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Line Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderItems.map((item, index) => {
                // Calculation: lineTotal = noOfPieces * pricePerPiece
                const lineTotal = item.noOfPieces * item.pricePerPiece;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.productTitle}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.quantity} Boxes</TableCell>
                    <TableCell>{item.noOfPieces}</TableCell>
                    <TableCell>₹{lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </motion.div>
      <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 4,
            p: 3,
            border: "1px solid #1976d2",
            borderRadius: "8px",
            backgroundColor: "#f8f8f8",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Typography variant="body1">
            Subtotal: ₹{order.subtotal.toFixed(2)}
          </Typography>
          <Typography variant="body1">
            Total Tax: ₹{order.gst.toFixed(2)}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Grand Total: ₹{order.grandTotal.toFixed(2)}
          </Typography>
        </Box>
      </motion.div>
      <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/my-orders")}
          >
            Back to My Orders
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Home
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
}
