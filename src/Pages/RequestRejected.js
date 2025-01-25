import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel"; // Rejected icon
import logo from "../assets/vastrahubLogo.svg";

const RequestRejected = () => {
  const handleContactSupport = () => {
    window.location.href = "mailto:vastrahub@gmail.com";
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6, textAlign: "center" }}>
      {/* Logo */}
      <Box sx={{ mb: 3 }}>
        <img
          src={logo}
          alt="Vastrahub Logo"
          style={{ width: 120, height: "auto" }}
        />
      </Box>

      {/* Large Icon */}
      <Box sx={{ mb: 3 }}>
        <CancelIcon color="error" sx={{ fontSize: 80 }} />
      </Box>

      {/* Heading */}
      <Typography variant="h4" gutterBottom color="error" fontWeight="bold">
        Request Rejected
      </Typography>

      {/* Body Copy */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        Unfortunately, your registration request has been declined by our admin
        team. If you believe this decision was made in error, or if you have any
        questions, please reach out to us for clarification.
      </Typography>

      {/* Contact Button (Black) */}
      <Button
        variant="contained"
        onClick={handleContactSupport}
        sx={{
          mt: 2,
          backgroundColor: "#000",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#333",
          },
        }}
      >
        Contact Us
      </Button>
    </Container>
  );
};

export default RequestRejected;
