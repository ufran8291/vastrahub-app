// src/Pages/Homepage.js

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, setDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";

// Assets
import heroImg from "../assets/heroimg.png";
import svg1 from "../assets/iconamoon_delivery-light.svg";
import svg2 from "../assets/si_rupee-duotone.svg";
import svg3 from "../assets/mdi-light_calendar.svg";
import svg4 from "../assets/gala_secure.svg";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import googlePlayImage from "../assets/googleplay.png";
import appStoreImage from "../assets/appstore.png";
import mobileAppImage from "../assets/mobileapp.png";
import tagImage1 from "../assets/tag1.png";
import tagImage2 from "../assets/tag2.png";
import tagImage3 from "../assets/tag3.png";
import tagImage4 from "../assets/tag4.png";

// Components
// import SizeSelectorOverlay from "../Components/SizeSelectorOverlay";
import SizeSelectorOverlay from '../components/SizeSelectorOverlay'

export default function Homepage() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const categoryCarouselRef = useRef(null);
  const productCarouselRef = useRef(null);

  // Overlay product
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Info sections
  const sections = [
    {
      svg: svg1,
      headline: "Direct from Manufacturers",
      description: "Quality garments straight from manufacturers.",
    },
    {
      svg: svg2,
      headline: "Best Price Across India",
      description: "Unbeatable prices nationwide, guaranteed.",
    },
    {
      svg: svg3,
      headline: "Years of Market Experience",
      description: "Expertise you can trust, built over years.",
    },
    {
      svg: svg4,
      headline: "Secure Payments",
      description: "Safe and reliable transactions, every time.",
    },
  ];

  // Fetch categories
  const getCategoryImages = async () => {
    const cats = [];
    try {
      const snap = await getDocs(collection(db, "categories"));
      snap.forEach((docSnap) => {
        console.log(docSnap.data());
        cats.push({
          name: docSnap.data().categoryName || "UNNAMED",
          image: docSnap.data().imageUrl || null,
          subCategories: docSnap.data().subCategories || [],
        });
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
    return cats;
  };

  // Fetch featured products
  const getFeaturedProducts = async () => {
    const prods = [];
    try {
      const tagsSnap = await getDocs(collection(db, "tags"));
      let productIds = [];
      const otherTags = [];

      tagsSnap.forEach((docSnap) => {
        if (docSnap.data().title === "Featured Products") {
          productIds = docSnap.data().products || [];
        }
      });

      for (const productId of productIds) {
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const data = productDoc.data();
          prods.push({
            id: productId,
            title: data.title,
            image: data.coverImage || productPlaceholder,
            price: data.sizes?.[0]?.pricePerPiece || 0,
            sizes: data.sizes || [],
            fabric: data.fabric || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
    return prods;
  };

  useEffect(() => {
    async function fetchData() {
      const [cats, prods] = await Promise.all([
        getCategoryImages(),
        getFeaturedProducts(),
      ]);
      setCategories(cats);
      setFeaturedProducts(prods);
    }
    fetchData();
  }, []);

  // Carousel scroll (if you have buttons for scrolling)
  const scrollCarousel = (ref, direction, amount) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // Add to Cart
  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  // Close overlay
  const closeOverlay = () => {
    setOverlayProduct(null);
  };

  // On overlay confirm => store in Firestore
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

  // Banners
  const tags = [
    { image: tagImage1, alt: "Browse by Category", buttonLabel: "Shop Now", categoryIndex: 0 },
    { image: tagImage2, alt: "Featured Catalogue", buttonLabel: "Shop Now", categoryIndex: 1 },
    { image: tagImage3, alt: "Best Deals", buttonLabel: "Shop Now", categoryIndex: 2 },
    { image: tagImage4, alt: "New Arrivals", buttonLabel: "Shop Now", categoryIndex: 3 },
  ];

  return (
    <>
      {/* Hero Image */}
      <img src={heroImg} alt="Hero" width="100%" />

      {/* Info Sections */}
      <div className="container" style={{ padding: "70px 20px" }}>
        <div className="row">
          {sections.map((section, i) => (
            <div
              className="col-sm-3"
              key={i}
              style={{ textAlign: "center", marginBottom: "30px" }}
            >
              <img
                src={section.svg}
                alt={`Section ${i + 1}`}
                style={{ height: "80px", marginBottom: "20px" }}
              />
              <h2
                style={{
                  fontFamily: "Lora, serif",
                  fontWeight: "600",
                  fontSize: "18px",
                  marginBottom: "10px",
                }}
              >
                {section.headline}
              </h2>
              <p
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: "17px",
                  fontWeight: "400",
                }}
              >
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="container" style={{ padding: "50px 20px" }}>
        <h1
          style={{
            fontFamily: "Lora, serif",
            fontWeight: "600",
            fontSize: "48px",
            textAlign: "left",
            marginBottom: "50px",
          }}
        >
          SHOP BY CATEGORY
        </h1>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <div
            className="row no-scrollbar"
            ref={categoryCarouselRef}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              overflowX: "scroll",
            }}
          >
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 auto",
                  width: "325px",
                  marginRight: "20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  // e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => {
                  console.log("Category clicked:", cat);
                  navigate("/shopbycategory", { state: { category: cat } });
                }}
              >
                <img
                  src={cat.image || categoryPlaceholder}
                  alt={cat.name}
                  style={{
                    width: "325px",
                    height: "365px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
                <h3
                  style={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: "500",
                    fontSize: "32px",
                    textTransform: "uppercase",
                  }}
                >
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container-fluid" style={{ backgroundColor: "#f9f9f9" }}>
        <div className="container" style={{ padding: "50px 20px" }}>
          <h1
            style={{
              fontFamily: "Lora, serif",
              fontWeight: "600",
              fontSize: "48px",
              textAlign: "left",
              marginBottom: "50px",
            }}
          >
            FEATURED PRODUCTS
          </h1>
          <div style={{ position: "relative", overflow: "hidden", paddingLeft: "20px" }}>
            <div
              className="row no-scrollbar"
              ref={productCarouselRef}
              style={{
                display: "flex",
                flexWrap: "nowrap",
                overflowX: "scroll",
              }}
            >
              {featuredProducts.map((prod, i) => (
                <div
                  key={i}
                  style={{
                    flex: "0 0 auto",
                    width: "430px",
                    marginRight: "10px",
                    textAlign: "left",
                    padding: "10px",
                    height: "550px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    paddingBottom: "20px",
                  }}
                >
                  <div>
                    <img
                      src={prod.image}
                      alt={prod.title}
                      style={{
                        width: "100%",
                        height: "250px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "10px",
                      }}
                    />
                    <h3
                      style={{
                        fontFamily: "Lora, serif",
                        fontWeight: "500",
                        fontSize: "20px",
                        marginBottom: "10px",
                      }}
                    >
                      {prod.title}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: "400",
                        }}
                      >
                        {prod.fabric}
                      </p>
                      <p
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: "400",
                        }}
                      >
                        From ₹ {prod.price}
                      </p>
                    </div>
                    <p
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: "16px",
                        fontWeight: "500",
                        marginBottom: "10px",
                      }}
                    >
                      Available Sizes:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {prod.sizes.map((sz, j) => (
                        <div
                          key={j}
                          style={{
                            width: "40px",
                            height: "40px",
                            border: `2px solid ${
                              sz.boxesInStock > 0 ? "#333" : "#ccc"
                            }`,
                            backgroundColor: sz.boxesInStock > 0 ? "#fff" : "#f5f5f5",
                            color: sz.boxesInStock > 0 ? "#333" : "#aaa",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: sz.boxesInStock > 0 ? "pointer" : "not-allowed",
                            opacity: sz.boxesInStock > 0 ? 1 : 0.6,
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

                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    {/* View More */}
                    <button
                      style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#fff",
                        color: "#333",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: "14px",
                        fontWeight: "500",
                        borderRadius: "0px",
                        border: "solid 1px #333",
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
                        padding: "10px",
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banners */}
      <div className="container-fluid" style={{ padding: "50px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto auto",
            gap: "20px",
          }}
        >
          {tags.map((tag, i) => (
            <div
              key={i}
              style={{
                gridColumn: i % 2 === 0 && i < 2 ? "span 2" : "auto",
                position: "relative",
              }}
            >
              <img
                src={tag.image}
                alt={tag.alt}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                }}
              />
              <button
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "10px 20px",
                  backgroundColor: "#fff",
                  border: "1px solid #333",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (categories[tag.categoryIndex]) {
                    navigate("/shopbycategory", { state: { category: categories[tag.categoryIndex] } });
                  } else {
                    toast.error("Category not found.");
                  }
                }}
              >
                {tag.buttonLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Vastrahub App Section */}
      <div
        className="container-fluid"
        style={{ backgroundColor: "#fff", padding: "50px 0" }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-around",
            alignItems: "center",
            color: "#000",
          }}
        >
          <div style={{ maxWidth: "60%" }}>
            <h2
              style={{
                fontFamily: "Lora",
                fontStyle: "normal",
                fontWeight: "600",
                fontSize: "48px",
                lineHeight: "61px",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                marginBottom: "30px",
              }}
            >
              Download the Vastrahub App Today
            </h2>
            <p style={{ fontSize: "18px", fontWeight: "400", marginBottom: "50px" }}>
              Download the VastraHub app to streamline your shopping experience.
              Access exclusive deals, manage orders easily, and connect directly
              with trusted manufacturers anytime, anywhere. Your Gateway to
              effortless, secure, and efficient garment shopping starts here.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-start", gap: "20px" }}>
              <img
                src={googlePlayImage}
                alt="Google Play Store"
                style={{ width: "150px", cursor: "pointer" }}
                onClick={() =>
                  window.open("https://play.google.com/store", "_blank")
                }
              />
              <img
                src={appStoreImage}
                alt="App Store"
                style={{ width: "150px", cursor: "pointer" }}
                onClick={() =>
                  window.open("https://www.apple.com/app-store/", "_blank")
                }
              />
            </div>
          </div>
          <div style={{ maxWidth: "40%" }}>
            <img
              src={mobileAppImage}
              alt="Vastrahub Mobile App"
              style={{ width: "100%", borderRadius: "0px" }}
            />
          </div>
        </div>
      </div>

      {/* The Overlay if user clicks "Add to Cart" */}
      {overlayProduct && (
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={closeOverlay}
          onConfirm={handleOverlayConfirm}
        />
      )}
    </>
  );
}
