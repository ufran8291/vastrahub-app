import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import searchIcon from "../assets/searchIcon.svg";
import { Grid } from "@mui/material";
import ProductCard from "../components/ProductCard";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { toast } from "react-toastify";

export default function SearchProducts() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [allProducts, setAllProducts] = useState([]); // store all products from Firestore
  const [filteredProducts, setFilteredProducts] = useState([]); // store search results
  const [loading, setLoading] = useState(true);
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Fetch all products on mount
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
            price:
              data.sizes && data.sizes.length > 0 ? data.sizes[0].pricePerPiece : 0,
            sizes: data.sizes || [],
          });
        });
        setAllProducts(productsArr);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products whenever searchText changes
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredProducts([]);
      return;
    }
    const lowerSearch = searchText.toLowerCase();
    const results = allProducts.filter((prod) =>
      prod.title.toLowerCase().includes(lowerSearch)
    );
    setFilteredProducts(results);
  }, [searchText, allProducts]);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleViewProduct = (id) => {
    navigate("/view-product", { state: { productId: id } });
  };

  // Instead of an alert, open the SizeSelectorOverlay
  const handleAddToCart = (product) => {
    setOverlayProduct(product);
  };

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", padding: "30px" }}>
      {/* Search Bar */}
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
          onChange={handleSearchChange}
          placeholder="Search products by Brand, Category, or Article no..."
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            outline: "none",
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          {/* Placeholder UI */}
          {!searchText.trim() && (
            <div style={{ textAlign: "center", marginTop: "100px", marginBottom: "200px" }}>
              <img
                src={searchIcon}
                alt="Search Placeholder"
                style={{ height: "80px", marginBottom: "20px" }}
              />
              <p style={{ fontSize: "18px", color: "#666" }}>
                Type in the search box above to find products.
              </p>
            </div>
          )}

          {searchText.trim() && filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <p style={{ fontSize: "18px", color: "#666" }}>
                No products found for "<strong>{searchText}</strong>"
              </p>
            </div>
          )}

          {searchText.trim() && filteredProducts.length > 0 && (
            <Grid container spacing={2} style={{ marginTop: "30px" }}>
              {filteredProducts.map((product) => (
                <Grid item xs={6} md={4} key={product.id}>
                  <ProductCard
                    product={product}
                    onView={() => handleViewProduct(product.id)}
                    onAdd={() => handleAddToCart(product)}
                  />
                </Grid>
              ))}
            </Grid>
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
