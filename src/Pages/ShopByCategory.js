// src/Pages/ShopByCategory.js

import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";

// Reuse placeholders
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";

// Components
// import SizeSelectorOverlay from "../Components/SizeSelectorOverlay";
import SizeSelectorOverlay from '../components/SizeSelectorOverlay'

// Import GlobalContext to get user info
import { GlobalContext } from "../Context/GlobalContext";

export default function ShopByCategory() {
  const navigate = useNavigate();
  const location = useLocation();

  // Access user info from GlobalContext
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  // The category object we passed from Homepage or Navigation
  const { category } = location.state || {};

  // Handle if user navigated manually without category
  useEffect(() => {
    if (!category) {
      toast.error("No category selected.");
      navigate("/");
    }
  }, [category, navigate]);

  const [allProducts, setAllProducts] = useState([]);
  const [allSubcatsFromProducts, setAllSubcatsFromProducts] = useState([]);
  const [selectedSubcats, setSelectedSubcats] = useState([]);

  // Overlay product for Add to Cart
  const [overlayProduct, setOverlayProduct] = useState(null);

  // The category doc has an array "subCategories" (strings):
  const catSubCategories = category?.subCategories || [];

  // ---------------- 1) FETCH PRODUCTS FOR THIS CATEGORY ----------------
  useEffect(() => {
    if (!category) return;

    console.log("Category received in ShopByCategory:", category);

    async function fetchCategoryProducts() {
      try {
        // Example: products have a "category" field matching category.name
        const productsRef = collection(db, "products");
        const qCat = query(productsRef, where("category", "==", category.name));
        const snapshot = await getDocs(qCat);

        const prodArr = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          prodArr.push({ id: docSnap.id, ...data });
        });

        setAllProducts(prodArr);

        // Gather subcategories found in these products 
        const subcatSet = new Set();
        prodArr.forEach((p) => {
          if (p.subcategory) {
            if (Array.isArray(p.subcategory)) {
              p.subcategory.forEach((sc) => subcatSet.add(sc));
            } else {
              subcatSet.add(p.subcategory);
            }
          }
        });

        // Combine subcategories from product docs + subCategories from the category doc
        catSubCategories.forEach((sc) => subcatSet.add(sc));
        setAllSubcatsFromProducts([...subcatSet]);
      } catch (error) {
        console.error("Error fetching category products:", error);
        toast.error("Unable to load products for this category.");
      }
    }

    fetchCategoryProducts();
  }, [category, catSubCategories]);

  // ---------------- 2) FILTER PRODUCTS BASED ON SELECTED SUBCATS ----------------
  // If no subcats selected => show all
  const filteredProducts = allProducts.filter((prod) => {
    if (selectedSubcats.length === 0) return true;
    if (Array.isArray(prod.subcategory)) {
      return prod.subcategory.some((sc) => selectedSubcats.includes(sc));
    }
    return selectedSubcats.includes(prod.subcategory);
  });

  // ---------------- 3) TOGGLE SUBCAT CHIPS ----------------
  const handleToggleSubcat = (sub) => {
    setSelectedSubcats((prev) => {
      if (prev.includes(sub)) {
        // remove it
        return prev.filter((x) => x !== sub);
      } else {
        // add it
        return [...prev, sub];
      }
    });
  };

  // ---------------- 4) ADD TO CART HANDLER ----------------
  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  // ---------------- 5) HANDLE OVERLAY CONFIRM ----------------
  const handleOverlayConfirm = async (sizeQuantities) => {
    const uid = firestoreUser?.id;
    if (!uid) {
      toast.error("User not authenticated.");
      return;
    }
    try {
      for (let sq of sizeQuantities) {
        if (sq.quantity > 0) {
          const cartRef = collection(db, "users", uid, "cart");
          const docRef = doc(cartRef);
          await setDoc(docRef, {
            productId: overlayProduct.id,
            productTitle: overlayProduct.title,
            size: sq.size,
            pricePerPiece: sq.pricePerPiece,
            boxPieces: sq.boxPieces,
            quantity: sq.quantity,
            updatedAt: new Date(),
          });
        }
      }
      toast.success("Added items to cart!");
      setOverlayProduct(null);
    } catch (error) {
      console.error("Error saving to cart:", error);
      toast.error("Failed to add items to cart.");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* ============ Top Section ============ */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* LEFT: Category Image */}
        <div style={{ flex: "1 1 300px", maxWidth: "400px" }}>
          <img
            src={category.image || categoryPlaceholder}
            alt={category.name}
            style={{
              width: "100%",
              borderRadius: "100%",
              objectFit: "contain",
              maxHeight: "300px",
            }}
          />
        </div>

        {/* RIGHT: Category Name + Filter Chips */}
        <div style={{ flex: "1 1 300px", minWidth: "280px" }}>
          <h1
            style={{
              fontFamily: "Lora, serif",
              fontWeight: "600",
              fontSize: "36px",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Shop for {category.name || "Category"}
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            Filter by subcategory:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {allSubcatsFromProducts.length === 0 ? (
              <p style={{ color: "#666", textAlign:"center" }}>
                No subcategories found for this category.
              </p>
            ) : (
              allSubcatsFromProducts.map((sub) => {
                const isActive = selectedSubcats.includes(sub);
                return (
                  <div
                    key={sub}
                    onClick={() => handleToggleSubcat(sub)}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${isActive ? "#333" : "#ccc"}`,
                      backgroundColor: isActive ? "#333" : "#fff",
                      color: isActive ? "#fff" : "#333",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      userSelect: "none",
                      transition: "background-color 0.3s, color 0.3s",
                    }}
                  >
                    {sub}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============ Products Grid ============ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(30vw, 1fr))",
          gap: "20px",
        }}
      >
        {filteredProducts.length === 0 ? (
          <p style={{ gridColumn: "1 / -1", color: "#666", textAlign:'center', marginTop:"100px",marginBottom:"100px" }}>
            No products match the selected category/subcategory filters.
          </p>
        ) : (
          filteredProducts.map((prod) => (
            <div
              key={prod.id}
              style={{
                border: "1px solid #fff",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img
                src={prod.coverImage || productPlaceholder}
                alt={prod.title}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />
              <h3
                style={{
                  fontFamily: "Lora, serif",
                  fontWeight: "500",
                  fontSize: "18px",
                  marginBottom: "6px",
                  textTransform: "capitalize",
                }}
              >
                {prod.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "10px",
                }}
              >
                {prod.fabric || ""}
              </p>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                From ₹{prod.sizes?.[0]?.pricePerPiece || 0}
              </p>
              {/* Available Sizes */}
              <div style={{ marginBottom: "10px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "6px",
                  }}
                >
                  Available Sizes:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {prod.sizes.map((sz, j) => (
                    <div
                      key={j}
                      style={{
                        width: "30px",
                        height: "30px",
                        border: `2px solid ${
                          sz.boxesInStock > 0 ? "#333" : "#ccc"
                        }`,
                        backgroundColor:
                          sz.boxesInStock > 0 ? "#fff" : "#f5f5f5",
                        color:
                          sz.boxesInStock > 0 ? "#333" : "#aaa",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor:
                          sz.boxesInStock > 0
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          sz.boxesInStock > 0 ? 1 : 0.6,
                      }}
                    >
                      {sz.size}
                      {sz.boxesInStock === 0 && (
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "2px",
                            backgroundColor: "#aaa",
                            transform: "rotate(-45deg)",
                            top: "50%",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                {/* View More */}
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#fff",
                    color: "#333",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "0px",
                    border: "1px solid #333",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    navigate("/view-product", { state: { productId: prod.id } })
                  }
                >
                  View More
                </button>
                {/* Add to Cart */}
                <button
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "#333",
                    color: "#fff",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "0px",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => handleAddToCartClick(prod)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* The Overlay if user clicks "Add to Cart" */}
      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={() => setOverlayProduct(null)}
          onConfirm={handleOverlayConfirm}
        />
      )}
    </div>
  );
}
