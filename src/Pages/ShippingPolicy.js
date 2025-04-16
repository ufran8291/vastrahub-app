// src/Pages/ShippingPolicy.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function ShippingPolicy() {
  return (
    <Container
      sx={{ mt: 4, mb: 4, fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
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
          Shipping Policy - VastraHub (B2B Wholesale Garment Platform)
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          At VastraHub, we are committed to providing a transparent and efficient
          shipping process tailored for our wholesale B2B clients. Please read
          the following policy carefully to understand how we handle and process
          your shipments.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          1. Order Confirmation
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          As soon as you place an order through our e-commerce platform, you
          will receive an automated email confirming your successful order
          placement. This acts as a preliminary confirmation that your order has
          been received in our system.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          2. Order Acknowledgment &amp; Acceptance
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          After reviewing your order internally, we will send you a separate
          Order Acceptance Email, officially acknowledging and accepting your
          order for processing.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          3. Order Processing Timeline
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          On the same day or the next working day after the Order Acceptance
          Email is sent:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              We will begin processing your order.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Your ordered items will be aggregated from our warehouse.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Once all items are collected, we will box the garments, label the
              parcels with your name and destination city, and mark the shipment
              as &quot;In Transit&quot;. 
            </Typography>
          </li>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>
          Note: &quot;In Transit&quot; indicates that your order has been fully
          packed and is ready for dispatch.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          4. Dispatch Process
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          After the parcels are marked as &quot;In Transit&quot;:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              We will load them into a local loading rickshaw.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              The rickshaw will deliver the shipment to your preferred
              transporter, as specified by you during registration or at the
              time of order confirmation.
            </Typography>
          </li>
        </Box>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          5. Documentation &amp; Communication
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <ul style={{ marginLeft: "1rem" }}>
            <li>
              The Bilty / LR (Lorry Receipt) copy received from the transporter
              will be sent to you via WhatsApp on the same day.
            </li>
            <li>
              An additional physical copy of the LR and invoice will be sent to
              you via post for your systematic record-keeping and filing
              purposes.
            </li>
          </ul>
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          6. Freight Terms &amp; Responsibilities
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <ul style={{ marginLeft: "1rem" }}>
            <li>All shipments are handed over to the transporter on a "To Pay" basis.</li>
            <li>
              The transportation charges from your preferred transporter to your
              final destination must be borne by you (the buyer).
            </li>
            <li>
              VastraHub is only responsible for the shipment until it is safely
              delivered to your nominated transporter.
            </li>
          </ul>
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          7. Delivery Status Update
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Once your order is handed over to the transporter:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              We will mark the order as &quot;Delivered&quot; in our system.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              You will receive a Delivery Confirmation Email.
            </Typography>
          </li>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: "italic" }}>
          Important: &quot;Delivered&quot; status indicates that your parcel has
          been delivered to your preferred transporter and not to your final
          delivery address.
        </Typography>

        <Typography
          variant="h6"
          sx={{ fontFamily: "Lora, serif", mt: 3, mb: 1 }}
        >
          8. Responsibility &amp; Insurance
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          <ul style={{ marginLeft: "1rem" }}>
            <li>
              VastraHub holds full responsibility for the shipment only until it
              reaches your preferred transporter.
            </li>
            <li>
              We are not liable for any delays, damages, or mishandling by the
              transporter post handover.
            </li>
            <li>
              If your transporter offers shipment insurance, we recommend that
              you inform us in advance and opt for it proactively.
            </li>
            <li>
              We highly encourage insuring your shipments to safeguard your
              goods against any unforeseen damage or loss during the transit
              handled by the transporter.
            </li>
          </ul>
        </Typography>

        <Typography variant="body1" sx={{ mt: 3 }}>
          For any queries or clarifications regarding shipping, feel free to
          reach out to our support team.
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Thank you for choosing VastraHub — your trusted partner in wholesale
          garment sourcing.
        </Typography>
      </Box>
    </Container>
  );
}
