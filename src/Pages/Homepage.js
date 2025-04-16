// src/Pages/Homepage.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";

// Assets
import defaultHeroImg from "../assets/heroimg.png";
import svg1 from "../assets/iconamoon_delivery-light.svg";
import svg2 from "../assets/si_rupee-duotone.svg";
import svg3 from "../assets/mdi-light_calendar.svg";
import svg4 from "../assets/gala_secure.svg";
import svg5 from "../assets/secpayment.svg";
import svg6 from "../assets/factory.svg";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import googlePlayImage from "../assets/googleplay.png";
import appStoreImage from "../assets/appstore.png";
import mobileAppImage from "../assets/mobilepp.png";
import vasLogo from "../assets/newvaslogo.jpeg";
import { MdFactory, MdSecurity } from "react-icons/md"; // Material-style icons

// Components
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import {
  Button,
  // CircularProgress,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { TbSpeakerphone } from "react-icons/tb";
import { ReactTyped } from "react-typed";
import ProductCard from "../components/ProductCard";
import Squares from "../Bits/Squares";
import ScrollFloat from "../Bits/ScrollFloat";
import ScrollVelocity from "../Bits/ScrollVelocity";
import RotatingText from "../Bits/RotatingText";
import { color } from "framer-motion";
// Import ScrollFloat component
// import ScrollFloat from "../components/ScrollFloat";

// Helper function to get tag document id by title
const getTagIdByTitle = async (title) => {
  try {
    const q = query(collection(db, "tags"), where("title", "==", title));
    const snapshot = await getDocs(q);
    let tagId = null;
    snapshot.forEach((doc) => {
      tagId = doc.id;
    });
    return tagId;
  } catch (error) {
    console.error("Error fetching tag id for", title, error);
    return null;
  }
};

// Local Component: CategoryCard with image hover overlay effect
function CategoryCard({ category, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        width: "325px",
        marginRight: "20px",
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={category.image || categoryPlaceholder}
          alt={category.name}
          style={{
            width: "300px",
            height: "365px",
            objectFit: "contain",
            transition: "transform 0.3s",
            transform: hover ? "scale(1.05)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: hover ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "1.5rem",
              opacity: hover ? 1 : 0,
              transition: "opacity 0.3s",
              fontFamily: "Lora, serif",
            }}
          >
            SHOP NOW →
          </span>
        </div>
      </div>
      <h3
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: "500",
          fontSize: "32px",
          textTransform: "uppercase",
          marginTop: "10px",
        }}
      >
        {category.name}
      </h3>
    </div>
  );
}

