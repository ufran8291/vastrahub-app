// src/Pages/OTPVerification.js
import React, { useContext, useState } from "react";
import {
  Container,
  TextField,
  Button,
  Card,
  CircularProgress,
  Typography,
  Grid,
} from "@mui/material";
import { toast } from "react-toastify";
import { auth, db } from "../Configs/FirebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../Context/GlobalContext";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

const OTPVerification = () => {
  const navigate = useNavigate();
  const { updateFirestoreUser, signOutUser } = useContext(GlobalContext);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to send OTP
  const handleSendOtp = async () => {
    console.log("Sending OTP process started...");
    if (!/^\d{10}$/.test(phoneNumber.trim())) {
      console.log("Invalid phone number entered:", phoneNumber);
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    console.log("Phone number validated:", phoneNumber);
    setIsSubmitting(true);
    try {
      const formattedPhoneNumber = `+91${phoneNumber.trim()}`;
      console.log("Formatted phone number:", formattedPhoneNumber);
      // Initialize reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved, response:", response);
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired; user must re-verify.");
          },
        }
      );
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        appVerifier
      );
      console.log("OTP sent successfully. Confirmation result:", result);
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast.success("OTP sent to your phone.");
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number format. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      console.log("OTP sending process finished.");
      setIsSubmitting(false);
    }
  };

  // Function to verify OTP
  const handleVerifyOtp = async () => {
    console.log("Verifying OTP process started...");
    if (!otp.trim()) {
      console.log("No OTP entered.");
      toast.error("Please enter the OTP.");
      return;
    }
    console.log("OTP entered:", otp);
    setIsSubmitting(true);
    try {
      if (!confirmationResult) {
        throw new Error("No confirmationResult. Please request a new OTP.");
      }
      console.log("Verifying OTP with Firebase...");
      const result = await confirmationResult.confirm(otp);
      console.log("OTP verified successfully. Firebase result:", result);
      toast.success("OTP verified successfully!");
      // Check if user exists in "users" collection:
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("primaryPhone", "==", phoneNumber.trim()));
      const snapshot = await getDocs(q);
      let userData = null;
      if (!snapshot.empty) {
        userData = snapshot.docs[0].data();
      } else {
        const altQ = query(
          usersRef,
          where("alternatePhone", "==", phoneNumber.trim())
        );
        const altSnapshot = await getDocs(altQ);
        if (!altSnapshot.empty) {
          userData = altSnapshot.docs[0].data();
        }
      }
      // Handle different user stages
      if (userData) {
        const { userStage } = userData;
        console.log("User found:", userData);
        if (userStage === 5) {
          signOutUser();
          navigate("/request-pending");
          return;
        }
        if (userStage === -1) {
          signOutUser();
          toast.error("Your request was rejected by the admin.");
          navigate("/request-rejected");
          return;
        }
        if (userStage === -10) {
          signOutUser();
          navigate("/blocked-user");
          return;
        }
        if (userStage === 10 || userStage === 20) {
          updateFirestoreUser(userData);
          navigate("/");
          return;
        }
        signOutUser();
        navigate("/");
        return;
      }
      // If no user found => new user: redirect to registration
      navigate("/register");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      if (error.code === "auth/invalid-verification-code") {
        toast.error("Invalid OTP. Please check and try again.");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      console.log("OTP verification process finished.");
      setIsSubmitting(false);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Fade triggerOnce>
        <Card
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ p: 4, maxWidth: 500, mx: "auto", boxShadow: 3, borderRadius: 2 }}
        >
          <Typography variant="h5" align="center" gutterBottom>
            Sign-in to VastraHub
          </Typography>
          <form>
            <Grid container spacing={3}>
              {/* Phone Number Input */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  placeholder="Enter your 10-digit phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    console.log("Phone number input changed:", value);
                    setPhoneNumber(value);
                  }}
                  inputProps={{ maxLength: 10 }}
                  disabled={isOtpSent}
                  required
                />
              </Grid>
              {/* OTP Input */}
              {isOtpSent && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                      console.log("OTP input changed:", e.target.value);
                      setOtp(e.target.value);
                    }}
                    required
                  />
                </Grid>
              )}
              {/* Action Button */}
              <Grid item xs={12}>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={isOtpSent ? handleVerifyOtp : handleSendOtp}
                  startIcon={
                    isSubmitting ? <CircularProgress size={24} color="inherit" /> : null
                  }
                  sx={{
                    height: 56,
                    fontSize: "1.2rem",
                    "&:hover": { backgroundColor: "primary.dark" },
                  }}
                >
                  {isOtpSent
                    ? isSubmitting
                      ? "Verifying..."
                      : "Verify OTP"
                    : isSubmitting
                    ? "Sending OTP..."
                    : "Send OTP"}
                </Button>
              </Grid>
            </Grid>
          </form>
          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container" />
        </Card>
      </Fade>
    </Container>
  );
};

export default OTPVerification;
