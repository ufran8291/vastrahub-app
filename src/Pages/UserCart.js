import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { GlobalContext } from "../Context/GlobalContext"; 
import { toast } from "react-toastify";
import { CircularProgress } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md"; // remove + edit icons

// ---------- This overlay is similar to "SizeSelectorOverlay" from Homepage, 
// but used for EDITING an existing product in the cart ----------
function EditOverlay({ productData, existingLines, onClose, onConfirm }) {
  /**
   * productData: { productId, coverImage, title, sizes: [...] }
   * existingLines: array of cart items for these lines (the user's current selections).
   * onClose(): close the overlay
   * onConfirm(updatedSelection): handle final quantity updates
   */
  const [quantities, setQuantities] = useState([]);

  useEffect(() => {
    if (productData?.sizes) {
      // We’ll map each size in productData, 
      // then see if there's a matching existing line. We'll load that quantity.
      const mapped = productData.sizes.map((sizeObj) => {
        const existingLine = existingLines.find(
          (line) => line.size === sizeObj.size
        );
        return {
          ...sizeObj,
          // if found existing line -> use that "quantity", else 0
          quantity: existingLine ? existingLine.quantity : 0,
        };
      });
      setQuantities(mapped);
    }
  }, [productData, existingLines]);

  // Count how many distinct sizes have quantity > 0
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
    // must have at least 2 distinct sizes
    if (distinctSelected < 2) {
      toast.info("Please select at least 2 different sizes for this product.");
      return;
    }
    // Return only lines with quantity > 0
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

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#333",
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
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "0px",
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

// ---------- MAIN COMPONENT ----------
export default function UserCart() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;

  const [cartItems, setCartItems] = useState([]); // raw cart items from Firestore
  const [loading, setLoading] = useState(true);

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // For the "Edit" overlay
  const [editOverlayData, setEditOverlayData] = useState(null); 
  // example shape: { productData: {...}, existingLines: [...], groupKey: <productId> }

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your cart.");
      navigate("/otp-verify");
      return;
    }
    fetchCartItems();
    // eslint-disable-next-line
  }, [isLoggedIn]);

  // =============== 1. LOAD CART ITEMS ===============
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

      // =============== 2. FETCH LATEST PRODUCT DOC ===============
      let updatedItems = [];
      for (let item of cartArr) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();

          // find matching size
          const matchingSize = productData.sizes?.find(
            (s) => s.size === item.size
          );
          if (matchingSize) {
            // store coverImage & productTitle from Firestore for display
            updatedItems.push({
              ...item,
              pricePerPiece: matchingSize.pricePerPiece,
              boxPieces: matchingSize.boxPieces,
              gst: productData.gst || 0,
              coverImage: productData.coverImage || "", 
              productTitle: item.productTitle || productData.title,
              allSizes: productData.sizes, // for editing
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

  // =============== 3. RECALCULATE TOTALS ===============
  const recalcTotals = (items) => {
    let totalWithoutTax = 0;
    let totalTax = 0;
    let total = 0;

    for (let item of items) {
      const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
      const boxes = item.quantity;
      const pricePerBox = item.boxPieces * item.pricePerPiece;
      // if your prices are inclusive of GST:
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

  // =============== GROUP CART ITEMS BY productId ===============
  const groupedCart = useMemo(() => {
    const grouped = {};
    for (let item of cartItems) {
      if (!grouped[item.productId]) {
        grouped[item.productId] = {
          productId: item.productId,
          coverImage: item.coverImage, // store once
          productTitle: item.productTitle,
          allSizes: item.allSizes, // for editing
          lines: [],
        };
      }
      grouped[item.productId].lines.push(item);
    }
    return Object.values(grouped);
  }, [cartItems]);

  // =============== 4. REMOVE ENTIRE PRODUCT ===============
  // Remove all lines in cart for that product
  const removeEntireProduct = async (productId) => {
    try {
      const db = getFirestore();
      // find all lines in cart for that product
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

  // =============== 5. OPEN EDIT OVERLAY ===============
  const openEditOverlay = (group) => {
    /**
     * group = { productId, coverImage, productTitle, allSizes, lines: [...] }
     * lines => user’s current cart lines for that product
     */
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

  // =============== 6. HANDLE EDIT CONFIRM ===============
  const handleEditConfirm = async (updatedSelection) => {
    if (!editOverlayData) return;
    const db = getFirestore();
    const { productData, existingLines } = editOverlayData;

    try {
      // 1) Remove all existing lines from cart for that product
      for (let line of existingLines) {
        await deleteDoc(doc(db, "users", uid, "cart", line.cartItemId));
      }
      // 2) Add new lines
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

  // =============== 7. PLACE ORDER ===============
  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.info("No items in cart.");
      return;
    }

    try {
      const db = getFirestore();
      // line details
      const lineDetails = cartItems.map((item) => {
        const gstRate = isNaN(item.gst) ? 0 : Number(item.gst);
        const lineTotal = item.pricePerPiece * item.boxPieces * item.quantity;
        const lineWithoutTax = lineTotal / (1 + gstRate / 100);
        const lineTax = lineTotal - lineWithoutTax;
        return { ...item, lineTotal, lineWithoutTax, lineTax };
      });

      const totalWithoutTax = lineDetails.reduce(
        (acc, ld) => acc + ld.lineWithoutTax,
        0
      );
      const totalTax = lineDetails.reduce((acc, ld) => acc + ld.lineTax, 0);
      const total = lineDetails.reduce((acc, ld) => acc + ld.lineTotal, 0);

      const orderData = {
        userId: uid,
        orderItems: lineDetails,
        subtotal: +totalWithoutTax.toFixed(2),
        gst: +totalTax.toFixed(2),
        grandTotal: +total.toFixed(2),
        createdAt: new Date(),
        orderStatus: "ACCEPTED",
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // update product stock
      for (let item of cartItems) {
        const productRef = doc(db, "products", item.productId);
        const prodSnap = await getDoc(productRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data();
          const updatedSizes = prodData.sizes.map((s) => {
            if (s.size === item.size) {
              return {
                ...s,
                boxesInStock: s.boxesInStock - item.quantity,
              };
            }
            return s;
          });
          await updateDoc(productRef, { sizes: updatedSizes });
        }
      }

      // Clear cart
      for (let item of cartItems) {
        await deleteDoc(doc(db, "users", uid, "cart", item.cartItemId));
      }
      toast.success("Order placed successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order.");
    }
  };

  // =============== RENDER ===============
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
    <div style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Your Cart</h2>

      {/* GROUPED LAYOUT */}
      {groupedCart.map((group) => {
        // group = { productId, coverImage, productTitle, lines: [...], allSizes: [...] }
        // lines => each size line for that product
        // We'll show the product cover image + title + remove + edit
        return (
          <div
            key={group.productId}
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            {/* HEADER ROW: coverImage + title + buttons */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
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
              <h3 style={{ margin: 0, flex: 1 }}>{group.productTitle}</h3>

              {/* Buttons: Remove & Edit */}
              <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
                {/* Edit => open EditOverlay */}
                <button
                  onClick={() => openEditOverlay(group)}
                  style={{
                    background: "#fff",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontSize: "14px",
                  }}
                >
                  <MdEdit /> Edit
                </button>
                {/* Remove => removeEntireProduct */}
                <button
                  onClick={() => removeEntireProduct(group.productId)}
                  style={{
                    background: "#fff",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontSize: "14px",
                    color: "#d00",
                  }}
                >
                  <MdDelete /> Remove
                </button>
              </div>
            </div>

            {/* Now show each line (size) */}
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
                    padding: "8px",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: "bold" }}>
                      Size: {item.size}, Boxes: {item.quantity}
                    </p>
                    <p style={{ margin: 0, }}>
                       Pieces/Box: {item.boxPieces}
                    </p>
                    <p style={{ margin: 0 }}>
                      Price/Piece: ₹{item.pricePerPiece}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
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
        );
      })}

      {/* Cart TOTALS */}
      <div
        style={{
          padding: "10px",
          border: "1px solid #1976d2",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: 0 }}>Total Without Tax: ₹{subtotal.toFixed(2)}</p>
        <p style={{ margin: 0 }}>Total Tax: ₹{tax.toFixed(2)}</p>
        <p style={{ margin: 0 }}>
          Grand Total (incl. GST): ₹{grandTotal.toFixed(2)}
        </p>
      </div>

      {/* Place Order */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handlePlaceOrder}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Place Order
        </button>
      </div>

      {/* If editing => show "EditOverlay" */}
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
