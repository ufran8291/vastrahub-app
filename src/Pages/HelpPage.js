// src/Pages/HelpPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";
import { FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

// Styling
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
  fontSize: "clamp(2rem, 8vw, 4rem)",
  fontFamily: "Lora, serif",
  fontWeight: "700",
  margin: 0,
  lineHeight: 1.2,
};

const sectionStyle = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
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
  marginBottom: "10px",
  color: "#333",
  flexShrink: 0,
};

const contentStyle = {
  flex: 1,
  minWidth: "200px",
};

const headingStyle = {
  margin: "0 0 10px 0",
  fontSize: "clamp(1.2rem, 5vw, 1.5rem)",
  fontWeight: "600",
  color: "#333",
};

const textStyle = {
  margin: "0 0 5px 0",
  fontSize: "clamp(0.95rem, 4vw, 1rem)",
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
  marginTop: "10px",
  minWidth: "140px",
};

const buttonHoverStyle = {
  backgroundColor: "#555",
};

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, type: "spring", stiffness: 100 },
  }),
};

// Help Section
const HelpSection = ({
  Icon,
  title,
  description,
  highlight,
  onAction,
  actionLabel,
  tooltip,
  index,
}) => (
  <motion.div
    custom={index}
    initial="hidden"
    animate="visible"
    variants={sectionVariants}
    style={sectionStyle}
  >
    <Icon style={iconStyle} />
    <div style={contentStyle}>
      <h3 style={headingStyle}>{title}</h3>
      <p style={textStyle}>
        {description} <span style={highlightStyle}>{highlight}</span>
      </p>
      <Tooltip title={tooltip} arrow>
        <motion.button
          whileHover={buttonHoverStyle}
          style={buttonStyle}
          onClick={onAction}
        >
          {actionLabel}
        </motion.button>
      </Tooltip>
    </div>
  </motion.div>
);

const HelpPage = () => {
  const navigate = useNavigate();
  const phoneNumber = "+91 8275334335";
  const whatsappNumber = "+91 8275334335";
  const supportEmail = "vastrahub.store@gmail.com";

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    const numericNumber = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${numericNumber}`, "_blank");
  };

  const handleEmail = () => {
    window.location.href = `mailto:${supportEmail}`;
  };

  return (
    <>
      {/* Header */}
      <Fade triggerOnce>
        <div style={headerStyle}>
          <h1 style={headerTextStyle}>
            VastraHub : Vyapar ka Naya Tareeka
          </h1>
        </div>
      </Fade>

      {/* Main Content */}
      <div style={containerStyle}>
        <HelpSection
          index={1}
          Icon={FiPhone}
          title="Call Us"
          description="Have a query or need assistance? Reach out to us at"
          highlight={phoneNumber}
          onAction={handleCall}
          actionLabel="Call Now"
          tooltip="Click to call us"
        />
        <HelpSection
          index={2}
          Icon={FaWhatsapp}
          title="Chat with Us on WhatsApp"
          description="Get instant support. Chat with our team at"
          highlight={whatsappNumber}
          onAction={handleWhatsApp}
          actionLabel="Chat Now"
          tooltip="Click to open WhatsApp chat"
        />
        <HelpSection
          index={3}
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
