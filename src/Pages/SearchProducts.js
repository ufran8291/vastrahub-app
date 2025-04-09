// src/Pages/SearchProducts.js
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import searchIcon from "../assets/searchIcon.svg";
import { Grid, Box, Menu, MenuItem, Typography } from "@mui/material";
import ProductCard from "../components/ProductCard";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { toast } from "react-toastify";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

export default function SearchProducts() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Sorting
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortOption, setSortOption] = useState("recent");

  // Sort Options
  const sortOptions = [
    { label: "Recent First", value: "recent" },
    { label: "Price: Low to High", value: "priceLow" },
    { label: "Price: High to Low", value: "priceHigh" },
    { label: "Date Added: Oldest First", value: "oldest" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const productsSnap = await getDocs(collection(db, "products"));
        const productsArr = [];
        productsSnap.forEach((doc) => {
          const data = doc.data();
          productsArr.push({
            id: doc.id,
            title: data.title,
            fabric: data.fabric,
            image: data.coverImage || productPlaceholder,
            additionalImages: data.additionalImages || [productPlaceholder],
            price: data.sizes?.[0]?.pricePerPiece || 0,
            sizes: data.sizes || [],
            createdAt: data.createdAt || null,
          });
        });
        setAllProducts(productsArr);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredProducts([]);
      return;
    }
    const lowerSearch = searchText.toLowerCase();
    let results = allProducts.filter((prod) =>
      prod.title.toLowerCase().includes(lowerSearch)
    );

    // Apply sort
    results = sortProducts(results, sortOption);
    setFilteredProducts(results);
  }, [searchText, allProducts, sortOption]);

  const sortProducts = (products, option) => {
    const sorted = [...products];
    switch (option) {
      case "priceLow":
        return sorted.sort((a, b) => a.price - b.price);
      case "priceHigh":
        return sorted.sort((a, b) => b.price - a.price);
      case "oldest":
        return sorted.sort(
          (a, b) =>
            (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );
      case "recent":
      default:
        return sorted.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
    }
  };

  const handleViewProduct = (id) => {
    navigate("/view-product", { state: { productId: id } });
  };

  const handleAddToCart = (product) => {
    setOverlayProduct(product);
  };

  const handleSortClick = (e) => {
    setSortAnchorEl(e.currentTarget);
  };

  const handleSortSelect = (option) => {
    setSortOption(option);
    setSortAnchorEl(null);
  };

  const gridItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", padding: "30px" }}>
      {/* Search Bar */}
      <Fade triggerOnce>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "600px",
            margin: "0 auto 20px",
          }}
        >
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search products by Brand, Category, or Article no..."
            style={{
              flex: 1,
              padding: "10px 15px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
        </div>
      </Fade>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          {!searchText.trim() && (
            <Fade triggerOnce>
              <div style={{ textAlign: "center", marginTop: "100px", marginBottom: "200px" }}>
                <img src={searchIcon} alt="Search Placeholder" style={{ height: "80px", marginBottom: "20px" }} />
                <p style={{ fontSize: "18px", color: "#666" }}>
                  Type in the search box above to find products.
                </p>
              </div>
            </Fade>
          )}

          {searchText.trim() && filteredProducts.length === 0 && (
            <Fade triggerOnce>
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p style={{ fontSize: "18px", color: "#666" }}>
                  No products found for "<strong>{searchText}</strong>"
                </p>
              </div>
            </Fade>
          )}

          {searchText.trim() && filteredProducts.length > 0 && (
            <>
              {/* Sort By dropdown */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <div
                  onClick={handleSortClick}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #ccc",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    backgroundColor: "#f9f9f9",
                    userSelect: "none",
                  }}
                >
                  Sort By: {
                    sortOptions.find((s) => s.value === sortOption)?.label || "Recent First"
                  }
                </div>
                <Menu
                  anchorEl={sortAnchorEl}
                  open={Boolean(sortAnchorEl)}
                  onClose={() => setSortAnchorEl(null)}
                >
                  {sortOptions.map((opt) => (
                    <MenuItem
                      key={opt.value}
                      onClick={() => handleSortSelect(opt.value)}
                    >
                      {opt.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              <Grid container spacing={2} style={{ marginTop: "10px" }}>
                {filteredProducts.map((product, index) => (
                  <Grid item xs={6} md={4} key={product.id}>
                    <motion.div
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={gridItemVariants}
                    >
                      <ProductCard
                        product={product}
                        onView={() => handleViewProduct(product.id)}
                        onAdd={() => handleAddToCart(product)}
                      />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
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
