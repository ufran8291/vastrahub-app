// src/Pages/PrivacyPolicy.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function PrivacyPolicy() {
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
          sx={{ fontFamily: "Lora, serif", fontWeight: "bold", mb: 3 }}
        >
          Privacy Policy
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          At VastraHub, we value your privacy and are committed to protecting the personal
          information you share with us. This Privacy Policy explains how we collect, use, disclose,
          and safeguard your data when you use our website, VastraHub.com. By accessing or using
          our platform, you agree to the practices described in this policy.
        </Typography>

        {/* Data Collection */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          1. Data Collection
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We collect various types of personal information to provide you with a seamless B2B
          wholesale experience. This information includes:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              <strong>Contact Information:</strong> Your name, email address, phone number, and alternate phone (if provided).
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Business Details:</strong> Your address, preferred transport method, GSTIN/PAN, and other details provided during registration.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Account Information:</strong> Login credentials and profile details stored in our user collection.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Usage Data:</strong> Information about your interactions with our website, such as pages visited and orders placed.
            </Typography>
          </li>
        </Box>

        {/* Use of Data */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          2. Use of Data
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The information we collect is used for the following purposes:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              To process and fulfill your orders.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              To personalize and improve your shopping experience.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              To communicate with you regarding your account, orders, and important updates.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              To maintain and improve our website, products, and services.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              To comply with legal obligations and enforce our Terms &amp; Conditions.
            </Typography>
          </li>
        </Box>

        {/* Disclosure of Data */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          3. Disclosure of Data
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We do not sell or rent your personal information to third parties. However, we may share your data with:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              Service providers who assist us in operating our website and conducting our business (e.g., payment processors, shipping companies).
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Legal authorities, if required by law or to protect our rights.
            </Typography>
          </li>
        </Box>

        {/* Data Security */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          4. Data Security
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We implement a variety of security measures to protect your personal information. While we strive to secure your data, please
          note that no method of transmission over the Internet is 100% secure.
        </Typography>

        {/* Retention of Data */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          5. Data Retention
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy,
          unless a longer retention period is required by law.
        </Typography>

        {/* Your Rights */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          6. Your Rights
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You have the right to access, update, or request the deletion of your personal information. To exercise these rights, please
          contact our support team at <strong>vastrahub.store@gmail.com</strong>.
        </Typography>

        {/* Changes to this Policy */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          7. Changes to this Policy
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page,
          and your continued use of our website after the posting of changes will constitute your acceptance of such changes.
        </Typography>

        {/* Contact Information */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          8. Contact Information
        </Typography>
        <Typography variant="body1">
          If you have any questions or concerns about this Privacy Policy, please contact us at{" "}
          <strong>vastrahub.store@gmail.com</strong>.
        </Typography>
      </Box>
    </Container>
  );
}
