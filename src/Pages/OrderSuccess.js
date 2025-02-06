// src/Pages/OrderSuccess.js
import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <Container
      sx={{
        mt: 8,
        mb: 8,
        textAlign: "center",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <Box
        sx={{
          p: 4,
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <FaCheckCircle size={100} color="#000" style={{ marginBottom: "20px" }} />
        <Typography variant="h4" gutterBottom sx={{ fontFamily: "Lora, serif" }}>
          Order Placed Successfully!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Your order has been placed and you will be notified once your order is accepted.
          You can view your order details by clicking on "My Orders" in your profile.
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            padding: "15px 30px",
            textTransform: "none",
            "&:hover": { backgroundColor: "#000" },
          }}
          onClick={() => navigate("/")}
        >
          Go to Home Page
        </Button>
      </Box>
    </Container>
  );
}
