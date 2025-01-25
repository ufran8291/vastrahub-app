import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { db, auth } from "../Configs/FirebaseConfig"; // Make sure you import `auth` if not already
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";

const allIndianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const NewUser = () => {
  const navigate = useNavigate();

  // On mount, we will fetch `currentUser.phoneNumber` from Firebase Auth.
  // That phone number is final (user cannot edit).
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // If the user is signed in with phone auth, phoneNumber should be available
    const user = auth.currentUser;
    if (user && user.phoneNumber) {
      // Remove the leading '+91' if you want just the last 10 digits,
      // or keep it intact if you prefer the full E.164 format.
      setPhoneNumber(user.phoneNumber);
    } else {
      // If there's no user or phoneNumber, you might want to redirect
      // or show an error. For now, just log it.
      console.warn("No authenticated user or phone number not found.");
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    country: "India", // fixed country
    state: "",
    city: "",
    pincode: "",
    alternatePhone: "",
    businessName: "",
    gstin: "",
    email: "",
    confirmEmail: "",
    pan: "",
    transportService: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate the form data
  const validateInputs = () => {
    const {
      name,
      address,
      country,
      state,
      city,
      pincode,
      alternatePhone,
      businessName,
      gstin,
      pan,
      email,
      confirmEmail,
    } = formData;

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const pincodeRegex = /^[0-9]{6}$/;

    // Basic checks
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!address.trim()) {
      toast.error("Please enter the full address.");
      return false;
    }
    if (!country) {
      toast.error("Country must be selected.");
      return false;
    }
    if (!state) {
      toast.error("Please select a state/UT.");
      return false;
    }
    if (!city.trim()) {
      toast.error("Please enter the city name.");
      return false;
    }
    if (!pincodeRegex.test(pincode)) {
      toast.error("Invalid pincode! Must be a 6-digit number.");
      return false;
    }

    // The primary phone is set from `phoneNumber` state, so no need to revalidate here,
    // but if you want to ensure it's a 10-digit format without country code, you could do that check.

    if (alternatePhone && !phoneRegex.test(alternatePhone)) {
      toast.error("Invalid alternate phone format! Must be 10 digits.");
      return false;
    }
    if (!businessName.trim()) {
      toast.error("Please enter your business/organization name.");
      return false;
    }
    if (!gstin && !pan) {
      toast.error("Please provide either GSTIN or PAN number.");
      return false;
    }
    if (gstin && !gstinRegex.test(gstin)) {
      toast.error("Invalid GSTIN format! Please check your GSTIN.");
      return false;
    }
    if (pan && !panRegex.test(pan)) {
      toast.error("Invalid PAN format! Example: ABCDE1234F.");
      return false;
    }
    if (!email) {
      toast.error("Please enter your email address.");
      return false;
    }
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format! Please enter a valid email.");
      return false;
    }
    if (email !== confirmEmail) {
      toast.error("Emails do not match! Please confirm your email.");
      return false;
    }

    return true;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsSubmitting(true);

    // Trim fields
    const trimmedData = {
      ...formData,
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      businessName: formData.businessName.trim(),
      gstin: formData.gstin.trim(),
      pan: formData.pan.trim(),
      email: formData.email.trim(),
      confirmEmail: formData.confirmEmail.trim(),
      alternatePhone: formData.alternatePhone.trim(),
      transportService: formData.transportService.trim(),
    };

    try {
      const usersCollection = collection(db, "users");

      // Check if phoneNumber is actually available
      if (!phoneNumber) {
        toast.error("No verified phone number found. Please retry OTP verification.");
        setIsSubmitting(false);
        return;
      }

      // We'll store the phone number in primaryPhone
      const primaryPhone = phoneNumber.replace("+91", ""); 
      // If you want the raw phone number with country code, skip the replace.

      // Check GSTIN duplication
      if (trimmedData.gstin) {
        const gstinQuery = query(usersCollection, where("gstin", "==", trimmedData.gstin));
        const gstinSnapshot = await getDocs(gstinQuery);
        if (!gstinSnapshot.empty) {
          toast.error("A user with this GSTIN already exists!");
          setIsSubmitting(false);
          return;
        }
      }

      // Check PAN duplication
      if (trimmedData.pan) {
        const panQuery = query(usersCollection, where("pan", "==", trimmedData.pan));
        const panSnapshot = await getDocs(panQuery);
        if (!panSnapshot.empty) {
          toast.error("A user with this PAN already exists!");
          setIsSubmitting(false);
          return;
        }
      }

      // Check for existing primaryPhone in Firestore
      const phoneQuery = query(usersCollection, where("primaryPhone", "==", primaryPhone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        toast.error("A user with this Primary Phone number already exists!");
        setIsSubmitting(false);
        return;
      }

      // If checks pass, proceed
      const userId = uuidv4();
      const userData = {
        ...trimmedData,
        id: userId,
        JoinedOn: new Date(),
        blockStage: 0,
        userStage: 5, // newly created user stage
        isPremium: false,
        primaryPhone,   // override the primary phone with verified phoneNumber
      };

      await setDoc(doc(usersCollection, userId), userData);
      toast.success("User registration successful!");

      // Reset the form
      setFormData({
        name: "",
        address: "",
        country: "India",
        state: "",
        city: "",
        pincode: "",
        alternatePhone: "",
        businessName: "",
        gstin: "",
        email: "",
        confirmEmail: "",
        pan: "",
        transportService: "",
      });

      navigate("/registration-success"); // or wherever you want to go after registration
    } catch (error) {
      console.error("Error checking or adding user:", error);
      toast.error("Error adding user: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ p: 4, maxWidth: 700, mx: "auto", boxShadow: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Register to VastraHub
        </Typography>
        <Typography variant="p" align="center" gutterBottom>
         View Prices, Place & Manage Orders, 
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Full Name */}
            <Grid item xs={12}>
              <Tooltip title="Enter your official full name as per documents" arrow>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>

            {/* Address Details Header */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address Details
              </Typography>
            </Grid>

            {/* Full Address */}
            <Grid item xs={12}>
              <Tooltip title="Include flat/house no., street, landmark, etc." arrow>
                <TextField
                  fullWidth
                  label="Full Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  multiline
                  rows={3}
                  helperText="E.g., House No. 123, MG Road, Near Central Mall"
                />
              </Tooltip>
            </Grid>

            {/* Country & State/UT */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>State/UT</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  {allIndianStates.map((stateName) => (
                    <MenuItem key={stateName} value={stateName}>
                      {stateName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* City & Pincode */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Your city or district name" arrow>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="6-digit Indian postal code" arrow>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>

            {/* Primary Phone (auto-filled from auth.currentUser) */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="This phone is verified with OTP" arrow>
                <TextField
                  fullWidth
                  label="Primary Phone (Verified)"
                  name="primaryPhone"
                  value={phoneNumber} // from state
                  onChange={() => {}} // do nothing, read-only
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Verified phone number"
                />
              </Tooltip>
            </Grid>

            {/* Alternate Phone (optional) */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Optional alternate phone number" arrow>
                <TextField
                  fullWidth
                  label="Alternate Phone"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  helperText="10-digit phone number"
                />
              </Tooltip>
            </Grid>

            {/* Business/Organization Name */}
            <Grid item xs={12}>
              <Tooltip title="Enter your business or organization name" arrow>
                <TextField
                  fullWidth
                  label="Business/Organization Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>

            {/* GSTIN & PAN */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Enter your 15-digit GSTIN (optional if PAN is provided)" arrow>
                <TextField
                  fullWidth
                  label="GSTIN"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  helperText="Optional if PAN is provided"
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Enter your 10-character PAN (optional if GSTIN is provided)" arrow>
                <TextField
                  fullWidth
                  label="PAN Number"
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                  helperText="Optional if GSTIN is provided"
                />
              </Tooltip>
            </Grid>

            {/* Preferred Transport Service */}
            <Grid item xs={12}>
              <Tooltip title="Share your preferred transporter for deliveries" arrow>
                <TextField
                  fullWidth
                  label="Preferred Transport Service"
                  name="transportService"
                  value={formData.transportService}
                  onChange={handleInputChange}
                  helperText="Optional"
                />
              </Tooltip>
            </Grid>

            {/* Email & Confirm Email */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Provide a valid email for communication" arrow>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Re-enter the same email for confirmation" arrow>
                <TextField
                  fullWidth
                  label="Confirm Email"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleInputChange}
                  required
                />
              </Tooltip>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress size={24} color="inherit" /> : null
                }
                sx={{
                  height: 56,
                  fontSize: "1.2rem",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Container>
  );
};

export default NewUser;
