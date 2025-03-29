// src/Pages/ViewProduct.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";
import { GlobalContext } from "../Context/GlobalContext";
import Tooltip from "@mui/material/Tooltip";
import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlinePlus,
  AiOutlineMinus,
} from "react-icons/ai";
import { CircularProgress } from "@mui/material";

const ViewProduct = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { currentUser, firestoreUser, syncStockDataForIds } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id || null;
  const productId = state?.productId || null;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [sizesSynced, setSizesSynced] = useState(false); // NEW: flag to ensure sizes are synced only once
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sizesQuantity, setSizesQuantity] = useState([]);
  const [existingCartItems, setExistingCartItems] = useState({});
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [magnifierSize] = useState(150);
  const [zoomScale] = useState(2);
  const imgContainerRef = useRef(null);

  // ---------- Helper Functions ----------
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
    if (quantity <= fullBoxes) {
      return quantity * boxPieces;
    } else {
      return fullBoxes * boxPieces + remainder;
    }
  };

  const getSizeTotal = (sizeObj, boxesSelected) => {
    if (boxesSelected === null || !sizeObj) return 0;
    return boxesSelected * sizeObj.boxPieces * sizeObj.pricePerPiece;
  };

  const getCountDistinctSizesSelected = () => {
    return sizesQuantity.filter((q) => q && q > 0).length;
  };

  // ---------- Effect: Fetch Product and Initialize Quantities ----------
  useEffect(() => {
    if (!productId) {
      toast.error("No product ID provided.");
      navigate("/");
      return;
    }
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);
          let initialQuantities = data.sizes && Array.isArray(data.sizes)
            ? data.sizes.map((s) => 0)
            : [];
          // If user is logged in, fetch cart items to prefill quantities.
          if (data.sizes && Array.isArray(data.sizes) && uid) {
            try {
              const cartRef = collection(db, "users", uid, "cart");
              const q = query(cartRef, where("productId", "==", productId));
              const snapshot = await getDocs(q);
              let mapping = {};
              snapshot.forEach((docSnap) => {
                const cartData = docSnap.data();
                mapping[cartData.size] = cartData.quantity;
              });
              initialQuantities = data.sizes.map((s) => mapping[s.size] || 0);
              setExistingCartItems(mapping);
            } catch (error) {
              console.error("Error fetching cart items:", error);
            }
          }
          setSizesQuantity(initialQuantities);
        } else {
          toast.error("Product not found in database.");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error fetching product details.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate, uid]);

  // ---------- Effect: Sync Sizes Stock Data (only once) ----------
  useEffect(() => {
    async function syncSizes() {
       // Only sync sizes if user is logged in
       if (!isLoggedIn) {
        console.log('not logged in skipping stock sync')
        setLoadingSizes(false);
        return;
      }
      if (product && product.sizes && product.sizes.length > 0 && !sizesSynced) {
        setLoadingSizes(true);
        try {
          // Check store status.
          const storeDoc = await getDoc(doc(db, "banners", "other-data"));
          let isStoreOpen = false;
          if (storeDoc.exists()) {
            isStoreOpen = storeDoc.data().isStoreOpen;
          }
          if (isStoreOpen) {
            const inventoryIds = product.sizes.map((s) => Number(s.inventoryId));
            console.log("Syncing sizes for inventory IDs:", inventoryIds);
            await syncStockDataForIds(inventoryIds);
            console.log("Stock sync complete.");
            // Re-fetch product to update sizes.
            const prodDoc = await getDoc(doc(db, "products", productId));
            if (prodDoc.exists()) {
              const updatedProduct = prodDoc.data();
              setProduct(updatedProduct);
              // Reinitialize sizesQuantity preserving any existing cart quantities.
              const initData = updatedProduct.sizes.map((s) => existingCartItems[s.size] || 0);
              setSizesQuantity(initData);
            }
          } else {
            console.log("Store is closed. Skipping sizes sync.");
          }
          setSizesSynced(true);
        } catch (err) {
          console.error("Error syncing sizes:", err);
          toast.error("Error syncing stock data.");
        } finally {
          setLoadingSizes(false);
        }
      } else {
        setLoadingSizes(false);
      }
    }
    syncSizes();
  }, [product, productId, sizesSynced, syncStockDataForIds, existingCartItems]);

  // ---------- Effect: Preload Images ----------
  useEffect(() => {
    if (!product) return;
    getAllImages().forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [product]);

  const getAllImages = () => {
    if (!product) return [];
    return [product.coverImage, ...(product.additionalImages || [])].filter(Boolean);
  };
  const totalImagesCount = getAllImages().length;
  const getCurrentImageUrl = () => {
    const allImgs = getAllImages();
    return allImgs.length ? allImgs[currentImageIndex] : "";
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImagesCount);
  };
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImagesCount) % totalImagesCount);
  };

  // ---------- Size Selector Handlers ----------
  const handlePlus = (index) => {
    if (!isLoggedIn) return;
    setSizesQuantity((prev) => {
      const updated = [...prev];
      if (updated[index] !== null) {
        updated[index] += 1;
      }
      return updated;
    });
  };

  const handleMinus = (index) => {
    if (!isLoggedIn) return;
    setSizesQuantity((prev) => {
      const updated = [...prev];
      if (updated[index] !== null && updated[index] > 0) {
        updated[index] -= 1;
      }
      return updated;
    });
  };

  const getAllSizesTotal = () => {
    if (!product?.sizes) return 0;
    return product.sizes.reduce((acc, sizeObj, i) => {
      if (sizesQuantity[i] !== null) {
        acc += getSizeTotal(sizeObj, sizesQuantity[i]);
      }
      return acc;
    }, 0);
  };

  // ---------- Add to Cart Handler ----------
  const handleAddToCart = async () => {
    if (!isLoggedIn) return;
    const distinctSizesSelected = sizesQuantity.filter((q) => q > 0).length;
    if (distinctSizesSelected < 2) {
      toast.info("Please select at least 2 different sizes to add to cart.");
      return;
    }
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const q = query(cartRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      let mapping = {};
      snapshot.forEach((docSnap) => {
        mapping[docSnap.data().size] = { docId: docSnap.id, quantity: docSnap.data().quantity };
      });
      let anySelected = false;
      for (let i = 0; i < product.sizes.length; i++) {
        const sizeObj = product.sizes[i];
        const boxesSelected = sizesQuantity[i];
        if (boxesSelected > 0) anySelected = true;
        if (boxesSelected > 0) {
          const noOfPieces = computeTotalPieces(boxesSelected, sizeObj.boxPieces, sizeObj.piecesInStock);
          const cartData = {
            productId: productId,
            productTitle: product.title,
            size: sizeObj.size,
            pricePerPiece: sizeObj.pricePerPiece,
            boxPieces: sizeObj.boxPieces,
            quantity: boxesSelected,
            noOfPieces,
            updatedAt: new Date(),
          };
          if (mapping[sizeObj.size]) {
            const docRef = doc(db, "users", uid, "cart", mapping[sizeObj.size].docId);
            await setDoc(docRef, cartData, { merge: true });
          } else {
            const newDocRef = doc(cartRef);
            await setDoc(newDocRef, cartData);
          }
        } else {
          if (mapping[sizeObj.size]) {
            const docRef = doc(db, "users", uid, "cart", mapping[sizeObj.size].docId);
            await deleteDoc(docRef);
          }
        }
      }
      if (!anySelected) {
        toast.info("No valid boxes selected. Please pick at least one size with stock.");
        return;
      }
      toast.success("Selected items updated in cart!");
    } catch (err) {
      console.error("Error updating cart:", err);
      toast.error("Failed to update cart.");
    }
  };

  // ---------- Magnifier Handlers ----------
  const handleMouseEnter = () => {
    if (getCurrentImageUrl()) setShowMagnifier(true);
  };
  const handleMouseLeave = () => setShowMagnifier(false);
  const handleMouseMove = (e) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } = imgContainerRef.current.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;
    const lensRadius = magnifierSize / 2;
    const clampedX = Math.max(lensRadius, Math.min(x, width - lensRadius));
    const clampedY = Math.max(lensRadius, Math.min(y, height - lensRadius));
    setMagnifierPos({ x: clampedX, y: clampedY });
  };

  const goToLogin = () => {
    navigate("/otp-verify");
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        Loading product details...
      </div>
    );
  }
  if (!product) return null;

  const minPrice = (() => {
    if (!product.sizes) return null;
    const valid = product.sizes.filter((s) => computeTotalBoxes(s.piecesInStock, s.boxPieces) > 0);
    if (!valid.length) return null;
    return Math.min(...valid.map((s) => s.pricePerPiece));
  })();
  const distinctSizesSelected = getCountDistinctSizesSelected();
  const cartButtonTooltip = !isLoggedIn
    ? "Please log in to add items to cart."
    : distinctSizesSelected < 2
    ? "Please select at least 2 different sizes."
    : "";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px" }}>
      {/* ---------- Carousel Section ---------- */}
      <div style={{ position: "relative", textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{ marginBottom: "10px", display: "inline-block", position: "relative" }}
          ref={imgContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          {totalImagesCount > 1 && (
            <button
              onClick={handlePrevImage}
              style={{
                position: "absolute",
                left: "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#000",
                color: "#fff",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              <AiOutlineArrowLeft />
            </button>
          )}
          {getCurrentImageUrl() ? (
            <img
              src={getCurrentImageUrl()}
              alt="Product"
              style={{
                maxWidth: "600px",
                maxHeight: "450px",
                objectFit: "contain",
                borderRadius: "8px",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: "600px", height: "450px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
              No Images
            </div>
          )}
          {totalImagesCount > 1 && (
            <button
              onClick={handleNextImage}
              style={{
                position: "absolute",
                right: "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#000",
                color: "#fff",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              <AiOutlineArrowRight />
            </button>
          )}
          {showMagnifier && (
            <div
              style={{
                position: "absolute",
                pointerEvents: "none",
                width: magnifierSize + "px",
                height: magnifierSize + "px",
                borderRadius: "50%",
                overflow: "hidden",
                top: magnifierPos.y - magnifierSize / 2,
                left: magnifierPos.x - magnifierSize / 2,
                border: "2px solid #999",
                boxSizing: "border-box",
                backgroundImage: `url('${getCurrentImageUrl()}')`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${600 * zoomScale}px ${450 * zoomScale}px`,
                backgroundPositionX: -(magnifierPos.x * zoomScale - magnifierSize / 2),
                backgroundPositionY: -(magnifierPos.y * zoomScale - magnifierSize / 2),
              }}
            />
          )}
        </div>
        {totalImagesCount > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "15px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Image {currentImageIndex + 1} of {totalImagesCount}
          </div>
        )}
      </div>

      {/* ---------- Product Title + Starting Price ---------- */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontFamily: "Lora, serif", fontWeight: "600", fontSize: "32px", marginBottom: "10px", textTransform: "uppercase" }}>
          {product.title || "Untitled Product"}
        </h1>
        {minPrice && isLoggedIn ? (
          <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            Starting from ₹{minPrice} per piece
          </p>
        ) : !isLoggedIn ? (
          <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            Starting from -- per piece (Login to view prices)
          </p>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", rowGap: "10px" }}>
          <div style={{ flex: "1 1 300px" }}>
            <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", fontWeight: "500", marginBottom: "5px" }}>
              Brand: {product.brandName || "N/A"}
            </p>
            <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", marginBottom: "5px" }}>
              Fabric: {product.fabric || "N/A"}
            </p>
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", marginBottom: "5px" }}>
              Category: {product.category || "N/A"}
            </p>
            {product.colors && (
              <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px" }}>
                Colors: {product.colors}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Size-Quantity Selector ---------- */}
      <div style={{ marginBottom: "30px", position: "relative", padding: "0 10px" }}>
        <h2 style={{ fontFamily: "Lora, serif", fontWeight: "600", fontSize: "24px", marginBottom: "15px" }}>
          Select Sizes & Quantities
        </h2>
        {loadingSizes ? (
          <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress />
            <p style={{ marginLeft: "10px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>Loading size details...</p>
          </div>
        ) : product.sizes && product.sizes.length > 0 ? (
          <div style={{ border: "1px solid #ccc", borderRadius: "8px" }}>
            {product.sizes.map((sizeObj, index) => {
              const boxesSelected = sizesQuantity[index];
              const availableBoxes = computeTotalBoxes(sizeObj.piecesInStock, sizeObj.boxPieces);
              const totalForThisSize = isLoggedIn ? getSizeTotal(sizeObj, boxesSelected) : 0;
              const totalPiecesSelected = computeTotalPieces(boxesSelected, sizeObj.boxPieces, sizeObj.piecesInStock);
              const remainder = (sizeObj.piecesInStock || 0) % (sizeObj.boxPieces || 1);
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    borderBottom: index !== product.sizes.length - 1 ? "1px solid #eee" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", fontWeight: "500", marginBottom: "6px" }}>
                      Size: {sizeObj.size}
                    </p>
                    <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "14px", marginBottom: "6px" }}>
                      {isLoggedIn
                        ? `Price/Piece: ₹${sizeObj.pricePerPiece} | Pieces/Box: ${sizeObj.boxPieces}`
                        : `Price/Piece: -- | Pieces/Box: ${sizeObj.boxPieces}`}
                    </p>
                    {/* <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "14px", color: "#555", marginBottom: "0px" }}>
                      Boxes in Stock: {availableBoxes}
                    </p> */}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <button
                      onClick={() => handleMinus(index)}
                      disabled={!boxesSelected || boxesSelected <= 0}
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #333",
                        marginRight: "8px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: isLoggedIn && boxesSelected > 0 ? "pointer" : "not-allowed",
                      }}
                    >
                      <AiOutlineMinus />
                    </button>
                    <p style={{ width: "30px", textAlign: "center", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      {boxesSelected || 0}
                    </p>
                    <button
                      onClick={() => handlePlus(index)}
                      disabled={!isLoggedIn || (boxesSelected !== null && boxesSelected >= availableBoxes)}
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #333",
                        marginLeft: "8px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: isLoggedIn ? "pointer" : "not-allowed",
                      }}
                    >
                      <AiOutlinePlus />
                    </button>
                  </div>
                  <div style={{ marginLeft: "20px", textAlign: "right" }}>
                    <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "14px", marginBottom: "0px" }}>
                      {isLoggedIn ? `Total: ₹${totalForThisSize}` : "Total: --"}
                    </p>
                    {isLoggedIn && (
                      <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "12px", color: "#888", margin: "0" }}>
                        Total Pieces: {totalPiecesSelected}
                        {boxesSelected === availableBoxes && remainder > 0 && (
                          <>
                            <br />
                            Last box has only {remainder} pieces
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            No sizes available for this product.
          </p>
        )}
        {!isLoggedIn && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              borderRadius: "8px",
            }}
          >
            <p
              style={{
                color: "#fff",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: "16px",
                margin: "10px 0",
                textAlign: "center",
              }}
            >
              You must log in to view prices or order from Vastrahub
            </p>
            <button
              onClick={goToLogin}
              style={{
                padding: "10px 20px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                fontSize: "16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              LOGIN / CREATE ACCOUNT
            </button>
          </div>
        )}
      </div>

      {/* ---------- Grand Total & "Add to Cart" ---------- */}
      {product.sizes && product.sizes.some((s) => computeTotalBoxes(s.piecesInStock, s.boxPieces) > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "16px", fontWeight: "600", marginBottom: 0 }}>
              {isLoggedIn ? `Grand Total: ₹${getAllSizesTotal()}` : "Grand Total: --"}
            </p>
            {getCountDistinctSizesSelected() < 2 && (
              <p style={{ fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "14px", color: "#888", margin: "4px 0 0" }}>
                You must select at least 2 different sizes.
              </p>
            )}
          </div>
          <Tooltip title={!isLoggedIn ? "Please log in to add items to cart." : getCountDistinctSizesSelected() < 2 ? "Please select at least 2 different sizes." : ""} arrow>
            <span>
              <button
                onClick={isLoggedIn ? handleAddToCart : undefined}
                disabled={!isLoggedIn || getCountDistinctSizesSelected() < 2}
                style={{
                  padding: "14px 28px",
                  backgroundColor: isLoggedIn ? "#333" : "#bbb",
                  color: "#fff",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: "16px",
                  fontWeight: "500",
                  borderRadius: "4px",
                  border: "none",
                  cursor: isLoggedIn ? "pointer" : "not-allowed",
                }}
              >
                ADD TO CART
              </button>
            </span>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default ViewProduct;
