// src/Pages/Homepage.js

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";

// Assets
import defaultHeroImg from "../assets/heroimg.png";
import svg1 from "../assets/iconamoon_delivery-light.svg";
import svg2 from "../assets/si_rupee-duotone.svg";
import svg3 from "../assets/mdi-light_calendar.svg";
import svg4 from "../assets/gala_secure.svg";
import categoryPlaceholder from "../assets/categoryplaceholder.png";
import productPlaceholder from "../assets/prodimgplaceholder.png";
import googlePlayImage from "../assets/googleplay.png";
import appStoreImage from "../assets/appstore.png";
import mobileAppImage from "../assets/mobilepp.png";

// Components
import SizeSelectorOverlay from "../components/SizeSelectorOverlay";

export default function Homepage() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  // Local state
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredProducts2, setFeaturedProducts2] = useState([]); // Second set of featured products
  const [heroBanner, setHeroBanner] = useState(null); // For hero banner image
  const [banners, setBanners] = useState([]); // For banner images (banner-1 to banner-4)

  const categoryCarouselRef = useRef(null);
  const productCarouselRef = useRef(null);

  // Overlay product (for SizeSelectorOverlay)
  const [overlayProduct, setOverlayProduct] = useState(null);

  // Info sections for the top info area
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

  // ------------------ Fetch Hero Banner ------------------
  const fetchHeroBanner = async () => {
    try {
      const heroDocRef = doc(db, "banners", "hero-banner");
      const heroDocSnap = await getDoc(heroDocRef);
      if (heroDocSnap.exists()) {
        const data = heroDocSnap.data();
        if (data.imageLink) {
          setHeroBanner(data.imageLink);
        } else {
          console.log("No imageLink found in hero-banner document. Using default hero image.");
        }
      } else {
        console.log("Hero banner document does not exist. Using default hero image.");
      }
    } catch (error) {
      console.error("Error fetching hero banner:", error);
    }
  };

  // ------------------ Fetch Banner Images ------------------
  const fetchBannerImages = async () => {
    try {
      // We expect banner documents with IDs "banner-1", "banner-2", "banner-3", "banner-4"
      const bannerIds = ["banner-1", "banner-2", "banner-3", "banner-4"];
      const fetchedBanners = await Promise.all(
        bannerIds.map(async (id) => {
          const bannerDocRef = doc(db, "banners", id);
          const bannerDocSnap = await getDoc(bannerDocRef);
          if (bannerDocSnap.exists()) {
            const data = bannerDocSnap.data();
            return { id, imageLink: data.imageLink, link: data.link || null };
          } else {
            console.log(`Banner document ${id} does not exist.`);
            return null;
          }
        })
      );
      setBanners(fetchedBanners.filter((banner) => banner !== null));
    } catch (error) {
      console.error("Error fetching banner images:", error);
    }
  };

  // ------------------ Fetch Categories ------------------
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

  // ------------------ Fetch Featured Products (Tag: "Featured Products") ------------------
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

  // ------------------ Fetch Featured Products 2 (Tag: "Featured Products 2") ------------------
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

  useEffect(() => {
    // Fetch hero banner and tag banners
    fetchHeroBanner();
    fetchBannerImages();

    // Fetch categories and both sets of featured products concurrently
    async function fetchData() {
      const [cats, prods, prods2] = await Promise.all([
        getCategoryImages(),
        getFeaturedProducts(),
        getFeaturedProducts2(),
      ]);
      setCategories(cats);
      setFeaturedProducts(prods);
      setFeaturedProducts2(prods2);
    }
    fetchData();
  }, []);

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

  // ------------------ Handle Overlay Confirm ------------------
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

  return (
    <>
      {/* Hero Banner */}
      <img
        src={heroBanner ? heroBanner : defaultHeroImg}
        alt="Hero"
        width="100%"
        onError={(e) => {
          console.log("Hero banner image not available, falling back to default.");
          e.target.src = defaultHeroImg;
        }}
      />

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

      {/* Categories Section */}
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
                  e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)";
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

      {/* Featured Products Section 1 */}
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
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
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
                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      gap: "10px",
                    }}
                  >
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

     
      {/* Banners Section with Custom Grid Layout */}
      <div className="container-fluid" style={{ padding: "50px 20px" }}>
        <div className="banner-grid">
          {/* Banner 1 */}
          {banners[0] && (
            <div
              className="banner banner1"
              onClick={() =>
                banners[0].link
                  ? window.open(banners[0].link, "_blank")
                  : toast.info("Banner clicked!")
              }
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={banners[0].imageLink}
                alt="Banner 1"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
          {/* Banner 2 */}
          {banners[1] && (
            <div
              className="banner banner2"
              onClick={() =>
                banners[1].link
                  ? window.open(banners[1].link, "_blank")
                  : toast.info("Banner clicked!")
              }
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={banners[1].imageLink}
                alt="Banner 2"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
          {/* Banner 3 */}
          {banners[2] && (
            <div
              className="banner banner3"
              onClick={() =>
                banners[2].link
                  ? window.open(banners[2].link, "_blank")
                  : toast.info("Banner clicked!")
              }
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={banners[2].imageLink}
                alt="Banner 3"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
          {/* Banner 4 */}
          {banners[3] && (
            <div
              className="banner banner4"
              onClick={() =>
                banners[3].link
                  ? window.open(banners[3].link, "_blank")
                  : toast.info("Banner clicked!")
              }
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={banners[3].imageLink}
                alt="Banner 4"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </div>
      </div>
 {/* Featured Products Section 2 */}
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
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              paddingLeft: "20px",
            }}
          >
            <div
              className="row no-scrollbar"
              style={{
                display: "flex",
                flexWrap: "nowrap",
                overflowX: "scroll",
              }}
            >
              {featuredProducts2.map((prod, i) => (
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
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
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
                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      gap: "10px",
                    }}
                  >
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
        <SizeSelectorOverlay
          product={overlayProduct}
          onClose={closeOverlay}
          onConfirm={handleOverlayConfirm}
        />
      )}
    </>
  );
}
