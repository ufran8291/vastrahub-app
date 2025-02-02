// src/Pages/HelpPage.js

import React from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";

// Import icons from react-icons (feel free to choose your preferred icons)
import { FiPhone } from "react-icons/fi";      // Phone icon
import { FaWhatsapp } from "react-icons/fa";   // WhatsApp icon
import { MdEmail } from "react-icons/md";       // Email icon

// Styling objects
const containerStyle = {
  fontFamily: "Plus Jakarta Sans, sans-serif",
  padding: "40px 20px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const headerStyle = {
  backgroundColor: "#000",
  padding: "80px 20px",
  textAlign: "center",
};

const headerTextStyle = {
  color: "#fff",
  fontSize: "4rem",
  fontFamily: "Lora, serif",
  fontWeight: "700",
  margin: 0,
};

const sectionStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "20px",
  margin: "20px 0",
  border: "1px solid #ddd",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const iconStyle = {
  fontSize: "60px",
  marginRight: "20px",
  color: "#333",
};

const contentStyle = {
  flex: 1,
};

const headingStyle = {
  margin: "0 0 10px 0",
  fontSize: "1.5rem",
  fontWeight: "600",
  color: "#333",
};

const textStyle = {
  margin: "0 0 5px 0",
  fontSize: "1rem",
  color: "#555",
};

const highlightStyle = {
  fontWeight: "700",
  color: "#000",
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "1rem",
  fontWeight: "600",
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "background-color 0.3s",
};

const buttonHoverStyle = {
  backgroundColor: "#555",
};

// HelpSection component
const HelpSection = ({ Icon, title, description, highlight, onAction, actionLabel, tooltip }) => (
  <div style={sectionStyle}>
    <Icon style={iconStyle} />
    <div style={contentStyle}>
      <h3 style={headingStyle}>{title}</h3>
      <p style={textStyle}>
        {description} <span style={highlightStyle}>{highlight}</span>
      </p>
    </div>
    <Tooltip title={tooltip} arrow>
      <button
        style={buttonStyle}
        onClick={onAction}
        onMouseEnter={(e) =>
          Object.assign(e.currentTarget.style, buttonHoverStyle)
        }
        onMouseLeave={(e) =>
          Object.assign(e.currentTarget.style, { backgroundColor: "#333" })
        }
      >
        {actionLabel}
      </button>
    </Tooltip>
  </div>
);

const HelpPage = () => {
  const navigate = useNavigate();

  // Sample contact details – update these as needed
  const phoneNumber = "+91 9876543210";
  const whatsappNumber = "+91 9876543210";
  const supportEmail = "support@vastrahub.com";

  // Handlers for button actions
  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    // Remove any non-numeric characters before constructing URL
    const numericNumber = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${numericNumber}`, "_blank");
  };

  const handleEmail = () => {
    window.location.href = `mailto:${supportEmail}`;
  };

  return (
    <>
      {/* Header / Loader (Full Black Screen with Centered Text) */}
      <div style={headerStyle}>
        <h1 style={headerTextStyle}>VastraHub : Vyapar ka Naya Tareeka</h1>
      </div>

      {/* Main Content */}
      <div style={containerStyle}>
        <HelpSection
          Icon={FiPhone}
          title="Call Us"
          description="Have a query or need assistance? Reach out to us at"
          highlight={phoneNumber}
          onAction={handleCall}
          actionLabel="Call Now"
          tooltip="Click to call us"
        />
        <HelpSection
          Icon={FaWhatsapp}
          title="Chat with Us on WhatsApp"
          description="Get instant support. Chat with our team at"
          highlight={whatsappNumber}
          onAction={handleWhatsApp}
          actionLabel="Chat Now"
          tooltip="Click to open WhatsApp chat"
        />
        <HelpSection
          Icon={MdEmail}
          title="Write an Email"
          description="Prefer writing? Email us at"
          highlight={supportEmail}
          onAction={handleEmail}
          actionLabel="Email Us"
          tooltip="Click to compose an email"
        />
      </div>
    </>
  );
};

export default HelpPage;
