// src/Pages/TermsAndConditions.js
import React from "react";
import { Container, Typography, Box } from "@mui/material";

export default function TermsAndConditions() {
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
          Terms &amp; Conditions
        </Typography>

        {/* 1. Introduction */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          1. Introduction
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Guru Enterprises operates this website, VastraHub.com. By accessing and using
          the website – including purchasing products – you agree to comply with and be bound
          by these Terms &amp; Conditions. We may update these terms from time to time, so please
          check regularly for any changes.
        </Typography>

        {/* 2. Account Terms */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          2. Account Terms
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          To access pricing and place orders, you must complete registration. Once validated,
          you can submit orders electronically. You are responsible for maintaining the security
          of your account. We are not liable for any loss due to unauthorized account access, and
          we reserve the right to cancel or refuse registration at any time.
        </Typography>

        {/* 3. Acceptable Use &amp; Prohibited Activities */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          3. Acceptable Use &amp; Prohibited Activities
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          You agree not to misuse this website by:
        </Typography>
        <Box component="ul" sx={{ ml: 3, mb: 2 }}>
          <li>
            <Typography variant="body1">
              Engaging in illegal activities, spreading viruses, hacking, or causing harm to others.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Posting harmful, offensive, or defamatory content.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Using this site to infringe intellectual property rights.
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              Sharing your account with others.
            </Typography>
          </li>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Breaches may result in legal action and account termination.
        </Typography>

        {/* 4. Terms of Sale */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          4. Terms of Sale
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          By placing an order, you are making an offer to buy goods subject to availability and price
          confirmation. Orders will be processed once payment is confirmed. We reserve the right to
          refuse or cancel any order. If we cannot fulfill your order, we will notify you and provide
          options to proceed or cancel. Orders are considered confirmed only after you receive a second
          confirmation email from us.
        </Typography>

        {/* 5. Pricing &amp; Availability */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          5. Pricing &amp; Availability
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We strive to ensure accuracy in product details and prices. In case of a pricing error,
          we will notify you and offer the option to cancel or confirm at the correct price. Delivery
          costs may apply and are shown during checkout.
        </Typography>

        {/* 6. Payment */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          6. Payment
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Orders are confirmed only after full payment is received through our payment gateway.
        </Typography>

        {/* 7. After Sale Policy */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          7. After Sale Policy
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Once an order is confirmed, no cancellations will be accepted. Returns or exchanges are not
          allowed except for defective goods. Products may vary slightly in color due to fabric types
          and washing processes.
        </Typography>

        {/* 8. Disclaimer of Liability */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          8. Disclaimer of Liability
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The materials on this website are provided without warranties or guarantees. We are not liable
          for any damages—including loss of data or profits—arising from the use of this website, except
          where caused by our negligence or fraudulent misrepresentation.
        </Typography>

        {/* 9. Linking to Our Website */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          9. Linking to Our Website
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You may link to our homepage but not to any other part of the site or suggest any endorsement
          or affiliation without our consent. We reserve the right to withdraw linking permissions at any time.
        </Typography>

        {/* 10. Trademarks &amp; Copyright */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          10. Trademarks &amp; Copyright
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          All trademarks, third-party names, and images on this site are the property of their respective owners.
          References to these brands are for identification purposes only.
        </Typography>

        {/* 11. Indemnity */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          11. Indemnity
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You agree to indemnify VastraHub.com and its affiliates from any claims, damages, or liabilities arising
          from your use of the website or violation of these Terms.
        </Typography>

        {/* 12. Changes to Terms */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          12. Changes to Terms
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          VastraHub.com reserves the right to modify or remove any part of these Terms without notice. Continued use
          of the website constitutes acceptance of any changes.
        </Typography>

        {/* 13. Invalidity */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          13. Invalidity
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          If any part of these Terms is deemed unenforceable, the remaining terms will remain in effect.
          We may revise unenforceable clauses to closely reflect the original intent.
        </Typography>

        {/* 14. Complaints */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          14. Complaints
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          If you have any complaints or feedback, please contact us at{" "}
          <strong>vastrahub.store@gmail.com</strong>. Only complaints should be sent to this address.
        </Typography>

        {/* 15. Waiver */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          15. Waiver
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Failure to act on a breach of these Terms does not waive our right to enforce them in the future.
        </Typography>

        {/* 16. Entire Agreement */}
        <Typography variant="h6" sx={{ fontFamily: "Lora, serif", mb: 1 }}>
          16. Entire Agreement
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          These Terms constitute the entire agreement between you and VastraHub.com and replace any prior
          agreements. Any waiver of these Terms must be in writing and signed by a director of Guru Enterprises.
        </Typography>
      </Box>
    </Container>
  );
}
