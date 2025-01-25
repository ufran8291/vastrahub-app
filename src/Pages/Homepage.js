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

// ---------------- SIZE SELECTOR OVERLAY ----------------
function SizeSelectorOverlay({ product, onClose, onConfirm }) {
  const [quantities, setQuantities] = useState([]);

  // Count distinct sizes with quantity > 0
  const distinctSelected = quantities.filter((q) => q.quantity > 0).length;

  useEffect(() => {
    if (product && product.sizes) {
      // Initialize each size with quantity = 0
      const initData = product.sizes.map((s) => ({
        ...s,
        quantity: 0,
      }));
      setQuantities(initData);
    }
  }, [product]);

  // =========== INCREMENT ===========
  const handleIncrement = (idx) => {
    console.log(`handleIncrement fired, idx=${idx}`);
    setQuantities((prev) => {
      const updated = [...prev];
      const stock = updated[idx].boxesInStock || 0;
      if (updated[idx].quantity < stock) {
        updated[idx].quantity += 1;
        console.log(`quantity for idx=${idx} => ${updated[idx].quantity}`);
      }
      return updated;
    });
  };

  // =========== DECREMENT ===========
  const handleDecrement = (idx) => {
    console.log(`handleDecrement fired, idx=${idx}`);
    setQuantities((prev) => {
      const updated = [...prev];
      if (updated[idx].quantity > 0) {
        updated[idx].quantity -= 1;
        console.log(`quantity for idx=${idx} => ${updated[idx].quantity}`);
      }
      return updated;
    });
  };

  // =========== CONFIRM ===========
  const handleConfirm = () => {
    if (distinctSelected < 2) {
      toast.info("Please select at least 2 different sizes.");
      return;
    }
    const selectedSizes = quantities.filter((q) => q.quantity > 0);
    onConfirm(selectedSizes);
  };

  if (!product) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          width: "400px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        <h3
          style={{
            marginBottom: "10px",
            fontFamily: "Lora, serif",
            fontWeight: 600,
            fontSize: "22px",
          }}
        >
          Select Quantities
        </h3>
        <p style={{ marginBottom: "20px", fontSize: "16px", color: "#333" }}>
          {product.title}
        </p>

        {/* SCROLLABLE AREA */}
        <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
          {quantities.map((sizeObj, idx) => (
            <div
              key={sizeObj.size}
              style={{
                borderBottom: "1px solid #eee",
                padding: "8px 0",
                marginBottom: "8px",
              }}
            >
              <strong style={{ fontSize: "16px" }}>
                Size: {sizeObj.size} (Stock: {sizeObj.boxesInStock})
              </strong>
              <div style={{ fontSize: "14px", color: "#555" }}>
                Price/Piece: ₹{sizeObj.pricePerPiece} | Pieces/Box: {sizeObj.boxPieces}
              </div>

              {/* Increment/Decrement Controls */}
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Decrement button */}
                <button
                  onClick={() => handleDecrement(idx)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #333",
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: sizeObj.quantity > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  -
                </button>

                <span style={{ minWidth: "24px", textAlign: "center" }}>
                  {sizeObj.quantity}
                </span>

                {/* Increment button */}
                <button
                  onClick={() => handleIncrement(idx)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #333",
                    width: "32px",
                    height: "32px",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  disabled={sizeObj.quantity >= sizeObj.boxesInStock}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* NOTE IF <2 DISTINCT SIZES */}
        {distinctSelected < 2 && (
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>
            You must select at least 2 different sizes.
          </p>
        )}

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* CANCEL */}
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#333",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "0px",
              border: "solid 1px #333",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          {/* CONFIRM */}
          <button
            onClick={handleConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#333",
              color: "#fff",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "0px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- HOMEPAGE COMPONENT --------------------
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
        cats.push({
          name: docSnap.data().categoryName.toUpperCase(),
          image: docSnap.data().imageUrl || null,
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

  // Carousel scroll
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
    if (!uid) return;
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
    { image: tagImage1, alt: "Browse by Category", buttonLabel: "Shop Now" },
    { image: tagImage2, alt: "Featured Catalogue", buttonLabel: "Shop Now" },
    { image: tagImage3, alt: "Best Deals", buttonLabel: "Shop Now" },
    { image: tagImage4, alt: "New Arrivals", buttonLabel: "Shop Now" },
  ];

  return (
    <>
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
                      onClick={() => navigate("/view-product", { state: { productId: prod.id } })}
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
          <div style={{ gridColumn: "span 2", position: "relative" }}>
            <img
              src={tagImage1}
              alt="Browse by Category"
              style={{ width: "100%", height: "auto", borderRadius: "8px" }}
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
              }}
            >
              Shop Now
            </button>
          </div>
          <div>
            <img
              src={tagImage2}
              alt="Featured Catalogue"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>
          <div>
            <img
              src={tagImage3}
              alt="Best Deals"
              style={{ width: "100%", borderRadius: "8px" }}
            />
          </div>
          <div style={{ gridColumn: "span 2", position: "relative" }}>
            <img
              src={tagImage4}
              alt="New Arrivals"
              style={{ width: "100%", height: "auto", borderRadius: "8px" }}
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
              }}
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Vastrahub App Section */}
      <div className="container-fluid" style={{ backgroundColor: "#fff", padding: "50px 0" }}>
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
              />
              <img
                src={appStoreImage}
                alt="App Store"
                style={{ width: "150px", cursor: "pointer" }}
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
