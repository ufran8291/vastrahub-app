// src/Pages/ShopByCategory.js
import React, { useState, useEffect, useContext } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
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
  const location = useLocation();
  const originalCategory = location.state?.category;
  const [category, setCategory] = useState(originalCategory || null);

  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  const [searchParams, setSearchParams] = useSearchParams();

  // Master price ranges
  const priceRangesMaster = [
    { label: "Clear Filter",      value: null },
    { label: "Less than 200",     value: { min: 0,    max: 200 } },
    { label: "200 - 300",         value: { min: 200,  max: 300 } },
    { label: "300 - 400",         value: { min: 300,  max: 400 } },
    { label: "400 - 500",         value: { min: 400,  max: 500 } },
    { label: "500 - 600",         value: { min: 500,  max: 600 } },
    { label: "600 - 700",         value: { min: 600,  max: 700 } },
    { label: "700 - 800",         value: { min: 700,  max: 800 } },
    { label: "800 - 900",         value: { min: 800,  max: 900 } },
    { label: "900 - 1000",        value: { min: 900,  max: 1000 } },
    { label: "Greater than 1000", value: { min: 1000, max: Infinity } },
  ];

  // Component state
  const [allProducts, setAllProducts] = useState([]);
  const [allSubcatsFromProducts, setAllSubcatsFromProducts] = useState([]);
  const [selectedSubcats, setSelectedSubcats] = useState([]);
  const [overlayProduct, setOverlayProduct] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [availablePriceRanges, setAvailablePriceRanges] =
    useState(priceRangesMaster);
  const [priceAnchorEl, setPriceAnchorEl] = useState(null);
  const [sortOption, setSortOption] = useState("recent");

  // 1️⃣ Persist incoming category to sessionStorage
  useEffect(() => {
    if (originalCategory) {
      sessionStorage.setItem(
        "shopCategory",
        JSON.stringify(originalCategory)
      );
      setCategory(originalCategory);
    }
  }, [originalCategory]);

  // 2️⃣ On mount, if no location.state, load category from sessionStorage or redirect
  useEffect(() => {
    if (!originalCategory) {
      const stored = sessionStorage.getItem("shopCategory");
      if (stored) {
        setCategory(JSON.parse(stored));
      } else {
        toast.error("No category selected.");
        navigate("/", { replace: true });
      }
    }
  }, [originalCategory, navigate]);

  // 3️⃣ Initialize filters & sort from URL once
  useEffect(() => {
    const subsParam = searchParams.get("subcats");
    if (subsParam) setSelectedSubcats(subsParam.split(","));

    const pl = searchParams.get("priceLabel");
    if (pl) {
      const match = priceRangesMaster.find((r) => r.label === pl);
      if (match) setSelectedPriceRange(match.value === null ? null : match);
    }

    const so = searchParams.get("sort");
    if (so) setSortOption(so);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4️⃣ Fetch products & derive subcats + price ranges
  useEffect(() => {
    if (!category) return;

    (async () => {
      try {
        const qCat = query(
          collection(db, "products"),
          where("category", "==", category.name)
        );
        const snap = await getDocs(qCat);
        const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllProducts(products);

        const declared = category.subCategories || [];
        const seen = new Set();
        products.forEach((p) => {
          if (!p.subcategory) return;
          Array.isArray(p.subcategory)
            ? p.subcategory.forEach((s) => seen.add(s))
            : seen.add(p.subcategory);
        });

        const missing = declared.filter((s) => !seen.has(s));
        const extras = await Promise.all(
          missing.map(async (sub) => {
            const cnt = await getCountFromServer(
              query(
                collection(db, "products"),
                where("category", "==", category.name),
                where("subcategory", "==", sub)
              )
            );
            return cnt.data().count > 0 ? sub : null;
          })
        );
        setAllSubcatsFromProducts([...seen, ...extras.filter(Boolean)].sort());

        const valid = priceRangesMaster.filter((range) => {
          if (range.value === null) return true;
          return products.some((p) => {
            const price = p.sizes?.[0]?.pricePerPiece || 0;
            return price >= range.value.min && price < range.value.max;
          });
        });
        setAvailablePriceRanges(valid);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load products for this category.");
      }
    })();
  }, [category, priceRangesMaster]);

  // 5️⃣ Keep price selection valid
  useEffect(() => {
    if (
      selectedPriceRange &&
      !availablePriceRanges.some((r) => r.label === selectedPriceRange.label)
    ) {
      setSelectedPriceRange(null);
    }
  }, [availablePriceRanges, selectedPriceRange]);

  // 6️⃣ Sync filters & sort back into URL
  useEffect(() => {
    const params = {};
    if (selectedSubcats.length) params.subcats = selectedSubcats.join(",");
    if (selectedPriceRange) params.priceLabel = selectedPriceRange.label;
    if (sortOption && sortOption !== "recent") params.sort = sortOption;
    setSearchParams(params, { replace: true });
  }, [selectedSubcats, selectedPriceRange, sortOption, setSearchParams]);

  // Don’t render UI until we have a category
  if (!category) return null;

  // Filter + sort products
  const filteredProducts = [...allProducts]
    .filter((prod) => {
      const passSub =
        selectedSubcats.length === 0 ||
        (Array.isArray(prod.subcategory)
          ? prod.subcategory.some((s) => selectedSubcats.includes(s))
          : selectedSubcats.includes(prod.subcategory));

      let passPrice = true;
      if (selectedPriceRange && selectedPriceRange.value) {
        const price = prod.sizes?.[0]?.pricePerPiece || 0;
        passPrice =
          price >= selectedPriceRange.value.min &&
          price < selectedPriceRange.value.max;
      }
      return passSub && passPrice;
    })
    .sort((a, b) => {
      const priceA = a.sizes?.[0]?.pricePerPiece || 0;
      const priceB = b.sizes?.[0]?.pricePerPiece || 0;
      const dateA = a.addedOn?.toDate?.() || new Date(0);
      const dateB = b.addedOn?.toDate?.() || new Date(0);

      switch (sortOption) {
        case "priceLowToHigh":
          return priceA - priceB;
        case "priceHighToLow":
          return priceB - priceA;
        case "oldest":
          return dateA - dateB;
        case "recent":
        default:
          return dateB - dateA;
      }
    });

  const toggleSubcat = (sub) =>
    setSelectedSubcats((prev) =>
      prev.includes(sub) ? prev.filter((x) => x !== sub) : [...prev, sub]
    );

  const handleAddToCart = (prod) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(prod);
  };

  const subcatVariants = { hover: { scale: 1.05 }, tap: { scale: 0.95 } };

  return (
    <div style={{ padding: 30, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Fade triggerOnce>
        {/* HEADER: image + filters */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 3,
            mb: 4,
          }}
        >
          {/* Category image */}
          <Box sx={{ flex: "1 1 300px", maxWidth: 400 }}>
            <img
              src={category.image || categoryPlaceholder}
              alt={category.name}
              style={{
                width: "100%",
                borderRadius: "100%",
                objectFit: "contain",
                maxHeight: 300,
              }}
            />
          </Box>

          {/* Filter chips */}
          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Lora, serif",
                fontWeight: 600,
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              Shop for {category.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{ fontSize: 16, color: "#666", mb: 1 }}
            >
              Filter by subcategory:
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {allSubcatsFromProducts.map((sub) => {
                const active = selectedSubcats.includes(sub);
                return (
                  <motion.div
                    key={sub}
                    variants={subcatVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => toggleSubcat(sub)}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${active ? "#333" : "#ccc"}`,
                      backgroundColor: active ? "#333" : "#fff",
                      color: active ? "#fff" : "#333",
                      borderRadius: 20,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                      userSelect: "none",
                    }}
                  >
                    {sub}
                  </motion.div>
                );
              })}

              {/* PRICE-RANGE chip */}
              <motion.div
                variants={subcatVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={(e) => setPriceAnchorEl(e.currentTarget)}
                style={{
                  padding: "8px 16px",
                  border: `1px solid ${
                    selectedPriceRange ? "#333" : "#ccc"
                  }`,
                  backgroundColor: selectedPriceRange ? "#333" : "#fff",
                  color: selectedPriceRange ? "#fff" : "#333",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  userSelect: "none",
                }}
              >
                {selectedPriceRange
                  ? selectedPriceRange.label
                  : "Price Range"}
              </motion.div>

              {/* PRICE-RANGE menu */}
              <Menu
                anchorEl={priceAnchorEl}
                open={Boolean(priceAnchorEl)}
                onClose={() => setPriceAnchorEl(null)}
              >
                {availablePriceRanges.map((range) => (
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

      {/* SORT picker */}
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

      {/* PRODUCTS grid */}
      {filteredProducts.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ color: "#666", textAlign: "center", my: 8 }}
        >
          No products match the selected filters.
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
                  additionalImages:
                    prod.additionalImages || [productPlaceholder],
                  price: prod.sizes?.[0]?.pricePerPiece || 0,
                  sizes: prod.sizes || [],
                }}
                onView={() =>
                  navigate("/view-product", {
                    state: { productId: prod.id },
                  })
                }
                onAdd={() => handleAddToCart(prod)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* SIZE selector overlay */}
      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={() => setOverlayProduct(null)}
        />
      )}
    </div>
  );
}
