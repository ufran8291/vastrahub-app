import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";
import { Grid } from "@mui/material";
import ProductCard from "../components/ProductCard";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { GlobalContext } from "../Context/GlobalContext";

export default function ShopByCategory() {
  const navigate = useNavigate();
  const { category } = useLocation().state || {};
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  useEffect(() => {
    if (!category) {
      toast.error("No category selected.");
      navigate("/");
    }
  }, [category, navigate]);

  const [allProducts, setAllProducts] = useState([]);
  const [allSubcatsFromProducts, setAllSubcatsFromProducts] = useState([]);
  const [selectedSubcats, setSelectedSubcats] = useState([]);
  const [overlayProduct, setOverlayProduct] = useState(null);
  const catSubCategories = category?.subCategories || [];

  useEffect(() => {
    if (!category) return;
    async function fetchCategoryProducts() {
      try {
        const productsRef = collection(db, "products");
        const qCat = query(productsRef, where("category", "==", category.name));
        const snapshot = await getDocs(qCat);
        const prodArr = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          prodArr.push({ id: docSnap.id, ...data });
        });
        setAllProducts(prodArr);

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
        catSubCategories.forEach((sc) => subcatSet.add(sc));
        setAllSubcatsFromProducts([...subcatSet]);
      } catch (error) {
        console.error("Error fetching category products:", error);
        toast.error("Unable to load products for this category.");
      }
    }
    fetchCategoryProducts();
  }, [category, catSubCategories]);

  const filteredProducts = allProducts.filter((prod) => {
    if (selectedSubcats.length === 0) return true;
    if (Array.isArray(prod.subcategory)) {
      return prod.subcategory.some((sc) => selectedSubcats.includes(sc));
    }
    return selectedSubcats.includes(prod.subcategory);
  });

  const handleToggleSubcat = (sub) => {
    setSelectedSubcats((prev) => {
      if (prev.includes(sub)) {
        return prev.filter((x) => x !== sub);
      } else {
        return [...prev, sub];
      }
    });
  };

  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
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
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "10px" }}>
            Filter by subcategory:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {allSubcatsFromProducts.length === 0 ? (
              <p style={{ color: "#666", textAlign: "center" }}>
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

      {filteredProducts.length === 0 ? (
        <p
          style={{
            color: "#666",
            textAlign: "center",
            marginTop: "100px",
            marginBottom: "100px",
          }}
        >
          No products match the selected category/subcategory filters.
        </p>
      ) : (
        <Grid container spacing={2}>
          {filteredProducts.map((prod) => (
            <Grid item xs={6} md={4} key={prod.id}>
              <ProductCard
                product={{
                  id: prod.id,
                  title: prod.title,
                  fabric: prod.fabric,
                  image: prod.coverImage || productPlaceholder,
                  price:
                    prod.sizes && prod.sizes.length > 0
                      ? prod.sizes[0].pricePerPiece
                      : 0,
                  sizes: prod.sizes || [],
                }}
                onView={() => navigate("/view-product", { state: { productId: prod.id } })}
                onAdd={() => handleAddToCartClick(prod)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={() => setOverlayProduct(null)}
        />
      )}
    </div>
  );
}
