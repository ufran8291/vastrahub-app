// src/Pages/ShopByCategory.js
import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";
import {
  Grid,
  Box,
  Typography,
  Menu,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import ProductCard from "../components/ProductCard";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { GlobalContext } from "../Context/GlobalContext";
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
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [priceAnchorEl, setPriceAnchorEl] = useState(null);
  const [sortOption, setSortOption] = useState("recent");

  const catSubCategories = category?.subCategories || [];

  const priceRanges = [
    { label: "Clear Filter", value: null },
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
        catSubCategories.forEach((sc) => subcatSet.add(sc));
        setAllSubcatsFromProducts([...subcatSet]);
      } catch (error) {
        console.error("Error fetching category products:", error);
        toast.error("Unable to load products for this category.");
      }
    }
    fetchCategoryProducts();
  }, [category, catSubCategories]);

  let filteredProducts = allProducts.filter((prod) => {
    const passesSubcat =
      selectedSubcats.length === 0 ||
      (Array.isArray(prod.subcategory)
        ? prod.subcategory.some((sc) => selectedSubcats.includes(sc))
        : selectedSubcats.includes(prod.subcategory));

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

  filteredProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a?.sizes?.[0]?.pricePerPiece || 0;
    const priceB = b?.sizes?.[0]?.pricePerPiece || 0;
    const timeA = a?.createdAt?.toDate?.() || new Date(0);
    const timeB = b?.createdAt?.toDate?.() || new Date(0);

    switch (sortOption) {
      case "priceLowToHigh":
        return priceA - priceB;
      case "priceHighToLow":
        return priceB - priceA;
      case "oldest":
        return timeA - timeB;
      case "recent":
      default:
        return timeB - timeA;
    }
  });

  const handleToggleSubcat = (sub) => {
    setSelectedSubcats((prev) =>
      prev.includes(sub) ? prev.filter((x) => x !== sub) : [...prev, sub]
    );
  };

  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  const subcatVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div
      style={{ padding: "30px", fontFamily: "Plus Jakarta Sans, sans-serif" }}
    >
      <Fade triggerOnce>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "20px",
            mb: 4,
          }}
        >
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
            <Typography
              variant="body1"
              sx={{ fontSize: "16px", color: "#666", mb: 1 }}
            >
              Filter by subcategory:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {allSubcatsFromProducts.map((sub) => {
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
              })}
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
                {selectedPriceRange ? selectedPriceRange.label : "Price Range"}
              </motion.div>
              <Menu
                anchorEl={priceAnchorEl}
                open={Boolean(priceAnchorEl)}
                onClose={() => setPriceAnchorEl(null)}
              >
                {priceRanges.map((range) => (
                  <MenuItem
                    key={range.label}
                    onClick={() => {
                      setSelectedPriceRange(
                        range.value === null ? null : range
                      );
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

      {/* Sort By Picker */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="sort-label">Sort By</InputLabel>
          <Select
            labelId="sort-label"
            value={sortOption}
            label="Sort By"
            onChange={(e) => setSortOption(e.target.value)}
          >
            <MenuItem value="recent">Recent First</MenuItem>
            <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
            <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
            <MenuItem value="oldest">Date Added: Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {filteredProducts.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ color: "#666", textAlign: "center", my: 8 }}
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
                  additionalImages: prod.additionalImages || [
                    productPlaceholder,
                  ],
                  price: prod.sizes?.[0]?.pricePerPiece || 0,
                  sizes: prod.sizes || [],
                }}
                onView={() =>
                  navigate("/view-product", { state: { productId: prod.id } })
                }
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
