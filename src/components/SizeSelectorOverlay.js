// src/Components/SizeSelectorOverlay.js

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function SizeSelectorOverlay({ product, onClose, onConfirm }) {
  const [quantities, setQuantities] = useState([]);

  // Count distinct sizes with quantity > 0
  const distinctSelected = quantities.filter((q) => q.quantity > 0).length;

  useEffect(() => {
    if (product && product.sizes) {
      // Initialize each size with quantity = 0
      const initData = product.sizes.map((s) => ({
        ...s,
        quantity: 0,
      }));
      setQuantities(initData);
    }
  }, [product]);

  // =========== INCREMENT ===========
  const handleIncrement = (idx) => {
    console.log(`handleIncrement fired, idx=${idx}`);
    setQuantities((prev) => {
      const updated = [...prev];
      const stock = updated[idx].boxesInStock || 0;
      if (updated[idx].quantity < stock) {
        updated[idx].quantity += 1;
        console.log(`quantity for idx=${idx} => ${updated[idx].quantity}`);
      }
      return updated;
    });
  };

  // =========== DECREMENT ===========
  const handleDecrement = (idx) => {
    console.log(`handleDecrement fired, idx=${idx}`);
    setQuantities((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 0) {
        updated[idx].quantity -= 1;
        console.log(`quantity for idx=${idx} => ${updated[idx].quantity}`);
      }
      return updated;
    });
  };

  // =========== CONFIRM ===========
  const handleConfirm = () => {
    if (distinctSelected < 2) {
      toast.info("Please select at least 2 different sizes.");
      return;
    }
    const selectedSizes = quantities.filter((q) => q.quantity > 0);
    onConfirm(selectedSizes);
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
          {quantities.map((sizeObj, idx) => (
            <div
              key={sizeObj.size}
              style={{
                borderBottom: "1px solid #eee",
                padding: "8px 0",
                marginBottom: "8px",
              }}
            >
              <strong style={{ fontSize: "16px" }}>
                Size: {sizeObj.size} (Stock: {sizeObj.boxesInStock})
              </strong>
              <div style={{ fontSize: "14px", color: "#555" }}>
                Price/Piece: ₹{sizeObj.pricePerPiece} | Pieces/Box: {sizeObj.boxPieces}
              </div>

              {/* Increment/Decrement Controls */}
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Decrement button */}
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
                  -
                </button>

                <span style={{ minWidth: "24px", textAlign: "center" }}>
                  {sizeObj.quantity}
                </span>

                {/* Increment button */}
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

        {/* NOTE IF <2 DISTINCT SIZES */}
        {distinctSelected < 2 && (
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>
            You must select at least 2 different sizes.
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* CANCEL */}
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

          {/* CONFIRM */}
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
