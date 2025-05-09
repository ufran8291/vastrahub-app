// src/Pages/ViewProduct.js
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
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
  AiOutlineDownload,
  AiOutlineShareAlt,
} from "react-icons/ai";
import { CircularProgress, useMediaQuery } from "@mui/material";

const ViewProduct = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlProductId = searchParams.get("productId");

  const { currentUser, firestoreUser, syncStockDataForIds } =
    useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id || null;

  const productId = state?.productId || urlProductId || null;

  // push ?productId= to URL if we arrived via navigation state
  useEffect(() => {
    if (!urlProductId && state?.productId) {
      setSearchParams({ productId: state.productId }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = useMediaQuery("(max-width:600px)");

  /* -------------------- State -------------------- */
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [sizesSynced, setSizesSynced] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sizesQuantity, setSizesQuantity] = useState([]);
  const [existingCartItems, setExistingCartItems] = useState({});
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [magnifierSize] = useState(150);
  const [zoomScale] = useState(2);
  const imgContainerRef = useRef(null);
  const hasSelection = sizesQuantity.some((q) => q > 0);

  /* -------------------- Helpers -------------------- */
  const computeTotalBoxes = (piecesInStock, boxPieces) => {
    const pieces = piecesInStock || 0;
    const boxPiecesVal = boxPieces || 1;
    const fullBoxes = Math.floor(pieces / boxPiecesVal);
    const remainder = pieces % boxPiecesVal;
    return fullBoxes + (remainder > 0 ? 1 : 0);
  };

  // -------- DISCOUNT HELPERS --------
  const hasValidDiscount =
    product &&
    typeof product.discount === "number" &&
    product.discount > 0 &&
    product.discount < 100;
  const discountMultiplier = hasValidDiscount
    ? 1 - product.discount / 100
    : 1;
  const priceAfterDiscount = (price) =>
    Math.round(price * discountMultiplier);
  // ----------------------------------

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
    const effectivePrice = priceAfterDiscount(sizeObj.pricePerPiece);
    return boxesSelected * sizeObj.boxPieces * effectivePrice;
  };

  /* -------------------- Download / Share -------------------- */
  const getAllImages = () => {
    if (!product) return [];
    return [product.coverImage, ...(product.additionalImages || [])].filter(
      Boolean
    );
  };
  const handleDownloadImages = () => {
    const images = getAllImages();
    images.forEach((url, index) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${product.title || "product"}-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  const handleShareProduct = () => {
    const url = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Product link copied to clipboard!"))
        .catch(() => toast.error("Failed to copy link"));
    } else {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("Product link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(ta);
    }
  };

  /* -------------------- Effects -------------------- */
  // ------ Fetch Product ------
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
          let initialQuantities =
            data.sizes && Array.isArray(data.sizes)
              ? data.sizes.map(() => 0)
              : [];
          if (data.sizes && Array.isArray(data.sizes) && uid) {
            const cartRef = collection(db, "users", uid, "cart");
            const q = query(cartRef, where("productId", "==", productId));
            const snapshot = await getDocs(q);
            let mapping = {};
            snapshot.forEach((snap) => {
              const cartData = snap.data();
              mapping[cartData.size] = cartData.quantity;
            });
            initialQuantities = data.sizes.map(
              (s) => mapping[s.size] || 0
            );
            setExistingCartItems(mapping);
          }
          setSizesQuantity(initialQuantities);
        } else {
          toast.error("Product not found in database.");
          navigate("/");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Error fetching product details.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate, uid]);

  // ------ Sync Stock ------
  useEffect(() => {
    async function syncSizes() {
      if (!isLoggedIn) {
        setLoadingSizes(false);
        return;
      }
      if (product && product.sizes && product.sizes.length && !sizesSynced) {
        setLoadingSizes(true);
        try {
          const storeDoc = await getDoc(doc(db, "banners", "other-data"));
          const isStoreOpen = storeDoc.exists()
            ? storeDoc.data().isStoreOpen
            : false;
          if (isStoreOpen) {
            const inventoryIds = product.sizes.map((s) =>
              Number(s.inventoryId)
            );
            await syncStockDataForIds(inventoryIds);
            const prodDoc = await getDoc(doc(db, "products", productId));
            if (prodDoc.exists()) {
              const updatedProduct = prodDoc.data();
              setProduct(updatedProduct);
              const initData = updatedProduct.sizes.map(
                (s) => existingCartItems[s.size] || 0
              );
              setSizesQuantity(initData);
            }
          }
          setSizesSynced(true);
        } catch (err) {
          console.error("Error syncing sizes:", err);
          toast.error("Error syncing stock data.");
        } finally {
          setLoadingSizes(false);
        }
      }
    }
    syncSizes();
  }, [
    product,
    productId,
    sizesSynced,
    syncStockDataForIds,
    existingCartItems,
    isLoggedIn,
  ]);

  // ------ Preload images ------
  useEffect(() => {
    if (!product) return;
    getAllImages().forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [product]);

  /* -------------------- Image Carousel -------------------- */
  const totalImagesCount = getAllImages().length;
  const getCurrentImageUrl = () =>
    totalImagesCount ? getAllImages()[currentImageIndex] : "";
  const handleNextImage = () =>
    setCurrentImageIndex((i) => (i + 1) % totalImagesCount);
  const handlePrevImage = () =>
    setCurrentImageIndex(
      (i) => (i - 1 + totalImagesCount) % totalImagesCount
    );

  /* -------------------- Size Selectors -------------------- */
  const handlePlus = (index) => {
    if (!isLoggedIn) return;
    setSizesQuantity((prev) => {
      const updated = [...prev];
      if (updated[index] !== null) updated[index] += 1;
      return updated;
    });
  };
  const handleMinus = (index) => {
    if (!isLoggedIn) return;
    setSizesQuantity((prev) => {
      const updated = [...prev];
      if (updated[index] !== null && updated[index] > 0) updated[index] -= 1;
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

  /* -------------------- Add to Cart -------------------- */
  const handleAddToCart = async () => {
    if (!isLoggedIn) return;
    try {
      const cartRef = collection(db, "users", uid, "cart");
      const q = query(cartRef, where("productId", "==", productId));
      const snapshot = await getDocs(q);
      let mapping = {};
      snapshot.forEach((snap) => {
        mapping[snap.data().size] = {
          docId: snap.id,
          quantity: snap.data().quantity,
        };
      });
      let anySelected = false;
      for (let i = 0; i < product.sizes.length; i++) {
        const sizeObj = product.sizes[i];
        const boxesSelected = sizesQuantity[i];
        if (boxesSelected > 0) anySelected = true;
        const effectivePrice = priceAfterDiscount(sizeObj.pricePerPiece);
        if (boxesSelected > 0) {
          const noOfPieces = computeTotalPieces(
            boxesSelected,
            sizeObj.boxPieces,
            sizeObj.piecesInStock
          );
          const cartData = {
            productId,
            productTitle: product.title,
            size: sizeObj.size,
            pricePerPiece: effectivePrice,
            discountPercent: hasValidDiscount ? product.discount : 0,
            boxPieces: sizeObj.boxPieces,
            quantity: boxesSelected,
            noOfPieces,
            updatedAt: new Date(),
            inventoryId: sizeObj.inventoryId,
          };
          if (mapping[sizeObj.size]) {
            const docRef = doc(
              db,
              "users",
              uid,
              "cart",
              mapping[sizeObj.size].docId
            );
            await setDoc(docRef, cartData, { merge: true });
          } else {
            await setDoc(doc(cartRef), cartData);
          }
        } else if (mapping[sizeObj.size]) {
          const docRef = doc(
            db,
            "users",
            uid,
            "cart",
            mapping[sizeObj.size].docId
          );
          await deleteDoc(docRef);
        }
      }
      if (!anySelected) {
        toast.info(
          "No valid boxes selected. Please pick at least one size with stock."
        );
        return;
      }
      toast.success("Selected items updated in cart!");
    } catch (err) {
      console.error("Error updating cart:", err);
      toast.error("Failed to update cart.");
    }
  };

  /* -------------------- Magnifier -------------------- */
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (getCurrentImageUrl()) setShowMagnifier(true);
  };
  const handleMouseLeave = () => setShowMagnifier(false);
  const handleMouseMove = (e) => {
    if (!imgContainerRef.current) return;
    const { left, top, width, height } =
      imgContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const lensRadius = magnifierSize / 2;
    const clampedX = Math.max(lensRadius, Math.min(x, width - lensRadius));
    const clampedY = Math.max(lensRadius, Math.min(y, height - lensRadius));
    setMagnifierPos({ x: clampedX, y: clampedY });
  };

  const goToLogin = () => {
    navigate("/otp-verify", {
      state: {
        returnTo: {
          pathname: location.pathname,
          state: { productId },
        },
      },
    });
  };

  /* -------------------- Early returns -------------------- */
  if (loading) {
    return (
      <div
        style={{
          padding: isMobile ? "40px" : "60px",
          textAlign: "center",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        Loading product details...
      </div>
    );
  }
  if (!product) return null;

  /* -------------------- Derived values -------------------- */
  const minPrice = (() => {
    if (!product.sizes) return null;
    const validSizes = product.sizes.filter(
      (s) => computeTotalBoxes(s.piecesInStock, s.boxPieces) > 0
    );
    if (!validSizes.length) return null;
    return Math.min(
      ...validSizes.map((s) => priceAfterDiscount(s.pricePerPiece))
    );
  })();

  const cartButtonTooltip = !isLoggedIn
    ? "Please log in to add items to cart."
    : !hasSelection
    ? "Please select at least one size."
    : "";

  /* -------------------- Render -------------------- */
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: isMobile ? "20px 10px" : "30px",
      }}
    >
      {/* -------- IMAGE CAROUSEL -------- */}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          marginBottom: isMobile ? "20px" : "30px",
        }}
      >
        <div
          style={{ position: "relative", display: "inline-block" }}
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
                left: isMobile ? "-30px" : "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#000",
                color: "#fff",
                border: "none",
                fontSize: isMobile ? "16px" : "20px",
                cursor: "pointer",
                padding: "8px",
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
                width: "100%",
                maxWidth: isMobile ? "100%" : "600px",
                height: "auto",
                maxHeight: isMobile ? "70vh" : "450px",
                objectFit: "contain",
                borderRadius: "8px",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: isMobile ? "90vw" : "600px",
                height: isMobile ? "250px" : "450px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
              }}
            />
          )}
          {totalImagesCount > 1 && (
            <button
              onClick={handleNextImage}
              style={{
                position: "absolute",
                right: isMobile ? "-30px" : "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#000",
                color: "#fff",
                border: "none",
                fontSize: isMobile ? "16px" : "20px",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "4px",
              }}
            >
              <AiOutlineArrowRight />
            </button>
          )}
          {showMagnifier &&
            (() => {
              const { width, height } =
                imgContainerRef.current.getBoundingClientRect();
              return (
                <div
                  style={{
                    position: "absolute",
                    pointerEvents: "none",
                    width: magnifierSize,
                    height: magnifierSize,
                    borderRadius: "50%",
                    overflow: "hidden",
                    top: magnifierPos.y - magnifierSize / 2,
                    left: magnifierPos.x - magnifierSize / 2,
                    border: "2px solid #999",
                    backgroundImage: `url('${getCurrentImageUrl()}')`,
                    backgroundSize: `${width * zoomScale}px ${
                      height * zoomScale
                    }px`,
                    backgroundPositionX: `-${
                      magnifierPos.x * zoomScale - magnifierSize / 2
                    }px`,
                    backgroundPositionY: `-${
                      magnifierPos.y * zoomScale - magnifierSize / 2
                    }px`,
                  }}
                />
              );
            })()}
        </div>
        {totalImagesCount > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: isMobile ? "10px" : "15px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Image {currentImageIndex + 1} of {totalImagesCount}
          </div>
        )}
      </div>

      {/* -------- DOWNLOAD / SHARE -------- */}
      {isLoggedIn && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: isMobile ? "16px" : "20px",
          }}
        >
          <button
            onClick={handleDownloadImages}
            style={{
              padding: isMobile ? "8px 16px" : "10px 20px",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: isMobile ? "14px" : "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AiOutlineDownload size={isMobile ? 18 : 20} />
            Download Images
          </button>
          <button
            onClick={handleShareProduct}
            style={{
              padding: isMobile ? "8px 16px" : "10px 20px",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: isMobile ? "14px" : "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AiOutlineShareAlt size={isMobile ? 18 : 20} />
            Share Product
          </button>
        </div>
      )}

      {/* -------- TITLE & STARTING PRICE -------- */}
      <div style={{ marginBottom: isMobile ? "24px" : "30px" }}>
        <h1
          style={{
            fontFamily: "Lora, serif",
            fontWeight: "600",
            fontSize: isMobile ? "24px" : "32px",
            marginBottom: "10px",
            textTransform: "uppercase",
          }}
        >
          {product.title || "Untitled Product"}
        </h1>

        {isLoggedIn && minPrice ? (
          hasValidDiscount ? (
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              Starting from{" "}
              <span style={{ textDecoration: "line-through", marginRight: 6 }}>
                ₹{Math.min(
                  ...product.sizes.map((s) => s.pricePerPiece)
                )}
              </span>
              <span style={{ fontWeight: 600 }}>₹{minPrice}</span>{" "}
              per piece ({product.discount}% OFF)
            </p>
          ) : (
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                color: "#666",
                marginBottom: "20px",
              }}
            >
              Starting from ₹{minPrice} per piece
            </p>
          )
        ) : !isLoggedIn ? (
          <p
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: isMobile ? "14px" : "16px",
              color: "#666",
              marginBottom: "20px",
            }}
          >
            Starting from -- per piece (Login to view prices)
          </p>
        ) : null}

        {/* --- Product Meta --- */}
        <div style={{ display: "flex", flexWrap: "wrap", rowGap: "10px" }}>
          <div style={{ flex: "1 1 300px" }}>
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                fontWeight: "500",
                marginBottom: "5px",
              }}
            >
              Brand: {product.brandName || "N/A"}
            </p>
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                marginBottom: "5px",
              }}
            >
              Fabric: {product.fabric || "N/A"}
            </p>
            {product.additionalInfo && (
              <p
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: isMobile ? "14px" : "16px",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Additional Info: {product.additionalInfo}
              </p>
            )}
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                marginBottom: "5px",
              }}
            >
              Category: {product.category || "N/A"}
            </p>
            {product.colors && (
              <p
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                Colors: {product.colors}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -------- SIZE SELECTOR -------- */}
      <div
        style={{
          marginBottom: isMobile ? "24px" : "30px",
          position: "relative",
          padding: "0 10px",
        }}
      >
        <h2
          style={{
            fontFamily: "Lora, serif",
            fontWeight: "600",
            fontSize: isMobile ? "20px" : "24px",
            marginBottom: "15px",
          }}
        >
          Select Sizes & Quantities
        </h2>

        {loadingSizes ? (
          <div
            style={{
              minHeight: "180px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress size={isMobile ? 24 : 40} />
            <p
              style={{
                marginLeft: "10px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
              }}
            >
              Loading size details...
            </p>
          </div>
        ) : product.sizes && product.sizes.length ? (
          <div style={{ border: "1px solid #ccc", borderRadius: "8px" }}>
            {product.sizes.map((sizeObj, idx) => {
              const boxesSelected = sizesQuantity[idx];
              const availableBoxes = computeTotalBoxes(
                sizeObj.piecesInStock,
                sizeObj.boxPieces
              );
              const effectivePrice = priceAfterDiscount(
                sizeObj.pricePerPiece
              );
              const totalForSize = isLoggedIn
                ? getSizeTotal(sizeObj, boxesSelected)
                : 0;
              const totalPiecesSelected = computeTotalPieces(
                boxesSelected,
                sizeObj.boxPieces,
                sizeObj.piecesInStock
              );
              const remainder =
                (sizeObj.piecesInStock || 0) % (sizeObj.boxPieces || 1);

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    padding: "10px",
                    gap: isMobile ? "8px" : 0,
                    borderBottom:
                      idx !== product.sizes.length - 1
                        ? "1px solid #eee"
                        : "none",
                  }}
                >
                  {/* --- Size + Price --- */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: isMobile ? "14px" : "16px",
                        fontWeight: 500,
                        marginBottom: "6px",
                      }}
                    >
                      Size: {sizeObj.size}
                    </p>
                    <p
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: isMobile ? "12px" : "14px",
                        marginBottom: "6px",
                      }}
                    >
                      {isLoggedIn ? (
                        hasValidDiscount ? (
                          <>
                            Price/Piece:{" "}
                            <span
                              style={{
                                textDecoration: "line-through",
                                marginRight: 4,
                              }}
                            >
                              ₹{sizeObj.pricePerPiece}
                            </span>
                            ₹{effectivePrice} | Pieces/Box:{" "}
                            {sizeObj.boxPieces}
                          </>
                        ) : (
                          <>
                            Price/Piece: ₹{sizeObj.pricePerPiece} |
                            Pieces/Box: {sizeObj.boxPieces}
                          </>
                        )
                      ) : (
                        <>
                          Price/Piece: -- | Pieces/Box: {sizeObj.boxPieces}
                        </>
                      )}
                    </p>
                  </div>

                  {/* --- Quantity controls --- */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: isMobile ? 0 : 8,
                    }}
                  >
                    <button
                      onClick={() => handleMinus(idx)}
                      disabled={!boxesSelected || boxesSelected <= 0}
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #333",
                        marginRight: "8px",
                        width: isMobile ? 26 : 30,
                        height: isMobile ? 26 : 30,
                        borderRadius: "4px",
                        fontSize: 16,
                        cursor:
                          isLoggedIn && boxesSelected > 0
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      <AiOutlineMinus />
                    </button>
                    <p
                      style={{
                        width: isMobile ? 26 : 30,
                        textAlign: "center",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: isMobile ? "14px" : "16px",
                      }}
                    >
                      {boxesSelected || 0}
                    </p>
                    <button
                      onClick={() => handlePlus(idx)}
                      disabled={
                        !isLoggedIn ||
                        (boxesSelected !== null &&
                          boxesSelected >= availableBoxes)
                      }
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #333",
                        marginLeft: "8px",
                        width: isMobile ? 26 : 30,
                        height: isMobile ? 26 : 30,
                        borderRadius: "4px",
                        fontSize: 16,
                        cursor: isLoggedIn ? "pointer" : "not-allowed",
                      }}
                    >
                      <AiOutlinePlus />
                    </button>
                  </div>

                  {/* --- Totals / Stock --- */}
                  <div
                    style={{
                      marginLeft: isMobile ? 0 : 20,
                      textAlign: isMobile ? "left" : "right",
                    }}
                  >
                    {availableBoxes === 0 ? (
                      <p
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: isMobile ? "12px" : "14px",
                          color: "#D32F2F",
                          marginBottom: 0,
                        }}
                      >
                        ❌ Out of Stock
                      </p>
                    ) : (
                      <>
                        <p
                          style={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fontSize: isMobile ? "12px" : "14px",
                            marginBottom: 2,
                          }}
                        >
                          {isLoggedIn ? (
                            <>
                              Total: ₹{totalForSize}
                              {hasValidDiscount && (
                                <>
                                  {" "}
                                  (
                                  {product.discount}% OFF)
                                </>
                              )}
                            </>
                          ) : (
                            "Total: --"
                          )}
                        </p>
                        {isLoggedIn && (
                          <p
                            style={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontSize: 12,
                              color: "#888",
                              margin: 0,
                            }}
                          >
                            Total Pieces: {totalPiecesSelected}
                            {boxesSelected === availableBoxes &&
                              remainder > 0 && (
                                <>
                                  <br />
                                  Last box has only {remainder} pieces
                                </>
                              )}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
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
              padding: "20px",
            }}
          >
            <p
              style={{
                color: "#fff",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                margin: "10px 0",
                textAlign: "center",
              }}
            >
              You must log in to view prices or order from Vastrahub
            </p>
            <button
              onClick={goToLogin}
              style={{
                padding: isMobile ? "10px 20px" : "12px 24px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                fontSize: isMobile ? "14px" : "16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              LOGIN / CREATE ACCOUNT
            </button>
          </div>
        )}
      </div>

      {/* -------- GRAND TOTAL / CART BUTTON -------- */}
      {product.sizes &&
        product.sizes.some(
          (s) => computeTotalBoxes(s.piecesInStock, s.boxPieces) > 0
        ) && (
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              marginTop: "10px",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? "12px" : 0,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "600",
                  marginBottom: 0,
                }}
              >
                {isLoggedIn
                  ? `Grand Total: ₹${getAllSizesTotal()}${
                      hasValidDiscount ? ` (${product.discount}% OFF)` : ""
                    }`
                  : "Grand Total: --"}
              </p>
            </div>
            <Tooltip title={cartButtonTooltip} arrow>
              <span>
                <button
                  onClick={isLoggedIn ? handleAddToCart : undefined}
                  disabled={!isLoggedIn || !hasSelection}
                  style={{
                    padding: isMobile ? "12px 22px" : "14px 28px",
                    backgroundColor:
                      isLoggedIn && hasSelection ? "#333" : "#bbb",
                    color: "#fff",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "500",
                    borderRadius: "4px",
                    border: "none",
                    cursor:
                      isLoggedIn && hasSelection ? "pointer" : "not-allowed",
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
