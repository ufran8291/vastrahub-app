// src/Pages/UserCart.js
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";
import { CircularProgress, Button, Typography, Box } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import CartImage from '../assets/cartimage.png';

export default function UserCart() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  // For the "Edit" overlay using SizeSelectorOverlay
  const [overlayProduct, setOverlayProduct] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your cart.");
      navigate("/otp-verify");
      return;
    }
    fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      let cartArr = [];
      snapshot.forEach((docSnap) => {
        cartArr.push({ ...docSnap.data(), cartItemId: docSnap.id });
      });
      let updatedItems = [];
      // For each cart item, fetch latest product details and update cart if necessary.
      for (let item of cartArr) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const matchingSize = productData.sizes?.find((s) => s.size === item.size);
          if (matchingSize) {
            // Extract latest values from product
            const newGst = productData.gst || 0;
            const newPricePerPiece = matchingSize.pricePerPiece;
            const newCoverImage = productData.coverImage || "";
            const newProductTitle = productData.title;
            // Update the cart document if values differ
            if (
              item.gst !== newGst ||
              item.pricePerPiece !== newPricePerPiece ||
              item.coverImage !== newCoverImage ||
              item.productTitle !== newProductTitle
            ) {
              await setDoc(
                doc(db, "users", uid, "cart", item.cartItemId),
                {
                  gst: newGst,
                  pricePerPiece: newPricePerPiece,
                  coverImage: newCoverImage,
                  productTitle: newProductTitle,
                },
                { merge: true }
              );
              // Also update in memory
              item.gst = newGst;
              item.pricePerPiece = newPricePerPiece;
              item.coverImage = newCoverImage;
              item.productTitle = newProductTitle;
            }
            updatedItems.push({
              ...item,
              allSizes: productData.sizes,
            });
          }
        }
      }
      setCartItems(updatedItems);
      recalcTotals(updatedItems);
    } catch (error) {
      console.error("Error loading cart items:", error);
      toast.error("Failed to load cart items.");
    } finally {
      setLoading(false);
    }
  };

  // Recalculate totals using lineTotal = noOfPieces * pricePerPiece
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

  // Group cart items by productId
  const groupedCart = useMemo(() => {
    const grouped = {};
    for (let item of cartItems) {
      if (!grouped[item.productId]) {
        grouped[item.productId] = {
          productId: item.productId,
          coverImage: item.coverImage,
          productTitle: item.productTitle,
          allSizes: item.allSizes,
          lines: [],
        };
      }
      grouped[item.productId].lines.push(item);
    }
    return Object.values(grouped);
  }, [cartItems]);

  // Remove entire product from cart
  const removeEntireProduct = async (productId) => {
    try {
      const db = getFirestore();
      const linesToRemove = cartItems.filter((it) => it.productId === productId);
      for (let line of linesToRemove) {
        await deleteDoc(doc(db, "users", uid, "cart", line.cartItemId));
      }
      toast.success("Product removed from cart.");
      fetchCartItems();
    } catch (error) {
      console.error("Error removing product from cart:", error);
      toast.error("Failed to remove product from cart.");
    }
  };

  // Open edit overlay using SizeSelectorOverlay (reusing the same component)
  const openEditOverlay = (group) => {
    const productData = {
      id: group.productId,
      coverImage: group.coverImage,
      title: group.productTitle,
      sizes: group.allSizes,
    };
    setOverlayProduct(productData);
  };

  const goToOrderPage = () => {
    if (grandTotal < 10000) {
      toast.info(`Please add more items worth ₹${10000-grandTotal}`);
      toast.error("Minimum order value is ₹10,000 to proceed.");
      return;
    }
    navigate("/order");
  };

  // Motion variants for group cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
    }),
  };

  if (loading) {
    return (
      <Box sx={{ padding: "60px", textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cartItems.length) {
    return (
      <Box
        sx={{
          padding: "30px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "60vh",
        }}
      >
        <img src={CartImage} alt="Empty Cart" style={{ maxWidth: "300px", marginBottom: "20px" }} />
        <Typography variant="h5" sx={{ mb: 2, fontFamily: "Lora, serif" }}>
          Your cart is empty.
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: "#666" }}>
          Looks like you haven't added any products yet.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            textTransform: "none",
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          Shop Now
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: "30px", pb: "180px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Typography variant="h4" sx={{ mb: 3, fontFamily: "Lora, serif" }}>
        Your Cart
      </Typography>

      <Fade cascade triggerOnce>
        {groupedCart.map((group, index) => (
          <motion.div
            key={group.productId}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            style={{
              marginBottom: "20px",
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <img
                src={group.coverImage}
                alt={group.productTitle}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginRight: "15px",
                }}
              />
              <Typography
                variant="h6"
                sx={{ flex: 1, fontFamily: "Lora, serif", m: 0 }}
              >
                {group.productTitle}
              </Typography>
              <Box sx={{ display: "flex", gap: "10px", ml: "auto" }}>
                <Button
                  variant="outlined"
                  onClick={() => openEditOverlay(group)}
                  startIcon={<MdEdit />}
                  sx={{
                    textTransform: "none",
                    borderColor: "#333",
                    color: "#333",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => removeEntireProduct(group.productId)}
                  startIcon={<MdDelete />}
                  sx={{
                    textTransform: "none",
                    borderColor: "#d00",
                    color: "#d00",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
            {group.lines.map((item) => {
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
                    p: 1.5,
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ m: 0, fontWeight: "bold" }}>
                      Size: {item.size}, Boxes: {item.quantity}
                    </Typography>
                    <Typography sx={{ m: 0 }}>
                      No of Pieces: {item.noOfPieces}
                    </Typography>
                    <Typography sx={{ m: 0 }}>
                      Price/Piece: ₹{item.pricePerPiece}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ m: 0 }}>
                      Line Total: ₹{lineTotal.toFixed(2)} (incl. GST)
                    </Typography>
                    <Typography sx={{ m: 0 }}>
                      Without Tax: ₹{lineWithoutTax.toFixed(2)}
                    </Typography>
                    <Typography sx={{ m: 0 }}>
                      Tax: ₹{lineTax.toFixed(2)} ({gstRate}%)
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </motion.div>
        ))}
      </Fade>

      {/* Order Summary Section */}
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
        <Box sx={{ mb: 1, fontSize: "0.9rem" }}>
          <strong>Total Without Tax:</strong> ₹{subtotal.toFixed(2)}
        </Box>
        <Box sx={{ mb: 1, fontSize: "0.9rem" }}>
          <strong>Total Tax:</strong> ₹{tax.toFixed(2)}
        </Box>
        <Box sx={{ mb: 1, fontSize: "0.9rem" }}>
          <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={goToOrderPage}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: "bold",
              py: 1.5,
              px: 3,
              textTransform: "none",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Order Now
          </Button>
        </Box>
      </Box>

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
          onClick={goToOrderPage}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            textTransform: "none",
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          Order Now
        </Button>
      </Box>

      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={() => {
            setOverlayProduct(null);
            fetchCartItems();
          }}
        />
      )}
    </Box>
  );
}
