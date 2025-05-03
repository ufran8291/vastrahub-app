// src/Pages/TagProducts.js
import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import ProductCard from "../components/ProductCard";
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";

export default function TagProducts() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { tagId } = state || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overlayProduct, setOverlayProduct] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!tagId) {
      toast.error("No tag specified.");
      navigate("/");
      return;
    }
    fetchProductsByTag(tagId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  const fetchProductsByTag = async (tagId) => {
    setLoading(true);
    try {
      const tagDocRef = doc(db, "tags", tagId);
      const tagDocSnap = await getDoc(tagDocRef);
      if (tagDocSnap.exists()) {
        const tagData = tagDocSnap.data();
        const productIds = tagData.products || [];
        const fetchedProducts = [];
        for (const productId of productIds) {
          const productDocRef = doc(db, "products", productId);
          const productDocSnap = await getDoc(productDocRef);
          if (productDocSnap.exists()) {
            const productData = productDocSnap.data();
            fetchedProducts.push({
              id: productId,
              title: productData.title,
              image: productData.coverImage || productPlaceholder,
              price: productData.sizes?.[0]?.pricePerPiece || 0,
              sizes: productData.sizes || [],
              fabric: productData.fabric || "",
              discount:productData.discount ||0,
              additionalImages: productData.additionalImages || [productPlaceholder],
            });
          }
        }
        setProducts(fetchedProducts);
      } else {
        toast.error("Tag not found.");
      }
    } catch (error) {
      console.error("Error fetching products by tag:", error);
      toast.error("Failed to fetch products for this tag.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (id) => {
       window.open(
         `/view-product?productId=${id}`,
         "_blank",
         "noopener,noreferrer"
       );
     };

  const handleAddToCart = (product) => {
    setOverlayProduct(product);
  };

  return (
    <div style={{
      padding: isMobile ? "0 16px" : "0 40px",
      marginTop: "32px",
      marginBottom: "32px",
      fontFamily: "Plus Jakarta Sans, sans-serif"
    }}>
      {loading ? (
        <CircularProgress style={{ display: "block", margin: "auto" }} />
      ) : products.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          No products found for this tag.
        </Typography>
      ) : (
        <Grid container spacing={2} style={{ marginTop: "30px" }}>
          {products.map((prod) => (
            <Grid item xs={12} sm={6} md={4} key={prod.id}>
              <ProductCard
                product={prod}
                onView={() => handleViewProduct(prod.id)}
                onAdd={() => handleAddToCart(prod)}
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
