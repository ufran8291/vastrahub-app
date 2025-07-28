// DeleteAccount.js  –  Secure account‑deletion request page
import React, { useContext, useState } from "react";
import {
  Container,
  Card,
  Typography,
  Grid,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { GlobalContext } from "../Context/GlobalContext";
import { auth, db } from "../Configs/FirebaseConfig";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const DeleteAccount = () => {
  /* ───────── context / nav ───────── */
  const { sendEmail, signOutUser } = useContext(GlobalContext);
  const navigate = useNavigate();

  /* ───────── local state ───────── */
  // 0 = intro, 1 = phone entry, 2 = otp entry, 3 = success
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  /* ───────── helpers ───────── */
  const sendOtp = async () => {
    const cleaned = phone.trim();
    if (!/^\d{10}$/.test(cleaned)) {
      toast.error("Enter a valid 10‑digit phone number.");
      return;
    }
    try {
      setIsSubmitting(true);
      // fresh invisible reCAPTCHA
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      const result = await signInWithPhoneNumber(
        auth,
        `+91${cleaned}`,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      toast.success("OTP sent to your phone.");
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP – try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtpAndRequestDeletion = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP.");
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await confirmationResult.confirm(otp.trim());
      // result.user now signed‑in with this phone – capture uid
      const uid = result.user.uid;

      /* 🔹 send admin e‑mail */
      await sendEmail({
        email: "vastrahub.store@gmail.com",
        subject: `Account‑deletion request – Phone: ${phone.trim()} – UID: ${uid}`,
        content: `A customer has requested deletion of their VastraHub account via the website.\n\nPhone : ${phone.trim()}\nUID   : ${uid}\nRequest channel : PUBLIC WEB PAGE`,
      });

      /* 🔹 invalidate any existing websiteSessionToken (if user document exists) */
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("primaryPhone", "==", phone.trim())
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userDocRef = doc(db, "users", snapshot.docs[0].id);
          await updateDoc(userDocRef, { websiteSessionToken: uuidv4() });
        }
      } catch (err) {
        console.warn("Could not invalidate session token:", err);
      }

      /* 🔹 sign the user out everywhere */
      await signOutUser();

      toast.success("Request submitted! We’ll e‑mail you once processed.");
      setStep(3);
    } catch (err) {
      console.error(err);
      const msg =
        err.code === "auth/invalid-verification-code"
          ? "Invalid OTP. Please try again."
          : "Verification failed – please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───────── UI ───────── */
  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Fade triggerOnce>
        <Card
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ p: 4, maxWidth: 600, mx: "auto", boxShadow: 3, borderRadius: 2 }}
        >
          {/* STEP 0 – intro */}
          {step === 0 && (
            <>
              <Typography variant="h5" gutterBottom align="center">
                Delete My VastraHub Account
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Deleting your account is <strong>permanent</strong>. All profile
                details, orders, and stored data will be removed. If you decide
                to come back later you’ll need to register again from scratch.
              </Typography>
              <Typography variant="body2" sx={{ mb: 4 }}>
                To start, click Continue and verify the phone number you
                registered with. We use OTP verification to make sure only the
                rightful owner can request deletion.
              </Typography>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </>
          )}

          {/* STEP 1 – phone entry */}
          {step === 1 && (
            <>
              <Typography variant="h6" gutterBottom align="center">
                Enter Registered Phone Number
              </Typography>
              <TextField
                fullWidth
                placeholder="10‑digit phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                sx={{ mb: 3 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setStep(0)}
                  >
                    Back
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={sendOtp}
                    disabled={isSubmitting}
                    startIcon={isSubmitting && <CircularProgress size={20} />}
                  >
                    {isSubmitting ? "Sending…" : "Send OTP"}
                  </Button>
                </Grid>
              </Grid>
            </>
          )}

          {/* STEP 2 – OTP entry */}
          {step === 2 && (
            <>
              <Typography variant="h6" gutterBottom align="center">
                Verify OTP
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }} align="center">
                Enter the 6‑digit OTP we just sent to <strong>{phone}</strong>.
              </Typography>
              <TextField
                fullWidth
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                sx={{ mb: 3 }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setOtp("");
                      setStep(1);
                    }}
                  >
                    Back
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={verifyOtpAndRequestDeletion}
                    disabled={isSubmitting}
                    startIcon={isSubmitting && <CircularProgress size={20} />}
                  >
                    {isSubmitting ? "Verifying…" : "Submit Request"}
                  </Button>
                </Grid>
              </Grid>
            </>
          )}

          {/* STEP 3 – success */}
          {step === 3 && (
            <>
              <Typography variant="h5" gutterBottom align="center">
                Request Received
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                Your deletion request has been recorded. We normally complete
                deletions within 1‑2 days. You’ll receive a confirmation e‑mail
                when everything is removed.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/signin")}
              >
                Close
              </Button>
            </>
          )}
        </Card>
      </Fade>

      {/* invisible reCAPTCHA */}
      <div id="recaptcha-container" />
    </Container>
  );
};

export default DeleteAccount;
