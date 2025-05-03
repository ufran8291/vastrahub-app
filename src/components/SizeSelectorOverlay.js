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
  getDoc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { CircularProgress } from "@mui/material";

export default function SizeSelectorOverlay({ product, onClose }) {
  const { firestoreUser, syncStockDataForIds } = useContext(GlobalContext);
  const uid = firestoreUser?.id;
  const [quantities, setQuantities] = useState([]);
  const [existingCartItems, setExistingCartItems] = useState({});
  const [syncing, setSyncing] = useState(true);

  /* ---------------- DISCOUNT LOGIC ---------------- */
  const hasValidDiscount =
    product &&
    typeof product.discount === "number" &&
    product.discount > 0 &&
    product.discount < 100;

  const priceAfterDiscount = (price) =>
    hasValidDiscount ? Math.round(price * (1 - product.discount / 100)) : price;
  /* ------------------------------------------------ */

  /* ---------------- UTILITIES ---------------- */
  const computeTotalBoxes = (piecesInStock, boxPieces) => {
    const pieces = piecesInStock || 0;
    const boxPiecesVal = boxPieces || 1;
    const fullBoxes = Math.floor(pieces / boxPiecesVal);
    const remainder = pieces % boxPiecesVal;
    return fullBoxes + (remainder > 0 ? 1 : 0);
  };

  const computeTotalPieces = (quantity, boxPieces, piecesInStock) => {
    const fullBoxes = Math.floor((piecesInStock || 0) / (boxPieces || 1));
    const remainder = (piecesInStock || 0) % (boxPieces || 1);
    return quantity <= fullBoxes
      ? quantity * boxPieces
      : fullBoxes * boxPieces + remainder;
  };
  /* -------------------------------------------- */

  /* ----------- SYNC STOCK (unchanged) ---------- */
  useEffect(() => {
    async function syncProductStock() {
      if (product?.sizes?.length) {
        try {
          const storeDoc = await getDoc(doc(db, "banners", "other-data"));
          if (!storeDoc.exists() || !storeDoc.data().isStoreOpen) {
            setSyncing(false);
            return;
          }
        } catch (err) {
          console.error("Store status error:", err);
          toast.error("Error checking store status: " + err.message);
          setSyncing(false);
          return;
        }
        try {
          const inventoryIds = product.sizes.map((s) => Number(s.inventoryId));
          await syncStockDataForIds(inventoryIds);
        } catch (err) {
          console.error("Stock sync error:", err);
          toast.error("Error syncing stock data.");
        } finally {
          setSyncing(false);
        }
      } else {
        setSyncing(false);
      }
    }
    syncProductStock();
  }, [product, syncStockDataForIds]);
  /* -------------------------------------------- */

  /* -------- INIT QUANTITIES (unchanged) -------- */
  useEffect(() => {
    async function initQuantities() {
      if (product?.sizes) {
        const cartMapping = {};
        if (uid) {
          try {
            const cartRef = collection(db, "users", uid, "cart");
            const q = query(cartRef, where("productId", "==", product.id));
            const snapshot = await getDocs(q);
            snapshot.forEach((d) => {
              const data = d.data();
              cartMapping[data.size] = { docId: d.id, quantity: data.quantity };
            });
          } catch (err) {
            console.error("Fetch cart error:", err);
          }
        }
        setExistingCartItems(cartMapping);
        setQuantities(
          product.sizes.map((s) => ({
            ...s,
            quantity: cartMapping[s.size]?.quantity || 0,
          }))
        );
      }
    }
    initQuantities();
  }, [product, uid]);
  /* -------------------------------------------- */

  /* ------------- INCREMENT/DECREMENT ---------- */
  const handleIncrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      const availableBoxes = computeTotalBoxes(
        updated[idx].piecesInStock,
        updated[idx].boxPieces
      );
      if (updated[idx].quantity < availableBoxes) updated[idx].quantity += 1;
      return updated;
    });
  };

  const handleDecrement = (idx) => {
    setQuantities((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 0) updated[idx].quantity -= 1;
      return updated;
    });
  };
  /* -------------------------------------------- */

  /* --------------- CONFIRM -------------------- */
  const handleConfirm = async () => {
    if (!uid) {
      toast.error("User not authenticated.");
      return;
    }
    try {
      const cartRef = collection(db, "users", uid, "cart");
      for (const sq of quantities) {
        const effectivePrice = priceAfterDiscount(sq.pricePerPiece);
        if (sq.quantity > 0) {
          const noOfPieces = computeTotalPieces(
            sq.quantity,
            sq.boxPieces,
            sq.piecesInStock
          );
          const existing = existingCartItems[sq.size];
          const cartData = {
            productId: product.id,
            productTitle: product.title,
            size: sq.size,
            pricePerPiece: effectivePrice, // 🔸 discounted price stored
            discountPercent: hasValidDiscount ? product.discount : 0,
            boxPieces: sq.boxPieces,
            quantity: sq.quantity,
            noOfPieces,
            updatedAt: new Date(),
            inventoryId: sq.inventoryId,
          };
          if (existing) {
            await setDoc(
              doc(db, "users", uid, "cart", existing.docId),
              cartData,
              { merge: true }
            );
          } else {
            await setDoc(doc(cartRef), cartData);
          }
        } else if (existingCartItems[sq.size]) {
          await deleteDoc(
            doc(db, "users", uid, "cart", existingCartItems[sq.size].docId)
          );
        }
      }
      toast.success("Cart updated!");
      onClose();
    } catch (err) {
      console.error("Update cart error:", err);
      toast.error("Failed to update cart.");
    }
  };
  /* -------------------------------------------- */

  if (!product) return null;

  if (syncing) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={80} />
        <p style={{ color: "#fff", marginTop: 16 }}>Getting stock data...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          width: 400,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <h3 style={{ marginBottom: 10, fontFamily: "Lora, serif" }}>
          Select Quantities
        </h3>
        <p style={{ marginBottom: 20, fontSize: 16 }}>{product.title}</p>

        {/* -------- SIZE LIST -------- */}
        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 20 }}>
          {quantities.map((sz, idx) => {
            const availableStock = computeTotalBoxes(
              sz.piecesInStock,
              sz.boxPieces
            );
            const remainder =
              (sz.piecesInStock || 0) % (sz.boxPieces || 1);
            const totalPiecesSelected = computeTotalPieces(
              sz.quantity,
              sz.boxPieces,
              sz.piecesInStock
            );
            const effectivePrice = priceAfterDiscount(sz.pricePerPiece);
            return (
              <div
                key={sz.size}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "8px 0",
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 16 }}>Size: {sz.size}</strong>
                <div style={{ fontSize: 14, color: "#555" }}>
                  {hasValidDiscount ? (
                    <>
                      Price/Piece:{" "}
                      <span
                        style={{ textDecoration: "line-through", marginRight: 4 }}
                      >
                        ₹{sz.pricePerPiece}
                      </span>
                      ₹{effectivePrice} | Pieces/Box: {sz.boxPieces}
                    </>
                  ) : (
                    <>
                      Price/Piece: ₹{sz.pricePerPiece} | Pieces/Box:{" "}
                      {sz.boxPieces}
                    </>
                  )}
                </div>

                {/* --- Quantity Controls --- */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => handleDecrement(idx)}
                      disabled={sz.quantity === 0}
                      style={{
                        background: "#fff",
                        border: "1px solid #333",
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: sz.quantity ? "pointer" : "not-allowed",
                      }}
                    >
                      –
                    </button>
                    <span style={{ minWidth: 24, textAlign: "center" }}>
                      {sz.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(idx)}
                      disabled={sz.quantity >= availableStock || availableStock === 0}
                      style={{
                        background: "#fff",
                        border: "1px solid #333",
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        fontSize: 16,
                        cursor:
                          availableStock && sz.quantity < availableStock
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: "#888" }}>
                    {availableStock === 0 ? (
                      <span style={{ color: "#D32F2F", fontWeight: 500 }}>
                        ❌ Out of Stock
                      </span>
                    ) : (
                      <>
                        Total Pieces: {totalPiecesSelected}
                        {sz.quantity === availableStock && remainder > 0 && (
                          <>
                            <br />
                            Last box has only {remainder} pieces
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* -------- ACTIONS -------- */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#fff",
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
              background: "#333",
              color: "#fff",
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
