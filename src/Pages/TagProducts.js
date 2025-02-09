// src/Pages/TagProducts.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  CircularProgress
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import productPlaceholder from "../assets/prodimgplaceholder.png";

export default function TagProducts() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { tagId } = state || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // First, get the tag document using the tagId as the document id
      const tagDocRef = doc(db, "tags", tagId);
      const tagDocSnap = await getDoc(tagDocRef);
      if (tagDocSnap.exists()) {
        const tagData = tagDocSnap.data();
        // Assume the tag document contains a "products" array with product IDs
        const productIds = tagData.products || [];
        console.log(productIds)
        const fetchedProducts = [];
        // Iterate over each productId to fetch the corresponding product document
        for (const productId of productIds) {
          const productDocRef = doc(db, "products", productId);
          const productDocSnap = await getDoc(productDocRef);
          if (productDocSnap.exists()) {
            const productData = productDocSnap.data();
            fetchedProducts.push({
              id: productId,
              title: productData.title,
              coverImage: productData.coverImage || productPlaceholder,
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

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {/* <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontFamily: "Lora, serif" }}
      >
        Products for Tag: {tagId}
      </Typography> */}
      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "auto" }} />
      ) : products.length === 0 ? (
        <Typography variant="body1" align="center">
          No products found for this tag.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {products.map((prod) => (
            <Grid item xs={12} sm={6} md={4} key={prod.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="250"
                  image={prod.coverImage}
                  alt={prod.title}
                />
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Lora, serif", mb: 1 }}
                  >
                    {prod.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {prod.fabric}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    From ₹ {prod.price}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate("/view-product", { state: { productId: prod.id } })
                    }
                  >
                    View More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
