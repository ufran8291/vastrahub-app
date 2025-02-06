// src/Components/Footer.js
import React from 'react';
import '../App.css';
import { FaInstagram, FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer style={{ backgroundColor: '#161515', color: '#fff', padding: '40px 20px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="container">
        {/* Top Section */}
        <div className="top-footer d-flex justify-content-between" style={{ marginBottom: '30px' }}>
          {/* WhatsApp Broadcast Section */}
          <div>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '30px' }}>WHATSAPP BROADCAST</h4>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', marginBottom: '10px' }}>Join our WhatsApp Broadcast</p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #aaa',
                borderRadius: '5px',
                overflow: 'hidden',
                maxWidth: '300px',
              }}
            >
              <input
                type="text"
                placeholder="Enter your phone number"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  padding: '10px',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              />
              <button
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#aaa',
                  padding: '10px',
                  cursor: 'pointer',
                }}
              >
                →
              </button>
            </div>
          </div>

          {/* Company Section */}
          <div>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '30px' }}>COMPANY</h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              <li
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  marginBottom: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate("/about-us")}
              >
                About Us
              </li>
              <li
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  marginBottom: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate("/careers")}
              >
                Careers
              </li>
            </ul>
          </div>

          {/* Help Section */}
          <div>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '30px' }}>HELP</h4>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              <li
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  marginBottom: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate("/terms-and-conditions")}
              >
                Terms &amp; Conditions
              </li>
              <li
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  marginBottom: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate("/refund-policy")}
              >
                Refund &amp; Replacement Policy
              </li>
              <li
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate("/privacy-policy")}
              >
                Privacy Policy
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 style={{ fontFamily: 'Lora, serif', fontWeight: '500', fontSize: '18px', marginBottom: '30px' }}>CONTACT</h4>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', marginBottom: '5px' }}>Call us Monday–Friday</p>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', marginBottom: '5px' }}>9am–5pm IST or email anytime!</p>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px', marginBottom: '5px' }}>hello@vastrahubl.com</p>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px' }}>+91234567890</p>
          </div>
        </div>

        {/* Social Icons and Payment Methods */}
        <div className="socials-payment d-flex justify-content-between align-items-center" style={{ marginTop:'50px', marginBottom: '50px' }}>
          {/* Social Icons */}
          <div className="social-icons d-flex">
            <FaInstagram style={{ fontSize: '24px', marginRight: '15px', cursor: 'pointer' }} />
            <FaWhatsapp style={{ fontSize: '24px', marginRight: '15px', cursor: 'pointer' }} />
            <FaFacebook style={{ fontSize: '24px', marginRight: '15px', cursor: 'pointer' }} />
          </div>

          {/* Payment Methods (Placeholder Icons) */}
          <div className="payment-methods d-flex">
            <FaInstagram style={{ fontSize: '24px', marginRight: '15px' }} />
            <FaWhatsapp style={{ fontSize: '24px', marginRight: '15px' }} />
            <FaFacebook style={{ fontSize: '24px' }} />
          </div>
        </div>

        {/* Horizontal Divider */}
        <hr style={{ borderTop: '1px solid #fff', margin: '40px 0' }} />

        {/* Bottom Section */}
        <div className="bottom-footer d-flex justify-content-between align-items-center">
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' }}>© 2024 VastraHub Clothing</p>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' }}>
            Made with <span style={{ color: 'red' }}>❤️</span> by VisionForge
          </p>
        </div>
      </div>
    </footer>
  );
}
