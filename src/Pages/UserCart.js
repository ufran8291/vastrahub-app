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
  query,
  where,
} from "firebase/firestore";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";
import { CircularProgress, Button } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";

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
      for (let item of cartArr) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const matchingSize = productData.sizes?.find((s) => s.size === item.size);
          if (matchingSize) {
            updatedItems.push({
              ...item,
              pricePerPiece: matchingSize.pricePerPiece,
              noOfPieces: item.noOfPieces,
              gst: productData.gst || 0,
              coverImage: productData.coverImage || "",
              productTitle: item.productTitle || productData.title,
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

  const recalcTotals = (items) => {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let total = 0;
    for (let item of items) {
      const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
      const lineTotal = item.pricePerPiece * item.boxPieces * item.quantity;
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
    navigate("/order");
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <CircularProgress />
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        <h2>Your Cart</h2>
        <p>No items in your cart.</p>
      </div>
    );
  }

  let cartButtonTooltip = "";
  const distinctSizesSelected = groupedCart.reduce(
    (acc, group) => acc + group.lines.filter((line) => line.quantity > 0).length,
    0
  );
  if (!isLoggedIn) cartButtonTooltip = "Please log in to add items to cart.";
  else if (distinctSizesSelected < 2) {
    cartButtonTooltip = "Please select at least 2 different sizes.";
  }

  return (
    <div style={{ padding: "30px", paddingBottom: "180px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <h2 style={{ marginBottom: "20px", fontFamily: "Lora, serif" }}>Your Cart</h2>

      <div style={{ marginBottom: "30px" }}>
        {groupedCart.map((group) => (
          <div
            key={group.productId}
            style={{
              marginBottom: "20px",
              padding: "20px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
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
              <h3 style={{ margin: 0, flex: 1, fontFamily: "Lora, serif" }}>{group.productTitle}</h3>
              <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
                <button
                  onClick={() => openEditOverlay(group)}
                  style={{
                    background: "#fff",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontSize: "14px",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                >
                  <MdEdit /> Edit
                </button>
                <button
                  onClick={() => removeEntireProduct(group.productId)}
                  style={{
                    background: "#fff",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontSize: "14px",
                    color: "#d00",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                >
                  <MdDelete /> Remove
                </button>
              </div>
            </div>
            {group.lines.map((item) => {
              const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
              const lineTotal = item.pricePerPiece * item.boxPieces * item.quantity;
              const lineWithoutTax = lineTotal / (1 + gstRate / 100);
              const lineTax = lineTotal - lineWithoutTax;
              return (
                <div
                  key={item.cartItemId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      Size: {item.size}, Boxes: {item.quantity}
                    </p>
                    <p style={{ margin: 0 }}>No of Pieces: {item.noOfPieces}</p>
                    <p style={{ margin: 0 }}>Price/Piece: ₹{item.pricePerPiece}</p>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    <p style={{ margin: 0 }}>
                      Line Total: {lineTotal.toFixed(2)}₹ (incl. GST)
                    </p>
                    <p style={{ margin: 0 }}>
                      Without Tax: {lineWithoutTax.toFixed(2)}₹
                    </p>
                    <p style={{ margin: 0 }}>
                      Tax: {lineTax.toFixed(2)}₹ ({gstRate}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Order Summary Section */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #1976d2",
          borderRadius: "8px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          backgroundColor: "#f8f8f8",
        }}
      >
        <div style={{ marginBottom: "10px", fontSize: "0.9rem" }}>
          <strong>Total Without Tax:</strong> ₹{subtotal.toFixed(2)}
        </div>
        <div style={{ marginBottom: "10px", fontSize: "0.9rem" }}>
          <strong>Total Tax:</strong> ₹{tax.toFixed(2)}
        </div>
        <div style={{ marginBottom: "10px", fontSize: "0.9rem" }}>
          <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
        </div>
        <div style={{ marginTop: "20px" }}>
          <Button
            variant="contained"
            onClick={goToOrderPage}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "1.2rem",
              fontWeight: "bold",
              padding: "15px 30px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            Order Now
          </Button>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #ddd",
          padding: "15px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "left", fontSize: "0.9rem", lineHeight: "1.4" }}>
          <div>
            <strong>Total Without Tax:</strong> ₹{subtotal.toFixed(2)}
          </div>
          <div>
            <strong>Total Tax:</strong> ₹{tax.toFixed(2)}
          </div>
          <div>
            <strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}
          </div>
        </div>
        <Button
          variant="contained"
          onClick={goToOrderPage}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: "bold",
            padding: "15px 30px",
            textTransform: "none",
            "&:hover": { backgroundColor: "#000" },
          }}
        >
          Order Now
        </Button>
      </div>

      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={() => {
            setOverlayProduct(null);
            fetchCartItems();
          }}
        />
      )}
    </div>
  );
}

// export default UserCart;
