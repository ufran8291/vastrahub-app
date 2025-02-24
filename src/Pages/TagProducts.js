import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, CircularProgress } from "@mui/material";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
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
    navigate("/view-product", { state: { productId: id } });
  };

  const handleAddToCart = (product) => {
    setOverlayProduct(product);
  };

  return (
    <div container sx={{ mt: 4, mb: 4,  fontFamily: "Plus Jakarta Sans, sans-serif", }}>
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto" }} />
      ) : products.length === 0 ? (
        <Typography variant="body1" align="center">
          No products found for this tag.
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ marginTop: "30px" }}>
          {products.map((prod) => (
            <Grid  item xs={6} md={4} key={prod.id}>
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
