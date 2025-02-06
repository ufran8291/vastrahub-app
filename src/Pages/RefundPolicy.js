// src/Pages/RefundPolicy.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function RefundPolicy() {
  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Box
        sx={{
          p: 3,
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
          Refund and Replacement Policy
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          At Vastrahub, we take great pride in providing high-quality ready-made garments
          to our B2B wholesale customers. Please carefully review our refund and replacement policy
          outlined below:
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          Confirm Sale &amp; Payment
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Once an order is confirmed and payment has been received, it is considered a final sale.
          No refunds will be processed under normal circumstances.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          Damaged Goods
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          In the rare event that goods received are damaged, a replacement or refund will only be
          considered under the following conditions:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              The damaged goods must be reported to us within 7 days from the delivery date.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Only unsold items with all tags intact and no signs of washing or usage are eligible
              for a refund or replacement.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              The damaged items must be returned in their original condition (unwashed, unused, and
              with original tags attached).
            </Typography>
          </li>
        </Box>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          Return Process
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The customer must initiate the return process by contacting our customer service team at{" "}
          <strong>vastrahub.store@gmail.com</strong> with details of the damaged goods (including
          photographs of the damage) or by sending photos via WhatsApp to our dedicated number.
          Once the return is approved, the customer will be provided with instructions for returning
          the damaged goods. Upon receiving the returned items, we will assess the damage. If the claim
          is validated, a refund for the damaged pieces or a replacement will be processed accordingly.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          Exclusions
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          No refund or replacement will be considered for:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              Items that have been altered, washed, or used.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Items that do not meet the conditions mentioned above (e.g., missing tags, altered packaging).
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Claims made after 7 days of receiving the goods.
            </Typography>
          </li>
        </Box>

        <Typography variant="body1" sx={{ mt: 3 }}>
          We strive to provide our customers with the best quality products, and we understand the
          importance of ensuring that our garments arrive in perfect condition. If you have any
          concerns or need assistance with an order, please don’t hesitate to contact our support team.
        </Typography>
        <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
          Note: We reserve the right to update or modify this policy at any time without prior notice.
        </Typography>
      </Box>
    </Container>
  );
}
