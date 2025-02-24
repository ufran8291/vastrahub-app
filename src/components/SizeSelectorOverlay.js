// src/components/SizeSelectorOverlay.js
import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { GlobalContext } from "../Context/GlobalContext";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";

export default function SizeSelectorOverlay({ product, onClose }) {
  const { firestoreUser } = useContext(GlobalContext);
  const uid = firestoreUser?.id;
  const [quantities, setQuantities] = useState([]);
  // We'll store any existing cart items for this product keyed by size.
  const [existingCartItems, setExistingCartItems] = useState({});

  // Count distinct sizes with quantity > 0
  const distinctSelected = quantities.filter((q) => q.quantity > 0).length;

  // Helper: Compute available boxes from piecesInStock and boxPieces
  const computeTotalBoxes = (piecesInStock, boxPieces) => {
    const pieces = piecesInStock || 0;
    const boxPiecesVal = boxPieces || 1;
    const fullBoxes = Math.floor(pieces / boxPiecesVal);
    const remainder = pieces % boxPiecesVal;
    return fullBoxes + (remainder > 0 ? 1 : 0);
  };

  // Helper: Compute total pieces selected based on the quantity (boxes)
  const computeTotalPieces = (quantity, boxPieces, piecesInStock) => {
    const fullBoxes = Math.floor((piecesInStock || 0) / (boxPieces || 1));
    const remainder = (piecesInStock || 0) % (boxPieces || 1);
    if (quantity <= fullBoxes) {
      return quantity * boxPieces;
    } else {
      // When a partial box is added
      return fullBoxes * boxPieces + remainder;
    }
  };

  useEffect(() => {
    async function initQuantities() {
      if (product && product.sizes) {
        let cartMapping = {};
        if (uid) {
          try {
            const cartRef = collection(db, "users", uid, "cart");
            const q = query(cartRef, where("productId", "==", product.id));
            const snapshot = await getDocs(q);
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              // Use the size as key (assuming one doc per product/size)
              cartMapping[data.size] = { docId: docSnap.id, quantity: data.quantity };
            });
          } catch (error) {
            console.error("Error fetching existing cart items:", error);
          }
        }
        setExistingCartItems(cartMapping);
        // Initialize each size with quantity from the cart if available; otherwise zero.
        const initData = product.sizes.map((s) => ({
          ...s,
          quantity: cartMapping[s.size]?.quantity || 0,
        }));
        setQuantities(initData);
      }
    }
    initQuantities();
  }, [product, uid]);

  // ---------- INCREMENT / DECREMENT ----------
  const handleIncrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      const availableStock = computeTotalBoxes(updated[idx].piecesInStock, updated[idx].boxPieces);
      if (updated[idx].quantity < availableStock) {
        updated[idx].quantity += 1;
      }
      // Log calculation details
      const fullBoxes = Math.floor((updated[idx].piecesInStock || 0) / (updated[idx].boxPieces || 1));
      const remainder = (updated[idx].piecesInStock || 0) % (updated[idx].boxPieces || 1);
      const totalPiecesSelected = computeTotalPieces(
        updated[idx].quantity,
        updated[idx].boxPieces,
        updated[idx].piecesInStock
      );
      console.log(
        `After increment for size ${updated[idx].size}: quantity=${updated[idx].quantity}, totalPieces=${totalPiecesSelected} (fullBoxes=${fullBoxes}, remainder=${remainder})`
      );
      return updated;
    });
  };

  const handleDecrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 0) {
        updated[idx].quantity -= 1;
      }
      // Log calculation details
      const fullBoxes = Math.floor((updated[idx].piecesInStock || 0) / (updated[idx].boxPieces || 1));
      const remainder = (updated[idx].piecesInStock || 0) % (updated[idx].boxPieces || 1);
      const totalPiecesSelected = computeTotalPieces(
        updated[idx].quantity,
        updated[idx].boxPieces,
        updated[idx].piecesInStock
      );
      console.log(
        `After decrement for size ${updated[idx].size}: quantity=${updated[idx].quantity}, totalPieces=${totalPiecesSelected} (fullBoxes=${fullBoxes}, remainder=${remainder})`
      );
      return updated;
    });
  };

  // ---------- CONFIRM HANDLER ----------
  const handleConfirm = async () => {
    if (distinctSelected < 2) {
      toast.info("Please select at least 2 different sizes.");
      return;
    }
    if (!uid) {
      toast.error("User not authenticated.");
      return;
    }
    try {
      const cartRef = collection(db, "users", uid, "cart");
      for (let sq of quantities) {
        if (sq.quantity > 0) {
          // Compute the total number of pieces for this size
          const noOfPieces = computeTotalPieces(sq.quantity, sq.boxPieces, sq.piecesInStock);
          const existing = existingCartItems[sq.size];
          const cartData = {
            productId: product.id,
            productTitle: product.title,
            size: sq.size,
            pricePerPiece: sq.pricePerPiece,
            boxPieces: sq.boxPieces,
            quantity: sq.quantity, // boxes selected
            noOfPieces, // total pieces calculated
            updatedAt: new Date(),
          };
          if (existing) {
            // Update the existing cart document.
            const docRef = doc(db, "users", uid, "cart", existing.docId);
            await setDoc(docRef, cartData, { merge: true });
          } else {
            // Create a new cart document.
            const newDocRef = doc(cartRef);
            await setDoc(newDocRef, cartData);
          }
        } else {
          // If quantity is 0 and there is an existing cart document, remove it.
          const existing = existingCartItems[sq.size];
          if (existing) {
            const docRef = doc(db, "users", uid, "cart", existing.docId);
            await deleteDoc(docRef);
          }
        }
      }
      toast.success("Cart updated!");
      onClose();
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart.");
    }
  };

  if (!product) return null;

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
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          width: "400px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
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
          Select Quantities
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "16px", color: "#333" }}>
          {product.title}
        </p>

        {/* SCROLLABLE AREA */}
        <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
          {quantities.map((sizeObj, idx) => {
            const availableStock = computeTotalBoxes(sizeObj.piecesInStock, sizeObj.boxPieces);
            const fullBoxes = Math.floor((sizeObj.piecesInStock || 0) / (sizeObj.boxPieces || 1));
            const remainder = (sizeObj.piecesInStock || 0) % (sizeObj.boxPieces || 1);
            const tooltipText =
              sizeObj.piecesInStock > 0
                ? `${availableStock} box available (${fullBoxes} full` +
                  (remainder > 0 ? `, 1 partial (${remainder} pieces)` : "") +
                  `)`
                : "Out of stock";
            const totalPiecesSelected = computeTotalPieces(
              sizeObj.quantity,
              sizeObj.boxPieces,
              sizeObj.piecesInStock
            );
            return (
              <div
                key={sizeObj.size}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px 0",
                  marginBottom: "8px",
                }}
              >
                <strong style={{ fontSize: "16px" }}>
                  Size: {sizeObj.size}{" "}
                  <span title={tooltipText} style={{ fontWeight: "normal", fontSize: "14px", color: "#555" }}>
                    (Stock: {availableStock})
                  </span>
                </strong>
                <div style={{ fontSize: "14px", color: "#555" }}>
                  Price/Piece: ₹{sizeObj.pricePerPiece} | Pieces/Box: {sizeObj.boxPieces}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "6px",
                  }}
                >
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
                      disabled={sizeObj.quantity === 0}
                    >
                      –
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
                      disabled={sizeObj.quantity >= availableStock}
                    >
                      +
                    </button>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      Total Pieces: {totalPiecesSelected}
                      {sizeObj.quantity === availableStock && remainder > 0 && (
                        <>
                          <br />
                          Last box has only {remainder} pieces
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "0px",
              border: "solid 1px #333",
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
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "0px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
