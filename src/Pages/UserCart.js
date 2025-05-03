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
import {
  CircularProgress,
  Button,
  Typography,
  Box,
  useMediaQuery,
} from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";
import CartImage from "../assets/cartimage.png";

export default function UserCart() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser, checkSessionTokenConsistency } =
    useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;

  // 🔹 Detect mobile viewport
  const isMobile = useMediaQuery("(max-width:600px)");

  /* ---------- DISCOUNT HELPERS ---------- */
  const hasDiscount = (item) =>
    item.discountPercent && item.discountPercent > 0;

  const getMrp = (item) => item.originalPricePerPiece ?? item.pricePerPiece; // fall‑back if we never stored it

  const getEffectivePP = (item) =>
    hasDiscount(item)
      ? Math.round(getMrp(item) * (1 - item.discountPercent / 100))
      : getMrp(item);
  /* -------------------------------------- */

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [overlayProduct, setOverlayProduct] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your cart.");
      navigate("/otp-verify");
      return;
    }
    checkSessionTokenConsistency();
    fetchCartItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  /* ------------ FETCH & SYNC CART ------------ */
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const cartRef = collection(db, "users", uid, "cart");
      const snapshot = await getDocs(cartRef);
      const cartArr = snapshot.docs.map((d) => ({
        ...d.data(),
        cartItemId: d.id,
      }));

      const updatedItems = [];

      for (const item of cartArr) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await getDoc(prodRef);

        if (!prodSnap.exists()) continue;

        const productData = prodSnap.data();
        const sz = productData.sizes?.find((s) => s.size === item.size);
        if (!sz) continue;

        /* ---------- sync price / gst if product changed ---------- */
        const newGst = productData.gst || 0;
        const mrpNow = sz.pricePerPiece;
        const discPct = item.discountPercent || 0;
        const newEffPP = discPct
          ? Math.round(mrpNow * (1 - discPct / 100))
          : mrpNow;

        const needsUpdate =
          item.gst !== newGst ||
          item.originalPricePerPiece !== mrpNow ||
          item.pricePerPiece !== newEffPP ||
          item.coverImage !== productData.coverImage ||
          item.productTitle !== productData.title;

        if (needsUpdate) {
          await setDoc(
            doc(db, "users", uid, "cart", item.cartItemId),
            {
              gst: newGst,
              originalPricePerPiece: mrpNow,
              pricePerPiece: newEffPP,
              coverImage: productData.coverImage,
              productTitle: productData.title,
            },
            { merge: true }
          );
          item.gst = newGst;
          item.originalPricePerPiece = mrpNow;
          item.pricePerPiece = newEffPP;
          item.coverImage = productData.coverImage;
          item.productTitle = productData.title;
        }
        /* -------------------------------------------------------- */

        updatedItems.push({ ...item, allSizes: productData.sizes });
      }

      setCartItems(updatedItems);
      recalcTotals(updatedItems);
    } catch (err) {
      console.error("Error loading cart items:", err);
      toast.error("Failed to load cart items.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------ TOTALS WITH DISCOUNT ---------- */
  const recalcTotals = (items) => {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let total = 0;

    for (const item of items) {
      const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
      const lineTotal = item.noOfPieces * getEffectivePP(item); // 🔸
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
  /* ------------------------------------------- */

  /* ------------ GROUP BY PRODUCT ------------- */
  const groupedCart = useMemo(() => {
    const grouped = {};
    for (const it of cartItems) {
      if (!grouped[it.productId]) {
        grouped[it.productId] = {
          productId: it.productId,
          coverImage: it.coverImage,
          productTitle: it.productTitle,
          allSizes: it.allSizes,
          lines: [],
        };
      }
      grouped[it.productId].lines.push(it);
    }
    return Object.values(grouped);
  }, [cartItems]);

  /* -------- remove product & edit overlay ----- */
  const removeEntireProduct = async (productId) => {
    try {
      const db = getFirestore();
      const toRemove = cartItems.filter((it) => it.productId === productId);
      for (const ln of toRemove) {
        await deleteDoc(doc(db, "users", uid, "cart", ln.cartItemId));
      }
      toast.success("Product removed from cart.");
      fetchCartItems();
    } catch (err) {
      console.error("Remove product error:", err);
      toast.error("Failed to remove product from cart.");
    }
  };

  const openEditOverlay = (group) => {
    setOverlayProduct({
      id: group.productId,
      coverImage: group.coverImage,
      title: group.productTitle,
      sizes: group.allSizes,
    });
  };

  /* --------------- checkout -------------- */
  const goToOrderPage = () => {
    if (grandTotal < 10000) {
      toast.info(`Please add more items worth ₹${10000 - grandTotal}`);
      toast.error("Minimum order value is ₹10,000 to proceed.");
      return;
    }
    navigate("/order");
  };

  /* ------------- animation --------------- */
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, type: "spring", stiffness: 100 },
    }),
  };

  /* ---------- Early returns ---------- */
  if (loading) {
    return (
      <Box sx={{ p: isMobile ? 4 : 6, textAlign: "center" }}>
        <CircularProgress size={isMobile ? 28 : 40} />
      </Box>
    );
  }

  if (!cartItems.length) {
    return (
      // … empty‑cart JSX unchanged …
      /* (kept exactly as in your original code) */
      <Box
        sx={{
          padding: isMobile ? 2 : 3,
          fontFamily: "Plus Jakarta Sans, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "60vh",
        }}
      >
        <img
          src={CartImage}
          alt="Empty Cart"
          style={{ maxWidth: isMobile ? 220 : 300, marginBottom: 20 }}
        />
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{ mb: 2, fontFamily: "Lora, serif" }}
        >
          Your cart is empty.
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 3, color: "#666", fontSize: isMobile ? "0.9rem" : "1rem" }}
        >
          Looks like you haven't added any products yet.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: { xs: "1rem", sm: "1.2rem" },
            fontWeight: "bold",
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 2.5, sm: 3 },
            textTransform: "none",
            "&:hover": { backgroundColor: "#333" },
          }}
        >
          Shop Now
        </Button>
      </Box>
    );
  }

  /* ---------- Main render ---------- */
  return (
    <Box
      sx={{ p: { xs: "20px 10px", sm: 3 }, pb: { xs: "160px", sm: "180px" } }}
    >
      <Typography
        variant={isMobile ? "h5" : "h4"}
        sx={{ mb: 3, fontFamily: "Lora, serif" }}
      >
        Your Cart
      </Typography>

      <Fade cascade triggerOnce>
        {groupedCart.map((group, idx) => (
          <motion.div
            key={group.productId}
            custom={idx}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            style={{
              marginBottom: 20,
              padding: 20,
              border: "1px solid #ccc",
              borderRadius: 8,
            }}
          >
            {/* ---------- Header ---------- */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: "center",
                mb: 2,
              }}
            >
              <img
                src={group.coverImage}
                alt={group.productTitle}
                style={{
                  width: isMobile ? 64 : 80,
                  height: isMobile ? 64 : 80,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginRight: isMobile ? 0 : 15,
                  marginBottom: isMobile ? 10 : 0,
                }}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                sx={{ flex: 1, fontFamily: "Lora, serif" }}
              >
                {group.productTitle}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  mt: { xs: 1, sm: 0 },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <Button
                  fullWidth={isMobile}
                  variant="outlined"
                  startIcon={<MdEdit />}
                  onClick={() => openEditOverlay(group)}
                  sx={{
                    textTransform: "none",
                    borderColor: "#333",
                    color: "#333",
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    py: 1,
                  }}
                >
                  Edit
                </Button>
                <Button
                  fullWidth={isMobile}
                  variant="outlined"
                  startIcon={<MdDelete />}
                  onClick={() => removeEntireProduct(group.productId)}
                  sx={{
                    textTransform: "none",
                    borderColor: "#d00",
                    color: "#d00",
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    py: 1,
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>

            {/* ---------- Lines ---------- */}
            {group.lines.map((it) => {
              const gstRate = isNaN(it.gst) ? 0 : Number(it.gst);
              const effPP = getEffectivePP(it); // 🔸
              const lineTotal = it.noOfPieces * effPP; // 🔸
              const lineWithoutTax = lineTotal / (1 + gstRate / 100);
              const lineTax = lineTotal - lineWithoutTax;

              return (
                <Box
                  key={it.cartItemId}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    p: 1.5,
                    border: "1px solid #eee",
                    borderRadius: 4,
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                      }}
                    >
                      Size: {it.size}, Boxes: {it.quantity}
                    </Typography>
                    <Typography
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      No of Pieces: {it.noOfPieces}
                    </Typography>

                    {/* ---------- Price display with discount ---------- */}
                    <Typography
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      Price/Piece:&nbsp;
                      {hasDiscount(it) ? (
                        <>
                          <span
                            style={{
                              textDecoration: "line-through",
                              marginRight: 4,
                            }}
                          >
                            ₹{getMrp(it)}
                          </span>
                          ₹{effPP}&nbsp;
                          <em style={{ color: "#388e3c" }}>
                            ({it.discountPercent}% off)
                          </em>
                        </>
                      ) : (
                        <>₹{effPP}</>
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      textAlign: { xs: "left", sm: "right" },
                      mt: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      Line Total: ₹{lineTotal.toFixed(2)} (incl. GST)
                    </Typography>
                    <Typography
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      Without Tax: ₹{lineWithoutTax.toFixed(2)}
                    </Typography>
                    <Typography
                      sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
                    >
                      Tax: ₹{lineTax.toFixed(2)} ({gstRate}%)
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </motion.div>
        ))}
      </Fade>

      {/* ---------- Order Summary ---------- */}
      <Box
        sx={{
          mb: 10,
          p: { xs: 2, sm: 3 },
          border: "1px solid #1976d2",
          borderRadius: 2,
          bgcolor: "#f8f8f8",
        }}
      >
        <Typography
          variant={isMobile ? "subtitle1" : "h6"}
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
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
              bgcolor: "#000",
              color: "#fff",
              fontSize: { xs: "1rem", sm: "1.2rem" },
              fontWeight: "bold",
              py: { xs: 1.3, sm: 1.5 },
              width: "100%",
              textTransform: "none",
              "&:hover": { bgcolor: "#333" },
            }}
          >
            Order Now
          </Button>
        </Box>
      </Box>

      {/* ---------- Bottom bar ---------- */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#fff",
          borderTop: "1px solid #ddd",
          p: { xs: "10px 15px", sm: "15px 30px" },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            textAlign: { xs: "center", sm: "left" },
            fontSize: "0.9rem",
            lineHeight: 1.4,
          }}
        >
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
            bgcolor: "#000",
            color: "#fff",
            fontSize: { xs: "1rem", sm: "1.2rem" },
            fontWeight: "bold",
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 2.5, sm: 3 },
            width: { xs: "100%", sm: "auto" },
            textTransform: "none",
            "&:hover": { bgcolor: "#333" },
          }}
        >
          Order Now
        </Button>
      </Box>

      {/* ---------- Edit overlay ---------- */}
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
