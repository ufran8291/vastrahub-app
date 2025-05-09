// src/components/Footer.js
import React, { useState, useContext } from 'react';
import '../App.css';
import { FaInstagram, FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GlobalContext } from '../Context/GlobalContext';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

export default function Footer() {
  const navigate = useNavigate();
  const { sendEmail, currentUser, firestoreUser } = useContext(GlobalContext);
  const [phoneNumberUser, setPhoneNumberUser] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const validatePhoneNumber = (phone) => {
    const trimmed = phone.trim();
    const regex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return regex.test(trimmed);
  };

  const joinedOnFormatted = firestoreUser?.JoinedOn?.toDate
    ? firestoreUser.JoinedOn.toDate().toLocaleDateString("en-GB")
    : "N/A";

  const fullPreviewContent = `
📞 Submitted Phone Number: ${phoneNumberUser.trim()}
👤 Name: ${firestoreUser?.name || "N/A"}
🏢 Business Name: ${firestoreUser?.businessName || "N/A"}
📱 Registered Phone: ${firestoreUser?.primaryPhone || "N/A"}
📞 Alternate Phone: ${firestoreUser?.alternatePhone || "N/A"}
🗓️ Member Since: ${joinedOnFormatted}
🧾 GSTIN: ${firestoreUser?.gstin || "N/A"}
🪪 PAN: ${firestoreUser?.pan || "N/A"}
📧 Email: ${firestoreUser?.email || "N/A"}
`;

  const handleBroadcastSubmit = () => {
    if (!currentUser || !firestoreUser) {
      toast.info("Please log in to join the broadcast channel.");
      navigate("/otp-verify");
      return;
    }

    if (!validatePhoneNumber(phoneNumberUser)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setPreviewOpen(true);
  };

  const confirmSendEmail = async () => {
    const subject = "Broadcast Channel Request";
    try {
      const emailResponse = await sendEmail({
        email: "vastrahub.store@gmail.com",
        subject,
        content: fullPreviewContent,
      });
      console.log("Email sent response:", emailResponse);
      toast.success("Your request has been sent successfully!");
      setPhoneNumberUser('');
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send request. Please try again later.");
    } finally {
      setPreviewOpen(false);
    }
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <footer
      style={{
        backgroundColor: '#161515',
        color: '#fff',
        padding: '40px 20px',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div className="container">
        {/* Top Section */}
        <div
          className="top-footer"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'space-between',
            marginBottom: '30px',
            gap: '30px',
          }}
        >
          {/* WhatsApp Broadcast Section */}
          <div style={{ flex: '1 1 250px', maxWidth: '300px' }}>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '20px' }}>
              WHATSAPP BROADCAST
            </h4>
            <p style={{ fontSize: '15px', marginBottom: '10px' }}>
              Join our WhatsApp Broadcast to receive the latest updates on offers and new arrivals.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #aaa',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <input
                type="text"
                placeholder="Enter your phone number"
                value={phoneNumberUser}
                onChange={(e) => setPhoneNumberUser(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleBroadcastSubmit}
                disabled={!validatePhoneNumber(phoneNumberUser)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: validatePhoneNumber(phoneNumberUser) ? '#fff' : '#555',
                  padding: '10px',
                  cursor: validatePhoneNumber(phoneNumberUser) ? 'pointer' : 'not-allowed',
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Company Section */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '20px' }}>
              COMPANY
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={linkStyle} onClick={() => navigate("/about-us")}>About Us</li>
              <li style={linkStyle} onClick={() => navigate("/contact")}>Careers</li>
              <li style={linkStyle} onClick={() => navigate("/contact")}>Contact Us</li>
            </ul>
          </div>

          {/* Help Section */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '20px' }}>
              HELP
            </h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={linkStyle} onClick={() => navigate("/terms-and-conditions")}>Terms &amp; Conditions</li>
              <li style={linkStyle} onClick={() => navigate("/refund-policy")}>Refund &amp; Replacement Policy</li>
              <li style={linkStyle} onClick={() => navigate("/shipping-policy")}>Shipping Policy</li>
              <li style={linkStyle} onClick={() => navigate("/privacy-policy")}>Privacy Policy</li>
            </ul>
          </div>

          {/* Contact Section */}
          <div style={{ flex: '1 1 200px' }}>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '20px' }}>
              CONTACT
            </h4>
            <p style={{ fontSize: '15px', marginBottom: '5px' }}>Call us Monday–Saturday</p>
            <p style={{ fontSize: '15px', marginBottom: '5px' }}>11am–8pm IST or email anytime!</p>
            <p style={{ fontSize: '15px', marginBottom: '5px' }}>vastrahub.store@gmail.com</p>
            <p style={{ fontSize: '15px' }}>+91 8275334335</p>
          </div>
        </div>

        {/* Social Icons */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '50px',
            marginBottom: '50px',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '20px' }}>
            <FaInstagram style={socialIconStyle} onClick={() => window.open("https://www.instagram.com/vastrahub.in/", "_blank")} />
            <FaWhatsapp style={socialIconStyle} onClick={() => window.open("https://wa.me/918275334335", "_blank")} />
            <FaFacebook style={socialIconStyle} onClick={() => window.open("https://www.instagram.com/vastrahub.in/", "_blank")} />
          </div>
        </div>

        <hr style={{ borderTop: '1px solid #fff', margin: '40px 0' }} />

        {/* Bottom Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <p style={{ fontSize: '14px' }}>© 2024 VastraHub Clothing</p>
          <p
            style={{ fontSize: '14px', cursor: 'pointer' }}
            onClick={() => window.location.href = "https://visionforgetech.web.app/"}
          >
            Made with <span style={{ color: 'red' }}>❤️</span> by VisionForge
          </p>
        </div>
      </div>

      {/* Modal Preview */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box sx={{
          maxWidth: 500,
          bgcolor: '#fff',
          boxShadow: 24,
          p: 4,
          borderRadius: '10px',
          mx: 'auto',
          mt: '10%',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '15px' }}>
            Confirm Submission
          </h2>
          <pre style={{ fontSize: '13px', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
            {fullPreviewContent}
          </pre>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setPreviewOpen(false)} variant="outlined" size="small">
              Cancel
            </Button>
            <Button onClick={confirmSendEmail} variant="contained" size="small" color="primary">
              Confirm & Send
            </Button>
          </div>
        </Box>
      </Modal>
    </footer>
  );
}

// Common small styles
const linkStyle = {
  fontSize: '15px',
  marginBottom: '8px',
  cursor: 'pointer',
};

const socialIconStyle = {
  fontSize: '24px',
  cursor: 'pointer',
};

