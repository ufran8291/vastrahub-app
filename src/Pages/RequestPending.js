import React from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"; // Pending icon
import logo from "../assets/vastrahubLogo.svg";

const RequestPending = () => {
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
        <HourglassEmptyIcon color="primary" sx={{ fontSize: 80 }} />
      </Box>

      {/* Heading */}
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Your Request is Pending
      </Typography>

      {/* Body Copy */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        Thank you for submitting your details. Our team is currently reviewing
        your request. You will receive an update via email or phone once the
        process is complete.
      </Typography>

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        In the meantime, feel free to browse our platform or reach out if you
        have any questions.
      </Typography>
      <Button
  variant="contained"
  sx={{
    mt: 2,
    backgroundColor: "#000",
    color: "#fff",
    "&:hover": { backgroundColor: "#333" },
  }}
  onClick={() => window.location.href = "/"}
>
  Go to Homepage
</Button>

    </Container>
  );
};

export default RequestPending;
