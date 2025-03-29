// src/Pages/ShopByCategory.js
import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";
import { Grid, Box, Typography, Menu, MenuItem } from "@mui/material"; // <-- Added Menu & MenuItem
import ProductCard from "../components/ProductCard";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { GlobalContext } from "../Context/GlobalContext";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

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

  // New state for Price Range filter - storing the full option object
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [priceAnchorEl, setPriceAnchorEl] = useState(null); // Anchor for MUI Menu

  const catSubCategories = category?.subCategories || [];

  // Define available price ranges.
  const priceRanges = [
    { label: "Clear Filter", value: null }, // Option to clear the price filter
    { label: "Less than 200", value: { min: 0, max: 200 } },
    { label: "200 - 300", value: { min: 200, max: 300 } },
    { label: "300 - 400", value: { min: 300, max: 400 } },
    { label: "400 - 500", value: { min: 400, max: 500 } },
    { label: "500 - 600", value: { min: 500, max: 600 } },
    { label: "600 - 700", value: { min: 600, max: 700 } },
    { label: "700 - 800", value: { min: 700, max: 800 } },
    { label: "800 - 900", value: { min: 800, max: 900 } },
    { label: "900 - 1000", value: { min: 900, max: 1000 } },
    { label: "Greater than 1000", value: { min: 1000, max: Infinity } },
  ];

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
        // Include any default subcategories from the category
        catSubCategories.forEach((sc) => subcatSet.add(sc));
        setAllSubcatsFromProducts([...subcatSet]);
      } catch (error) {
        console.error("Error fetching category products:", error);
        toast.error("Unable to load products for this category.");
      }
    }
    fetchCategoryProducts();
  }, [category, catSubCategories]);

  // Update filteredProducts to include price filtering
  const filteredProducts = allProducts.filter((prod) => {
    // Subcategory filtering
    const passesSubcat =
      selectedSubcats.length === 0 ||
      (Array.isArray(prod.subcategory)
        ? prod.subcategory.some((sc) => selectedSubcats.includes(sc))
        : selectedSubcats.includes(prod.subcategory));

    // Price filtering: if a price range is selected, use its value for filtering
    let passesPrice = true;
    if (selectedPriceRange && selectedPriceRange.value) {
      const productPrice =
        prod.sizes && prod.sizes.length > 0 ? prod.sizes[0].pricePerPiece : 0;
      passesPrice =
        productPrice >= selectedPriceRange.value.min &&
        productPrice < selectedPriceRange.value.max;
    }
    return passesSubcat && passesPrice;
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

  // Motion variants for filter chips (subcategory & price)
  const subcatVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Fade triggerOnce>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "20px", mb: 4 }}>
          <Box sx={{ flex: "1 1 300px", maxWidth: "400px" }}>
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
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Lora, serif",
                fontWeight: 600,
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              Shop for {category.name || "Category"}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "16px", color: "#666", mb: 1 }}>
              Filter by subcategory:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {/* Existing subcategory chips */}
              {allSubcatsFromProducts.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#666", textAlign: "center" }}>
                  No subcategories found for this category.
                </Typography>
              ) : (
                allSubcatsFromProducts.map((sub) => {
                  const isActive = selectedSubcats.includes(sub);
                  return (
                    <motion.div
                      key={sub}
                      variants={subcatVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => handleToggleSubcat(sub)}
                      style={{
                        padding: "8px 16px",
                        border: `1px solid ${isActive ? "#333" : "#ccc"}`,
                        backgroundColor: isActive ? "#333" : "#fff",
                        color: isActive ? "#fff" : "#333",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500,
                        userSelect: "none",
                        transition: "background-color 0.3s, color 0.3s",
                      }}
                    >
                      {sub}
                    </motion.div>
                  );
                })
              )}
              {/* New Price Range filter chip */}
              <motion.div
                variants={subcatVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={(e) => setPriceAnchorEl(e.currentTarget)}
                style={{
                  padding: "8px 16px",
                  border: `1px solid ${selectedPriceRange ? "#333" : "#ccc"}`,
                  backgroundColor: selectedPriceRange ? "#333" : "#fff",
                  color: selectedPriceRange ? "#fff" : "#333",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  userSelect: "none",
                  transition: "background-color 0.3s, color 0.3s",
                }}
              >
                {/* Display the selected range label if set, otherwise default title */}
                {selectedPriceRange ? selectedPriceRange.label : "Price Range"}
              </motion.div>
              {/* Price Range dropdown */}
              <Menu
                anchorEl={priceAnchorEl}
                open={Boolean(priceAnchorEl)}
                onClose={() => setPriceAnchorEl(null)}
              >
                {priceRanges.map((range) => (
                  <MenuItem
                    key={range.label}
                    onClick={() => {
                      // If "Clear Filter" is selected, clear the state
                      if (range.value === null) {
                        setSelectedPriceRange(null);
                      } else {
                        setSelectedPriceRange(range);
                      }
                      setPriceAnchorEl(null);
                    }}
                  >
                    {range.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>
        </Box>
      </Fade>

      {filteredProducts.length === 0 ? (
        <Typography
          variant="body1"
          sx={{
            color: "#666",
            textAlign: "center",
            my: 8,
          }}
        >
          No products match the selected category/subcategory filters.
        </Typography>
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
                  additionalImages: prod.additionalImages || [productPlaceholder],
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
