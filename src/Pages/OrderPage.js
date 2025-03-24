// src/Pages/OrderPage.js
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

export default function OrderPage() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;
  const isPremium = firestoreUser?.isPremium;

  // Order details – for this example, we fetch the latest cart items.
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // User/Order fields
  const [address, setAddress] = useState("");
  const [transport, setTransport] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [gstinPan, setGstinPan] = useState("");
  const [payLater, setPayLater] = useState(false); // toggle for paylater if premium

  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to place an order.");
      navigate("/otp-verify");
      return;
    }
    // Pre-fill user details from firestoreUser
    setAddress(firestoreUser.address || "");
    setTransport(firestoreUser.transportService || "");
    setEmail(firestoreUser.email || "");
    setPhone(firestoreUser.primaryPhone || "");
    setGstinPan(firestoreUser.gstin || firestoreUser.pan || "");
    fetchCartItems();
    // eslint-disable-next-line
  }, [isLoggedIn]);

  const fetchCartItems = async () => {
    setLoadingCart(true);
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      let items = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), cartItemId: docSnap.id });
      });
      setCartItems(items);
      recalcTotals(items);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast.error("Failed to load cart items.");
    } finally {
      setLoadingCart(false);
    }
  };

  // Calculate totals using:
  // lineTotal = noOfPieces * pricePerPiece
  // lineWithoutTax = lineTotal / (1 + gstRate/100)
  // lineTax = lineTotal - lineWithoutTax
  const recalcTotals = (items) => {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let total = 0;
    for (let item of items) {
      const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
      const lineTotal = item.noOfPieces * item.pricePerPiece;
      const lineWithoutTax = lineTotal / (1 + gstRate / 100);
      const lineTax = lineTotal - lineWithoutTax;
      totalWithoutTax += lineWithoutTax;
      totalTax += lineTax;
      total += lineTotal;
    }
    setSubtotal(+totalWithoutTax.toFixed(2));
    setTax(+totalTax.toFixed(2));
    setGrandTotal(+total.toFixed(2));
  };

  // Helper function to clear the user's cart
  const clearCart = async () => {
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      const deletePromises = [];
      snapshot.forEach((docSnap) => {
        deletePromises.push(
          deleteDoc(doc(db, "users", uid, "cart", docSnap.id))
        );
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Place order handler – if payLater is selected, place order immediately; if not, navigate to payment.
  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.info("Your cart is empty.");
      return;
    }
    if (isPremium && !payLater) {
      navigate("/payment", {
        state: {
          cartItems,
          subtotal,
          tax,
          grandTotal,
          address,
          transport,
          email,
          phone,
          gstinPan,
        },
      });
      return; 
    }
    setPlacingOrder(true);
    try {
      const orderItems = cartItems.map((item) => {
        const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
        const lineTotal = item.noOfPieces * item.pricePerPiece;
        const lineWithoutTax = lineTotal / (1 + gstRate / 100);
        const lineTax = lineTotal - lineWithoutTax;
        return {
          productId: item.productId,
          productTitle: item.productTitle,
          size: item.size,
          quantity: item.quantity,
          noOfPieces: item.noOfPieces,
          boxPieces: item.boxPieces,
          pricePerPiece: item.pricePerPiece,
          lineTotal,
          lineWithoutTax,
          lineTax,
        };
      });
      const orderData = {
        userId: uid,
        orderItems,
        subtotal,
        gst: tax,
        grandTotal,
        address: address.trim(),
        transport,
        email: email.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim(),
        gstinPan,
        payLater,
        orderStatus: "ORDER PLACED",
        createdAt: new Date(),
      };

      await addDoc(collection(db, "orders"), orderData);
      await clearCart();
      toast.success(
        "Order placed successfully! You will be notified once your order is accepted. You can view your order from the My Orders section in your profile."
      );
      navigate("/order-success");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Cancel button: return to cart page
  const handleCancel = () => {
    navigate("/cart");
  };

  // Motion variants for form sections and summary
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
    }),
  };

  if (loadingCart) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      sx={{ mt: 4, mb: 10, fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
      <Fade triggerOnce>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontFamily: "Lora, serif" }}
        >
          Review Your Order
        </Typography>
      </Fade>

      {/* User & Order Details Form */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 3,
            p: 3,
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Your Details
          </Typography>
          <TextField
            fullWidth
            label="Address"
            variant="outlined"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Preferred Transport"
            variant="outlined"
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Alternate Phone (Optional)"
            variant="outlined"
            value={alternatePhone}
            onChange={(e) => setAlternatePhone(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="GSTIN/PAN"
            variant="outlined"
            value={gstinPan}
            disabled
            sx={{ mb: 2 }}
          />
          {isPremium && (
            <FormControlLabel
              control={
                <Switch
                  checked={payLater}
                  onChange={(e) => setPayLater(e.target.checked)}
                  color="primary"
                />
              }
              label="Pay Later Option"
            />
          )}
          {isPremium && payLater && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              You have selected Pay Later. We will contact you regarding
              payment.
            </Typography>
          )}
        </Box>
      </motion.div>

      {/* Order Summary */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box
          sx={{
            mb: 10,
            p: 3,
            border: "1px solid #1976d2",
            borderRadius: "8px",
            backgroundColor: "#f8f8f8",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          {cartItems.map((item) => {
            const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
            const lineTotal = item.noOfPieces * item.pricePerPiece;
            const lineWithoutTax = lineTotal / (1 + gstRate / 100);
            const lineTax = lineTotal - lineWithoutTax;
            return (
              <Box
                key={item.cartItemId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                  p: 1,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {item.productTitle} - Size: {item.size}
                  </Typography>
                  <Typography variant="body2">
                    {item.quantity} Boxes (No of Pieces: {item.noOfPieces})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">
                    Line Total: ₹{lineTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">
              Subtotal: ₹{subtotal.toFixed(2)}
            </Typography>
            <Typography variant="h6">Total Tax: ₹{tax.toFixed(2)}</Typography>
            <Typography variant="h6">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Order Action Button */}
      <motion.div initial="hidden" animate="visible" variants={sectionVariants}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-start" }}>
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: "bold",
              py: 1.5,
              px: 3,
              textTransform: "none",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            {placingOrder ? (
              <CircularProgress size={24} color="inherit" />
            ) : isPremium && payLater ? (
              "Place Order"
            ) : (
              "Make Payment"
            )}
          </Button>
        </Box>
      </motion.div>

      {/* Fixed Bottom Bar */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #ddd",
          p: "15px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <Box sx={{ textAlign: "left", fontSize: "0.9rem", lineHeight: "1.4" }}>
          <div>
            <strong>Total Without Tax:</strong> ₹{subtotal.toFixed(2)}
          </div>
          <div>
            <strong>Total Tax:</strong> ₹{tax.toFixed(2)}
          </div>
          <div>
            <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
          </div>
        </Box>
        <Button
          variant="contained"
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            textTransform: "none",
            "&:hover": { backgroundColor: "#000" },
          }}
        >
          {placingOrder ? (
            <CircularProgress size={24} color="inherit" />
          ) : isPremium && payLater ? (
            "Place Order"
          ) : (
            "Make Payment"
          )}
        </Button>
      </Box>
    </Container>
  );
}
