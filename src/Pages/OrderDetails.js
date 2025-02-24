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
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: "Lora, serif" }}>
          Order Details
        </Typography>
        <Typography variant="body1">
          Order ID: <strong>{order.id}</strong>
        </Typography>
        <Typography variant="body1">
          Status: <strong>{order.orderStatus}</strong>
        </Typography>
        <Typography variant="body1">
          Placed on: <strong>{formatDate(order.createdAt)}</strong>
        </Typography>
      </Box>
      <Box
        sx={{
          mb: 4,
          p: 3,
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Shipping Details
        </Typography>
        <Typography variant="body1">Address: {order.address}</Typography>
        <Typography variant="body1">Transport: {order.transport}</Typography>
        <Typography variant="body1">Email: {order.email}</Typography>
        <Typography variant="body1">Phone: {order.phone}</Typography>
        {order.alternatePhone && (
          <Typography variant="body1">Alternate Phone: {order.alternatePhone}</Typography>
        )}
        <Typography variant="body1">GSTIN/PAN: {order.gstinPan}</Typography>
        {order.payLater && (
          <Typography variant="body1" sx={{ color: "green", fontWeight: "bold" }}>
            Payment Method: Pay Later
          </Typography>
        )}
      </Box>
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
              // New calculation: lineTotal = noOfPieces * pricePerPiece
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
        <Typography variant="body1">Subtotal: ₹{order.subtotal.toFixed(2)}</Typography>
        <Typography variant="body1">Total Tax: ₹{order.gst.toFixed(2)}</Typography>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          Grand Total: ₹{order.grandTotal.toFixed(2)}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate("/my-orders")}>
          Back to My Orders
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            "&:hover": { backgroundColor: "#000" },
          }}
        >
          Home
        </Button>
      </Box>
    </Container>
  );
}
