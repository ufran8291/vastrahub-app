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
  getCountFromServer,
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
import { MdFactory, MdSecurity } from "react-icons/md";

// Components
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";
import { Button, LinearProgress } from "@mui/material";
import { TbSpeakerphone } from "react-icons/tb";
import { ReactTyped } from "react-typed";
import ProductCard from "../components/ProductCard";
import Squares from "../Bits/Squares";
import ScrollFloat from "../Bits/ScrollFloat";
import ScrollVelocity from "../Bits/ScrollVelocity";
import RotatingText from "../Bits/RotatingText";

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

function CategoryCard({ category, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        width: "300px",
        marginRight: "20px",
        textAlign: "center",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={category.image || categoryPlaceholder}
          alt={category.name}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "cover",
            transition: "transform 0.3s",
            transform: hover ? "scale(1.05)" : "scale(1)",
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
            backgroundColor: hover ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "clamp(16px, 3vw, 24px)",
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
          fontSize: "clamp(18px, 3vw, 28px)",
          marginTop: "10px",
          textTransform: "uppercase",
          color: "#333",
        }}
      >
        {category.name}
      </h3>
    </div>
  );
}

function CategoryCard2({ category, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        textAlign: "center",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={category.image || categoryPlaceholder}
          alt={category.name}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "cover",
            transition: "transform 0.3s",
            transform: hover ? "scale(1.05)" : "scale(1)",
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
            backgroundColor: hover ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "clamp(16px, 3vw, 24px)",
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
          fontSize: "clamp(18px, 3vw, 28px)",
          marginTop: "10px",
          textTransform: "uppercase",
          color: "#fff",
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

  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
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

  const [overlayProduct, setOverlayProduct] = useState(null);

  const isMobile = window.innerWidth <= 768;

  const sections = [
    { svg: svg1, headline: "Direct from Manufacturers", description: "Quality garments straight from manufacturers." },
    { svg: svg2, headline: "Best Price Across India", description: "Unbeatable prices nationwide, guaranteed." },
    { svg: svg3, headline: "Years of Market Experience", description: "Expertise you can trust, built over years." },
    { svg: svg5, headline: "Secure Payments", description: "Safe and reliable transactions, every time." },
    { svg: svg6, headline: "VastraHub Factory", description: "In-house crafted VastraHub products deliver Best quality & rates.." },
    { svg: svg4, headline: "Trusted Brands", description: "Wellknown Indian retail brands for more quality reliability" },
  ];

  useEffect(() => {
    checkSessionTokenConsistency();

    if (!loading && !isTyping) {
      setFadeOut(true);
      setTimeout(() => setShowLoader(false), 500);
    }
  }, [loading, isTyping, checkSessionTokenConsistency]);

  useEffect(() => {
    const fetchTagIds = async () => {
      const tagId1 = await getTagIdByTitle("Featured Products");
      const tagId2 = await getTagIdByTitle("Featured Products 2");
      setFeaturedTagId(tagId1);
      setFeaturedTagId2(tagId2);
    };
    fetchTagIds();
  }, []);

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
      setLoading(false);
      setIsTyping(false);
    }
    fetchData();
  }, []);

  const fetchHeroBanner = async () => {
    try {
      const heroDocRef = doc(db, "banners", "hero-banner");
      const heroDocSnap = await getDoc(heroDocRef);
      if (heroDocSnap.exists()) {
        const data = heroDocSnap.data();
        if (data.imageLink) {
          setHeroBanner(data.imageLink);
        }
        if (data.hasTag === true && data.tagId) {
          setHeroBannerTag(data.tagId);
        }
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
          }
          return null;
        })
      );
      const validBanners = fetchedBanners.filter((banner) => banner !== null);
      setBanners(validBanners);
      setBannerHover(new Array(validBanners.length).fill(false));
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const announcementDocRef = doc(db, "banners", "announcement");
      const announcementDocSnap = await getDoc(announcementDocRef);
      if (announcementDocSnap.exists()) {
        const data = announcementDocSnap.data();
        setAnnouncementText(data.announcementText || "");
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };
  const getCategoryImages = async () => {
    try {
      const catDocs = await getDocs(collection(db, "categories"));
      const rawCats = catDocs.docs.map((d) => ({
        name: d.data().categoryName || "UNNAMED",
        image: d.data().imageUrl || null,
        subCategories: d.data().subCategories || [],
        order: d.data().order || 0,
      }));

      const catsWithProducts = await Promise.all(
        rawCats.map(async (cat) => {
          const countSnap = await getCountFromServer(
            query(collection(db, "products"), where("category", "==", cat.name))
          );
          return countSnap.data().count > 0 ? cat : null;
        })
      );

      return catsWithProducts.filter(Boolean).sort((a, b) => a.order - b.order);
    } catch (err) {
      console.error("[Homepage] Error fetching categories:", err);
      return [];
    }
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
            discount : data.discount||0,
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
            discount : data.discount||0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching featured products 2:", error);
    }
    return prods;
  };

  const scrollCarousel = (ref, direction, amount) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCartClick = (product) => {
    if (!isLoggedIn) {
      toast.info("Please log in to add products to your cart.");
      navigate("/otp-verify");
      return;
    }
    setOverlayProduct(product);
  };

  const closeOverlay = () => {
    setOverlayProduct(null);
  };

  // ======================= JSX RENDER START =========================

  return (
    <>
      {showLoader && (
        <div
          style={{
            ...loaderStyles.container,
            transition: "opacity 0.5s ease-in-out",
            opacity: fadeOut ? 0 : 1,
          }}
        >
          <img src={vasLogo} height={200} alt="VastraHub Logo" style={loaderStyles.logo} />
          <div style={{ width: "50%", marginBottom: "75px" }}>
            <LinearProgress color="inherit" />
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div style={{ position: "relative" }}>
        <img
          src={heroBanner || defaultHeroImg}
          alt="Hero"
          style={{
            width: "100%",
            height: isMobile ? "300px" : "auto",
            objectFit: "cover",
          }}
          onError={(e) => {
            console.log("Hero banner fallback");
            e.target.src = defaultHeroImg;
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? "100px" : "210px",
            left: "8vw",
            width: "80%",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "Lora, serif",
                fontSize: isMobile ? "clamp(24px, 6vw, 32px)" : "58px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              VASTRAHUB :
            </span>
          </div>
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
                fontSize: isMobile ? "clamp(16px, 5vw, 22px)" : "38px",
                fontWeight: "600",
                color: "#c5c5fc",
              }}
            />
          </div>
        </div>

        {/* SHOP NOW Button */}
        <Button
          variant="contained"
          onClick={() => {
            heroBannerTag
              ? navigate("/tag-products", { state: { tagId: heroBannerTag } })
              : navigate("/about-us");
          }}
          sx={{
            position: "absolute",
            bottom: isMobile ? "30px" : "100px",
            left: "8vw",
            backgroundColor: "#000",
            color: "#fff",
            textTransform: "none",
            fontSize: isMobile ? "0.8rem" : "1.2rem",
            padding: isMobile ? "10px 20px" : "20px 30px",
          }}
        >
          {heroBannerTag ? "SHOP NOW" : "ABOUT US"}
        </Button>
      </div>

      {/* Announcement */}
      {announcementText && (
        <div style={{ backgroundColor: "#000", padding: "10px 20px" }}>
          <marquee
            behavior="alternate"
            direction="left"
            style={{
              color: "#fff",
              fontFamily: "Lora, serif",
              fontSize: isMobile ? "clamp(12px, 4vw, 16px)" : "1.2rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <TbSpeakerphone size={20} style={{ marginRight: "8px" }} />
            {announcementText}
          </marquee>
        </div>
      )}

      {/* Info Sections */}
      <div style={{ padding: "70px 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {sections.map((section, i) => (
            <div key={i} style={{ textAlign: "center", minWidth: 0 }}>
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

      {/* Featured Products 1 */}
      <div style={{ backgroundColor: "#f9f9f9", padding: "50px 20px" }}>
        <div style={{ marginBottom: "50px", display: "flex", justifyContent: "space-between" }}>
          <ScrollFloat
            containerClassName=""
            textClassName=""
            styles={{
              fontFamily: "Lora, serif",
              fontWeight: "600",
              fontSize: "clamp(24px, 6vw, 48px)", // Mobile → 24px , Desktop → max 48px
              marginBottom: "30px",
              textAlign: "left",
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
            display: "flex",
            overflowX: "scroll",
            gap: "20px",
            paddingBottom: "20px",
          }}
          className="no-scrollbar"
          ref={productCarouselRef}
        >
          {featuredProducts.map((prod, i) => (
            <ProductCard
              key={i}
              product={prod}
               onView={() =>
                   window.open(
                     `/view-product?productId=${prod.id}`,
                     "_blank",
                     "noopener,noreferrer"
                   )}
              onAdd={() => handleAddToCartClick(prod)}
            />
          ))}
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

      {/* Featured Products 2 */}
      <div style={{ backgroundColor: "#f9f9f9", padding: "50px 20px" }}>
        <div style={{ marginBottom: "50px", display: "flex", justifyContent: "space-between" }}>
          <ScrollFloat
            containerClassName=""
            textClassName=""
            styles={{
              fontFamily: "Lora, serif",
              fontWeight: "600",
              fontSize: "clamp(24px, 6vw, 48px)", // Mobile → 24px , Desktop → max 48px
              marginBottom: "30px",
              textAlign: "left",
            }}
          >
            FEATURED PRODUCTS
          </ScrollFloat>
          {featuredTagId2 && (
            <Button
              variant="text"
              onClick={() =>
                navigate("/tag-products", { state: { tagId: featuredTagId2 } })
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
            display: "flex",
            overflowX: "scroll",
            gap: "20px",
            paddingBottom: "20px",
          }}
          className="no-scrollbar"
          ref={productCarouselRef}
        >
          {featuredProducts2.map((prod, i) => (
            <ProductCard
              key={i}
              product={prod}
               onView={() =>
                   window.open(
                     `/view-product?productId=${prod.id}`,
                     "_blank",
                     "noopener,noreferrer"
                   )}
              onAdd={() => handleAddToCartClick(prod)}
            />
          ))}
        </div>
      </div>

      {/* Brands Available */}
      <div
        style={{
          backgroundColor: "#000",
          padding: "50px 20px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ fontFamily: "Lora, serif", fontSize: "38px", marginBottom: "20px" }}>
          BRANDS AVAILABLE
        </h2>
        <ScrollVelocity
          texts={[
            "Array | Folk Club | Fashionology | Fashion Trail |",
            " Be Indian | American Fit | Foggy | Macpi | Aldrich |",
            " D&T | Rare Urban | Ever Since | Radiology | Zero Gravity |",
            " High Density | Purple Haze | Maniac | Grow Up | Riggas |",
            " Ice Tees | Striker | A1 Bright | Raffal | Vyardo |",
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

      {/* Download App Section */}
      <div style={{ backgroundColor: "#fff", padding: "50px 0" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "30px",
          }}
        >
          <div style={{ maxWidth: isMobile ? "90%" : "45%" }}>
            <ScrollFloat
              containerClassName=""
              textClassName=""
              // styles={{
              //   fontFamily: "Lora",
              //   fontWeight: "600",
              //   fontSize: "38px",
              //   lineHeight: "61px",
              //   letterSpacing: "0.03em",
              //   textTransform: "uppercase",
              //   marginBottom: "20px",
              //   textAlign: "left",
              // }}
              styles={{
                fontFamily: "Lora, serif",
                fontWeight: "600",
                fontSize: "clamp(24px, 6vw, 48px)", // Mobile → 24px , Desktop → max 48px
                marginBottom: "20px",
                textTransform: "uppercase",
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
            <div style={{ display: "flex", gap: "20px" }}>
              <img
                src={googlePlayImage}
                alt="Google Play Store"
                style={{ width: "150px", cursor: "pointer" }}
                onClick={() => window.open("https://play.google.com/store", "_blank")}
              />
              <img
                src={appStoreImage}
                alt="App Store"
                style={{ width: "150px", cursor: "pointer" }}
                onClick={() => window.open("https://www.apple.com/app-store/", "_blank")}
              />
            </div>
          </div>
          <div style={{ maxWidth: isMobile ? "90%" : "45%" }}>
            <img
              src={mobileAppImage}
              alt="Vastrahub Mobile App"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>
        </div>
      </div>

      {/* Overlay */}
      {overlayProduct && (
        <SizeSelectorOverlay product={overlayProduct} onClose={closeOverlay} />
      )}
    </>
  );
}

// Loader styles
const loaderStyles = {
  container: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    marginBottom: "20px",
  },
};
