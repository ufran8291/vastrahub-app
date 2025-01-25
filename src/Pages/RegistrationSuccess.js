import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Success icon
import logo from "../assets/vastrahubLogo.svg";

const RegistrationSuccess = () => {
  const handleGoHome = () => {
    // Navigate user to homepage or any relevant page
    window.location.href = "/";
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
        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80 }} />
      </Box>

      {/* Heading */}
      <Typography variant="h4" gutterBottom fontWeight="bold" color="success.main">
        Registration Successful
      </Typography>

      {/* Body Copy */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your information has been submitted successfully. We will review your
        onboarding request and notify you once it has been approved by our admin
        team.
      </Typography>

      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        You’ll receive an update via phone or email once your account is fully
        activated. Thank you for choosing Vastrahub!
      </Typography>

      {/* Action Button (Black) */}
      <Button
        variant="contained"
        onClick={handleGoHome}
        sx={{
          backgroundColor: "#000",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#333",
          },
        }}
      >
        Go to Homepage
      </Button>
    </Container>
  );
};

export default RegistrationSuccess;
