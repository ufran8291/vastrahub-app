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
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../Context/GlobalContext";
import { v4 as uuidv4 } from "uuid";

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

  // Generate and update session token after successful login
  const handleSuccessfulLogin = async (userData) => {
    try {
      const sessionToken = uuidv4(); // Generate a unique session token
      console.log("Generated session token:", sessionToken);
      // Update the user's Firestore document with the new session token.
      const userDocRef = doc(db, "users", userData.id);
      await updateDoc(userDocRef, { websiteSessionToken: sessionToken });
      console.log("Updated Firestore with session token for user:", userData.id);
      // Save the token locally (e.g., localStorage)
      localStorage.setItem("websiteSessionToken", sessionToken);
      console.log("Session token stored locally.");
      console.warn(userData);
      // Update global context and navigate as per userStage logic
      updateFirestoreUser(userData);
      navigate("/");
    } catch (error) {
      console.error("Error updating session token:", error);
      toast.error("Failed to set up your session. Please try again.");
    }
  };

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
      if (window.recaptchaVerifier) {
        //
        console.log('ALREADY HAVE A RECAPTCHA CLEARING IT.')
        window.recaptchaVerifier.clear();
      }
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
        userData = { uid: result.user.uid, ...snapshot.docs[0].data() };
        console.log("User found by primaryPhone:", userData);
      } else {
        const altQ = query(
          usersRef,
          where("alternatePhone", "==", phoneNumber.trim())
        );
        const altSnapshot = await getDocs(altQ);
        if (!altSnapshot.empty) {
          userData = { uid: result.user.uid, ...altSnapshot.docs[0].data() };
          console.log("User found by alternatePhone:", userData);
        }
      }
      // Handle different user stages
      if (userData) {
        const { userStage } = userData;
        console.log("User stage:", userStage);
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
          console.log("Successful login for user with stage", userStage);
          // Successful login - update session token and proceed.
          await handleSuccessfulLogin(userData);
          return;
        }
        console.log("User stage did not match known values; signing out.");
        signOutUser();
        navigate("/");
        return;
      }
      console.log("No user found; redirecting to registration.");
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

                {/* New user note with smaller font size */}
                <Typography
                  variant="body2"
                  color="textSecondary"
                  align="center"
                  sx={{ mt: 2 }}
                >
                  New users can also register after verifying their phone number above.
                </Typography>
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
