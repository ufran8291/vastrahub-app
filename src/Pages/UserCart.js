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
import { CircularProgress, Button } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";

// ---------- EditOverlay Component (for editing cart product quantities) ----------
function EditOverlay({ productData, existingLines, onClose, onConfirm }) {
  /**
   * productData: { id (productId), coverImage, title, sizes: [...] }
   * existingLines: array of cart items for this product (the user's current selections).
   */
  const [quantities, setQuantities] = useState([]);

  useEffect(() => {
    if (productData?.sizes) {
      const mapped = productData.sizes.map((sizeObj) => {
        const existingLine = existingLines.find(
          (line) => line.size === sizeObj.size
        );
        return {
          ...sizeObj,
          quantity: existingLine ? existingLine.quantity : 0,
        };
      });
      setQuantities(mapped);
    }
  }, [productData, existingLines]);

  const distinctSelected = quantities.filter((q) => q.quantity > 0).length;

  const handleIncrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      const maxStock = updated[idx].boxesInStock || 0;
      if (updated[idx].quantity < maxStock) {
        updated[idx].quantity += 1;
      }
      return updated;
    });
  };

  const handleDecrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 0) {
        updated[idx].quantity -= 1;
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    if (distinctSelected < 2) {
      toast.info("Please select at least 2 different sizes for this product.");
      return;
    }
    const updated = quantities.filter((q) => q.quantity > 0);
    onConfirm(updated);
  };

  if (!productData) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          width: "400px",
        }}
      >
        <h3
          style={{
            marginBottom: "10px",
            fontFamily: "Lora, serif",
            fontWeight: 600,
            fontSize: "22px",
          }}
        >
          Edit Cart Quantities
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "16px", color: "#333" }}>
          {productData.title}
        </p>

        {/* Scrollable section with increased padding */}
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            marginBottom: "20px",
            padding: "10px",
          }}
        >
          {quantities.map((sizeObj, idx) => (
            <div
              key={sizeObj.size}
              style={{
                borderBottom: "1px solid #eee",
                padding: "12px 0",
                marginBottom: "12px",
              }}
            >
              <strong style={{ fontSize: "16px" }}>
                Size: {sizeObj.size} (Stock: {sizeObj.boxesInStock})
              </strong>
              <div style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
                Price/Piece: ₹{sizeObj.pricePerPiece} | Pieces/Box: {sizeObj.boxPieces}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => handleDecrement(idx)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #333",
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: sizeObj.quantity > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  -
                </button>
                <span style={{ minWidth: "24px", textAlign: "center" }}>
                  {sizeObj.quantity}
                </span>
                <button
                  onClick={() => handleIncrement(idx)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #333",
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  disabled={sizeObj.quantity >= sizeObj.boxesInStock}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {distinctSelected < 2 && (
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>
            You must select at least 2 different sizes.
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#333",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "4px",
              border: "1px solid #333",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#333",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN COMPONENT: UserCart ----------
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

  // For the "Edit" overlay
  const [editOverlayData, setEditOverlayData] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your cart.");
      navigate("/otp-verify");
      return;
    }
    fetchCartItems();
    // eslint-disable-next-line
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
          const matchingSize = productData.sizes?.find(
            (s) => s.size === item.size
          );
          if (matchingSize) {
            updatedItems.push({
              ...item,
              pricePerPiece: matchingSize.pricePerPiece,
              boxPieces: matchingSize.boxPieces,
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
      const boxes = item.quantity;
      const pricePerBox = item.boxPieces * item.pricePerPiece;
      const lineTotal = pricePerBox * boxes;
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

  // Open edit overlay
  const openEditOverlay = (group) => {
    const productData = {
      id: group.productId,
      coverImage: group.coverImage,
      title: group.productTitle,
      sizes: group.allSizes,
    };
    setEditOverlayData({
      productData,
      existingLines: group.lines,
    });
  };

  // Handle edit confirm from overlay
  const handleEditConfirm = async (updatedSelection) => {
    if (!editOverlayData) return;
    const db = getFirestore();
    const { productData, existingLines } = editOverlayData;
    try {
      for (let line of existingLines) {
        await deleteDoc(doc(db, "users", uid, "cart", line.cartItemId));
      }
      for (let sel of updatedSelection) {
        if (sel.quantity > 0) {
          const cartRef = collection(db, "users", uid, "cart");
          const docRef = doc(cartRef);
          await setDoc(docRef, {
            productId: productData.id,
            productTitle: productData.title,
            size: sel.size,
            pricePerPiece: sel.pricePerPiece,
            boxPieces: sel.boxPieces,
            quantity: sel.quantity,
            updatedAt: new Date(),
          });
        }
      }
      toast.success("Cart updated successfully!");
      setEditOverlayData(null);
      fetchCartItems();
    } catch (error) {
      console.error("Error editing cart lines:", error);
      toast.error("Failed to update cart.");
    }
  };

  // ---------- Order Now button handler ----------
  const goToOrderPage = () => {
    // Pass the current cart items and totals via state or use a global store
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
                    <p style={{ margin: 0 }}>Pieces/Box: {item.boxPieces}</p>
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

      {/* Order Summary Section (at bottom of scrollable content) */}
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
              "&:hover": {
                backgroundColor: "#000",
              },
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
        {/* Totals Summary on Left */}
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
        {/* Order Now Button on Right */}
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
            "&:hover": {
              backgroundColor: "#000",
            },
          }}
        >
          Order Now
        </Button>
      </div>

      {editOverlayData && (
        <EditOverlay
          productData={editOverlayData.productData}
          existingLines={editOverlayData.existingLines}
          onClose={() => setEditOverlayData(null)}
          onConfirm={handleEditConfirm}
        />
      )}
    </div>
  );
}