// Local Component: CategoryCard2 with image hover overlay effect
function CategoryCard2({ category, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={category.image || categoryPlaceholder}
          alt={category.name}
          style={{
            width: "100%", // Ensures image fills its grid cell
            height: "auto",
            objectFit: "cover",
            transition: "transform 0.3s",
            transform: hover ? "scale(1.05)" : "scale(1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: hover ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "1.5rem",
              opacity: hover ? 1 : 0,
              transition: "opacity 0.3s",
              fontFamily: "Lora, serif",
            }}
          >
            SHOP NOW →
          </span>
        </div>
      </div>
      <h3
        style={{
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: "500",
          fontSize: "1.75rem", // Use rem so it scales
          textTransform: "uppercase",
          marginTop: "10px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        {category.name}
      </h3>
    </div>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser, checkSessionTokenConsistency } =
    useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  // Loader state
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(true);

  // Fade-out logic states
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Local state variables
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredProducts2, setFeaturedProducts2] = useState([]);
  const [heroBanner, setHeroBanner] = useState(null);
  const [heroBannerTag, setHeroBannerTag] = useState(null);
  const [banners, setBanners] = useState([]);
  const [featuredTagId, setFeaturedTagId] = useState(null);
  const [featuredTagId2, setFeaturedTagId2] = useState(null);
  const [bannerHover, setBannerHover] = useState([]);
  const [announcementText, setAnnouncementText] = useState("");

  const categoryCarouselRef = useRef(null);
  const productCarouselRef = useRef(null);

  // Overlay product (for SizeSelectorOverlay)
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Info sections for the top area
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
      svg: svg5,
      headline: "Secure Payments",
      description: "Safe and reliable transactions, every time.",
    },
    {
      svg: svg6,
      headline: "VastraHub Factory",
      description:
        "In-house crafted VastraHub products deliver Best quality & rates..",
    },
    {
      svg: svg4,
      headline: "Trusted Brands",
      description:
        "Wellknown Indian retail brands for more quality reliability",
    },
  ];

  // ------------------ useEffects ------------------
  useEffect(() => {
    checkSessionTokenConsistency();

    // Once data finishes loading, fade out loader
    // (We'll also stop typing if used that logic.)
    if (!loading && !isTyping) {
      setFadeOut(true);
      setTimeout(() => setShowLoader(false), 500); // remove from DOM after fade
    }
  }, [loading, isTyping, checkSessionTokenConsistency]);

  // Fetch Tag IDs for "Featured Products" & "Featured Products 2"
  useEffect(() => {
    const fetchTagIds = async () => {
      const tagId1 = await getTagIdByTitle("Featured Products");
      const tagId2 = await getTagIdByTitle("Featured Products 2");
      setFeaturedTagId(tagId1);
      setFeaturedTagId2(tagId2);
    };
    fetchTagIds();
  }, []);

  // Initial Data Fetch (hero banner, banners, announcement)
  useEffect(() => {
    Promise.all([
      fetchHeroBanner(),
      fetchBannerImages(),
      fetchAnnouncement(),
    ]).catch((error) => console.error("Error in banners:", error));

    async function fetchData() {
      const [cats, prods, prods2] = await Promise.all([
        getCategoryImages(),
        getFeaturedProducts(),
        getFeaturedProducts2(),
      ]);
      setCategories(cats);
      setFeaturedProducts(prods);
      setFeaturedProducts2(prods2);

      // Mark loader as done:
      setLoading(false);
      // If you also want to skip typing or end it right away, you can:
      setIsTyping(false);
    }
    fetchData();
  }, []);

  // ------------------ Banners & Announcement Fetch ------------------
  const fetchHeroBanner = async () => {
    try {
      const heroDocRef = doc(db, "banners", "hero-banner");
      const heroDocSnap = await getDoc(heroDocRef);
      if (heroDocSnap.exists()) {
        const data = heroDocSnap.data();
        if (data.imageLink) {
          setHeroBanner(data.imageLink);
        } else {
          console.log(
            "No imageLink found in hero-banner document. Using default hero image."
          );
        }
        if (data.hasTag === true && data.tagId) {
          setHeroBannerTag(data.tagId);
        }
      } else {
        console.log(
          "Hero banner document does not exist. Using default hero image."
        );
      }
    } catch (error) {
      console.error("Error fetching hero banner:", error);
    }
  };

  const fetchBannerImages = async () => {
    try {
      const bannerIds = ["banner-1", "banner-2", "banner-3", "banner-4"];
      const fetchedBanners = await Promise.all(
        bannerIds.map(async (id) => {
          const bannerDocRef = doc(db, "banners", id);
          const bannerDocSnap = await getDoc(bannerDocRef);
          if (bannerDocSnap.exists()) {
            const data = bannerDocSnap.data();
            return {
              id,
              imageLink: data.imageLink,
              link: data.link || null,
              tagId: data.tagId || null,
            };
          } else {
            console.log(`Banner document ${id} does not exist.`);
            return null;
          }
        })
      );
      const validBanners = fetchedBanners.filter((banner) => banner !== null);
      setBanners(validBanners);
      setBannerHover(new Array(validBanners.length).fill(false));
    } catch (error) {
      console.error("Error fetching banner images:", error);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const announcementDocRef = doc(db, "banners", "announcement");
      const announcementDocSnap = await getDoc(announcementDocRef);
      if (announcementDocSnap.exists()) {
        const data = announcementDocSnap.data();
        setAnnouncementText(data.announcementText || "");
      } else {
        setAnnouncementText("");
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };

  // ------------------ Categories & Featured Products ------------------
  const getCategoryImages = async () => {
    const cats = [];
    try {
      const snap = await getDocs(collection(db, "categories"));
      snap.forEach((docSnap) => {
        cats.push({
          name: docSnap.data().categoryName || "UNNAMED",
          image: docSnap.data().imageUrl || null,
          subCategories: docSnap.data().subCategories || [],
          order: docSnap.data().order || 0,
        });
      });
      // Sort categories by the order field (lowest value first)
      cats.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
    return cats;
  };

  const getFeaturedProducts = async () => {
    const prods = [];
    try {
      const tagsSnap = await getDocs(collection(db, "tags"));
      let productIds = [];
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
            additionalImages: data.additionalImages || [productPlaceholder],
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

  const getFeaturedProducts2 = async () => {
    const prods = [];
    try {
      const tagsSnap = await getDocs(collection(db, "tags"));
      let productIds = [];
      tagsSnap.forEach((docSnap) => {
        if (docSnap.data().title === "Featured Products 2") {
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
            additionalImages: data.additionalImages || [productPlaceholder],
            price: data.sizes?.[0]?.pricePerPiece || 0,
            sizes: data.sizes || [],
            fabric: data.fabric || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching featured products 2:", error);
    }
    return prods;
  };

  // ------------------ Carousel Scroll (optional) ------------------
  const scrollCarousel = (ref, direction, amount) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // ------------------ Add to Cart ------------------
  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  // ------------------ Close Overlay ------------------
  const closeOverlay = () => {
    setOverlayProduct(null);
  };

  // ------------------ RENDER ------------------
  return (
    <>
      {/* LOADER with fade-out */}
      {showLoader && (
        <div
          style={{
            ...loaderStyles.container,
            transition: "opacity 0.5s ease-in-out",
            opacity: fadeOut ? 0 : 1,
          }}
        >
          <img
            src={vasLogo}
            height={200}
            alt="VastraHub Logo"
            style={loaderStyles.logo}
          />
          <div style={{ width: "50%", margin: "0", marginBottom: "75px" }}>
            <LinearProgress color="inherit" />
          </div>
        </div>
      )}

      {/* MAIN PAGE CONTENT */}
      {/* Hero Banner with Rotating Text and SHOP NOW Button */}
      <div style={{ position: "relative" }}>
        <img
          src={heroBanner ? heroBanner : defaultHeroImg}
          alt="Hero"
          width="100%"
          onError={(e) => {
            console.log(
              "Hero banner image not available, falling back to default."
            );
            e.target.src = defaultHeroImg;
          }}
        />
        {/* Centered Text Overlay Container */}
        <div
          style={{
            position: "absolute",
            bottom: "210px",
            left: "8vw", // adjust vertical position as needed
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: "10px",
          }}
        >
          {/* Fixed Text */}
          <div>
            <div>
              <span
                style={{
                  fontFamily: "Lora, serif",
                  fontSize: "58px",
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                VASTRAHUB :
              </span>
            </div>
            {/* Rotating Text */}
            <div>
              <RotatingText
                texts={[
                  "VYAPAR KA NAYA TAREEKA",
                  "ONLINE B2B GARMENT STORE",
                  "MANUFACTURER & DISTRIBUTOR",
                ]}
                rotationInterval={5000}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                staggerDuration={0.05}
                splitBy="characters"
                mainClassName="rotating-text"
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: "38px",
                  fontWeight: "600",
                  color: "#c5c5fc",
                }}
              />
            </div>
          </div>
        </div>
        {heroBannerTag ? (
          <Button
            variant="contained"
            onClick={() =>
              navigate("/tag-products", { state: { tagId: heroBannerTag } })
            }
            sx={{
              position: "absolute",
              bottom: "100px",
              left: "8vw",
              backgroundColor: "#000",
              color: "#fff",
              textTransform: "none",
              fontSize: "1.2rem",
              paddingLeft: "30px",
              paddingRight: "30px",
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            SHOP NOW
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => navigate("/about-us")}
            sx={{
              position: "absolute",
              bottom: "100px",
              left: "8vw",
              backgroundColor: "#000",
              color: "#fff",
              textTransform: "none",
              fontSize: "1.2rem",
              paddingLeft: "30px",
              paddingRight: "30px",
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            ABOUT US
          </Button>
        )}
      </div>

      {/* Announcement Section */}
      {announcementText && (
        <div
          style={{
            backgroundColor: "#000",
            padding: "10px 20px",
            margin: "0px",
          }}
        >
          <marquee
            behavior="alternate"
            direction="left"
            style={{
              color: "#fff",
              fontFamily: "Lora, serif",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <TbSpeakerphone size={25} style={{ marginRight: "10px" }} />
            {announcementText}
          </marquee>
        </div>
      )}

      {/* Info Sections */}
      <div className="container" style={{ padding: "70px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {sections.map((section, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                minWidth: 0,
              }}
            >
              <img
                src={section.svg}
                alt={`Section ${i + 1}`}
                style={{
                  height: "clamp(40px, 10vw, 80px)",
                  marginBottom: "20px",
                }}
              />

              <h2
                style={{
                  fontFamily: "Lora, serif",
                  fontWeight: "600",
                  fontSize: "clamp(14px, 2.5vw, 18px)",
                  marginBottom: "10px",
                }}
              >
                {section.headline}
              </h2>
              <p
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontSize: "clamp(12px, 2vw, 17px)",
                  fontWeight: "400",
                }}
              >
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="full-width-dark-container">
        <div className="container category-content">
          <ScrollFloat
            containerClassName=""
            textClassName="responsive-title"
            styles={{ marginBottom: "50px", textAlign: "left" }}
          >
            SHOP BY CATEGORY
          </ScrollFloat>
          <div className="category-grid">
            {categories.map((cat, i) => (
              <CategoryCard2
                key={i}
                category={cat}
                onClick={() =>
                  navigate("/shopbycategory", { state: { category: cat } })
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products Section 1 */}
      <div className="container-fluid" style={{ backgroundColor: "#f9f9f9" }}>
        <div className="container" style={{ padding: "50px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "50px",
            }}
          >
            <ScrollFloat
              containerClassName=""
              textClassName=""
              styles={{
                fontFamily: "Lora, serif",
                fontWeight: "600",
                fontSize: "48px",
              }}
            >
              FEATURED PRODUCTS
            </ScrollFloat>
            {featuredTagId && (
              <Button
                variant="text"
                onClick={() =>
                  navigate("/tag-products", { state: { tagId: featuredTagId } })
                }
                sx={{
                  textTransform: "none",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#333",
                  textDecoration: "underline",
                  fontSize: "15px",
                }}
              >
                View All
              </Button>
            )}
          </div>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              paddingLeft: "20px",
            }}
          >
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
                <ProductCard
                  key={i}
                  product={prod}
                  onView={() =>
                    navigate("/view-product", { state: { productId: prod.id } })
                  }
                  onAdd={() => handleAddToCartClick(prod)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banners Section */}
      <div className="container-fluid" style={{ padding: "50px 20px" }}>
        <div className="banner-grid">
          {banners.map((banner, i) => (
            <div
              key={i}
              className={`banner banner${i + 1}`}
              onClick={() => {
                if (banner.tagId) {
                  navigate("/tag-products", { state: { tagId: banner.tagId } });
                } else if (banner.link) {
                  window.open(banner.link, "_blank");
                } else {
                  toast.info("Banner clicked!");
                }
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                setBannerHover((prev) => {
                  const updated = [...prev];
                  updated[i] = true;
                  return updated;
                });
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                setBannerHover((prev) => {
                  const updated = [...prev];
                  updated[i] = false;
                  return updated;
                });
              }}
            >
              <img
                src={banner.imageLink}
                alt={`Banner ${i + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: bannerHover[i]
                    ? "rgba(0,0,0,0.6)"
                    : "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 0.3s",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontSize: "1.5rem",
                    opacity: bannerHover[i] ? 1 : 0,
                    transition: "opacity 0.3s",
                    fontFamily: "Lora, serif",
                  }}
                >
                  SHOP NOW →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Section 2 */}
      <div className="container-fluid" style={{ backgroundColor: "#f9f9f9" }}>
        <div className="container" style={{ padding: "50px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "50px",
            }}
          >
            <ScrollFloat
              containerClassName=""
              textClassName=""
              styles={{
                fontFamily: "Lora, serif",
                fontWeight: "600",
                fontSize: "48px",
              }}
            >
              FEATURED PRODUCTS
            </ScrollFloat>
            {featuredTagId2 && (
              <Button
                variant="text"
                onClick={() =>
                  navigate("/tag-products", {
                    state: { tagId: featuredTagId2 },
                  })
                }
                sx={{
                  textTransform: "none",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#333",
                  textDecoration: "underline",
                  fontSize: "15px",
                }}
              >
                View All
              </Button>
            )}
          </div>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              paddingLeft: "20px",
            }}
          >
            <div
              className="row no-scrollbar"
              ref={productCarouselRef}
              style={{
                display: "flex",
                flexWrap: "nowrap",
                overflowX: "scroll",
              }}
            >
              {featuredProducts2.map((prod, i) => (
                <ProductCard
                  key={i}
                  product={prod}
                  onView={() =>
                    navigate("/view-product", { state: { productId: prod.id } })
                  }
                  onAdd={() => handleAddToCartClick(prod)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Brands Section using ScrollVelocity */}
      <div
        className="container-fluid"
        style={{
          backgroundColor: "#000",
          padding: "50px 20px",
          overflow: "hidden",
        }}
      >
        <div
          className="container"
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 1,
            paddingBottom: "60px",
          }}
        >
          <h2
            style={{
              fontFamily: "Lora, serif",
              fontWeight: "600",
              fontSize: "38px",
              color: "#fff",
              marginBottom: "40px",
            }}
          >
            BRANDS AVAILABLE
          </h2>
          <ScrollVelocity
            texts={[
              "Array | Folk Club | Fashionology | Fashion Trail |",
              " Be Indian | American Fit | Foggy | Macpi |",
              " D&T | Rare Urban | Ever Since | Radiology | Zero Gravity |",
              " High Density | Purple Haze | Maniac | Grow Up |",
              " Ice Tees | Striker | A1 Bright | Raffal |",
            ]}
            velocity={80}
            damping={50}
            stiffness={400}
            numCopies={6}
            parallaxClassName="parallax"
            scrollerClassName="scroller"
            scrollerStyle={{ color: "#c5c5fc" }}
          />
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
          <div style={{ maxWidth: "50%" }}>
            <ScrollFloat
              containerClassName=""
              textClassName=""
              styles={{
                fontFamily: "Lora",
                fontWeight: "600",
                fontSize: "38px",
                lineHeight: "61px",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              Download the VastraHub App Today
            </ScrollFloat>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "400",
                marginBottom: "50px",
              }}
            >
              Download the VastraHub app to streamline your shopping experience.
              Access exclusive deals, manage orders easily, and connect directly
              with trusted manufacturers anytime, anywhere. Your Gateway to
              effortless, secure, and efficient garment shopping starts here.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "20px",
              }}
            >
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
          <div style={{ maxWidth: "50%" }}>
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
        <SizeSelectorOverlay product={overlayProduct} onClose={closeOverlay} />
      )}
    </>
  );
}

// Loader styles for full-screen loading overlay
const loaderStyles = {
  container: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center", // center the logo horizontally too
  },
  logo: {
    marginBottom: "20px",
  },
  text: {
    color: "#fff",
    fontSize: "4rem",
    fontFamily: "Lora, serif",
    textAlign: "center",
    marginBottom: "10px",
  },
  text2: {
    color: "#fff",
    fontSize: "5rem",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    textAlign: "center",
  },
};
