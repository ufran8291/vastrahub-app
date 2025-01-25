import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block"; // Blocked icon
import logo from "../assets/vastrahubLogo.svg";

const BlockedUser = () => {
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
        <BlockIcon color="error" sx={{ fontSize: 80 }} />
      </Box>

      {/* Heading */}
      <Typography variant="h4" gutterBottom color="error" fontWeight="bold">
        Your Account is Blocked
      </Typography>

      {/* Body Copy */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        It appears your account has been blocked by our system. If you believe
        this is a mistake or require additional assistance, please get in touch
        with our support team.
      </Typography>

      {/* Contact Support (Black Button) */}
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
        Contact Support
      </Button>
    </Container>
  );
};

export default BlockedUser;
