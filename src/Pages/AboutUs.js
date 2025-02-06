// src/Pages/AboutUs.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function AboutUs() {
  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontFamily: "Lora, serif", fontWeight: "bold" }}
        >
          About Us
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          At VastraHub, we are committed to providing a seamless, premium B2B wholesale experience tailored specifically for the garment industry. Established under Guru Enterprises, VastraHub.com is designed to serve as a cutting-edge online platform that keeps you updated on the latest trends in textiles while offering high-quality products that are carefully handpicked to meet the needs of our valued customers.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Our journey began with Guru Enterprises, initially known as Guru Agencies and Rajdeep Agencies, which grew rapidly as a trusted wholesale business. Thanks to the support of our loyal customers, manufacturing partners, and the grace of God, we expanded our reach and curated an extensive portfolio of premium brands. Today, we offer a diverse selection of products suited to all types of retail businesses.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          At VastraHub, we take pride in delivering only the finest quality products at competitive prices. Our dedicated team works tirelessly to enhance your online shopping experience, ensuring it remains intuitive, efficient, and hassle-free. We understand the importance of convenience in your trading operations, and we strive to make every interaction on our platform as smooth as possible.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          We value your feedback and are continuously looking for ways to improve and evolve. Thank you for choosing VastraHub—we are excited to be part of your business growth, and we wish you happy and successful trading with us!
        </Typography>

        <Typography variant="h6" align="center" sx={{ mt: 3, fontFamily: "Lora, serif", fontWeight: "bold" }}>
          VastraHub – Where Quality Meets Convenience.
        </Typography>
      </Box>
    </Container>
  );
}
