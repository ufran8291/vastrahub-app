// src/Pages/AboutUs.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function AboutUs() {
  return (
    <Container
      sx={{
        mt: 4,
        mb: 4,
        px: { xs: 2, md: 4 },
        fontFamily: "Plus Jakarta Sans, sans-serif",
        maxWidth: "lg",
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#fafafa",
        }}
      >
        {/* Page Title */}
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontFamily: "Lora, serif",
            fontWeight: "bold",
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          About Us&nbsp;–&nbsp;VastraHub
        </Typography>

        {/* Welcome */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          Welcome
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          Welcome to <strong>VastraHub</strong>&nbsp;— your trusted B2B wholesale partner in the garment
          industry. Powered by Guru&nbsp;Enterprises, VastraHub.com is a cutting‑edge online platform designed
          to keep you ahead of textile trends while providing premium, carefully curated products tailored to
          your business needs.
        </Typography>

        {/* Our Story */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          Our Story
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          Our journey began with <strong>Guru&nbsp;Enterprises</strong>, previously known as Guru&nbsp;Agencies
          and Rajdeep&nbsp;Agencies, which quickly earned a strong reputation as a reliable wholesale business.
          With the continued support of our loyal customers, manufacturing partners, and by the grace of God,
          we expanded our reach and built a diverse portfolio of premium brands.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          In&nbsp;2021, we proudly launched our in‑house garment manufacturing line under the brand
          <strong>&nbsp;VastraHub&nbsp;Essentials</strong>. This move enables us to guarantee top‑tier quality and
          competitive pricing by eliminating middle layers and maintaining full control over production.
        </Typography>

        {/* What We Offer */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          What&nbsp;We&nbsp;Offer
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          At VastraHub, our mission is simple: deliver the finest quality garments at the best value. Our team
          is dedicated to providing a seamless and efficient B2B shopping experience — both offline and
          online. Whether you’re visiting our stores or exploring our platform, we prioritize convenience,
          transparency, and satisfaction at every touchpoint.
        </Typography>

        {/* Offline Stores */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          Offline&nbsp;Stores
        </Typography>
        <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
          We currently operate two B2B wholesale outlets in Chhatrapati&nbsp;Sambhaji&nbsp;Nagar
          (Aurangabad), Maharashtra, India:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Head&nbsp;Office:</strong>&nbsp;Guru&nbsp;Enterprises, Padampani Colony, Railway Station&nbsp;Road
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Branch&nbsp;Office:</strong>&nbsp;Guru&nbsp;Enterprises&nbsp;(VastraHub), Shop&nbsp;No.&nbsp;2, B.H.R Market, Anguribagh
            </Typography>
          </li>
        </Box>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          In our physical stores, customers can feel the fabrics firsthand, explore samples, and personalize
          their orders to meet specific business needs. We encourage every business partner to visit us at
          least once to experience the quality in person and build a lasting, mutually beneficial relationship.
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2, fontSize: { xs: "0.85rem", md: "0.9rem" } }}>
          P.S.&nbsp;Both stores feature dedicated, systematic sampling areas showcasing every available product.
        </Typography>

        {/* Online Platform */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          Online&nbsp;Platform
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          Our full product catalog is available online at <strong>vastrahub.com</strong> and through our dedicated
          mobile apps on both the Android Play&nbsp;Store and Apple App&nbsp;Store.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          To maintain B2B exclusivity and uphold industry privacy standards, full access to our platform is
          granted only to verified garment business owners and retail showroom operators. Product rates,
          availability, and order quantities remain hidden from the public to protect the integrity of business
          operations.
        </Typography>

        {/* Why VastraHub */}
        <Typography
          variant="h6"
          sx={{ mt: 3, fontWeight: "bold", fontSize: { xs: "1.2rem", md: "1.5rem" } }}
        >
          Why&nbsp;VastraHub?
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Premium&nbsp;Products:</strong>&nbsp;Every item is hand‑picked for quality and style.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Seamless&nbsp;Experience:</strong>&nbsp;Online and offline platforms tailored for B2B efficiency.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Transparent&nbsp;Operations:</strong>&nbsp;Clear communication and dependable service.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ fontSize: { xs: "0.95rem", md: "1rem" } }}>
              <strong>Privacy&nbsp;First:</strong>&nbsp;Business data and rates secured and visible only to
              approved partners.
            </Typography>
          </li>
        </Box>

        {/* Closing */}
        <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: "0.95rem", md: "1rem" } }}>
          We deeply value your feedback and continuously strive to improve. Thank you for making
          VastraHub a part of your business journey. We look forward to growing together.
        </Typography>

        {/* Tagline */}
        <Typography
          variant="h6"
          align="center"
          sx={{
            mt: 4,
            fontFamily: "Lora, serif",
            fontWeight: "bold",
            fontSize: { xs: "1.5rem", md: "2rem" },
          }}
        >
          VastraHub&nbsp;– Where Quality Meets Convenience.
        </Typography>
      </Box>
    </Container>
  );
}
