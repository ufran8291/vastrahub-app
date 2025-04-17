// src/Pages/Navigation.js
import React, { useState, useEffect, useContext } from "react";
import "../App.css";
import { getFirestore, collection, getDocs, getCountFromServer, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Import SVGs
import logo from "../assets/vastrahubLogo.svg";
import callIcon from "../assets/phoneIcon.svg";
import searchIcon from "../assets/searchIcon.svg";
import userIcon from "../assets/accounticon.svg";
import cartIcon from "../assets/cartIcon.svg";
import FBLogo from "../assets/FBLogo.svg";
import IGLogo from "../assets/IGLogo.svg";
import WALogo from "../assets/WALogo.svg";

// Import GlobalContext
import { GlobalContext } from "../Context/GlobalContext";

// Material UI components and icons
import { Tooltip, useMediaQuery, Drawer, IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from "react-toastify";

export default function Navigation() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:768px)");

  // Access global states/functions
  const { currentUser, firestoreUser, signOutUser } = useContext(GlobalContext);
  const isLoggedIn = Boolean(currentUser && firestoreUser);

  // Categories state
  const [categories, setCategories] = useState([]);
  // State to toggle mobile menu (Drawer)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch categories from Firestore
  const getCategories = async () => {
    const db = getFirestore();
    try {
      // 1) Get *all* category docs first (cheap single read per doc)
      const snap = await getDocs(collection(db, "categories"));
      const rawCats = snap.docs.map((d) => ({
        name: d.data().categoryName || "UNNAMED",
        image: d.data().imageUrl || null,
        subCategories: d.data().subCategories || [],
        order: d.data().order || 0,
      }));

      // 2) For each category, run an *aggregation count* query in parallel
      const catsWithProducts = await Promise.all(
        rawCats.map(async (cat) => {
          try {
            const countSnap = await getCountFromServer( 
              query(collection(db, "products"), where("category", "==", cat.name))
            );
            // Debug — uncomment if needed
            // console.log(`Count for ${cat.name}:`, countSnap.data().count);
            return countSnap.data().count > 0 ? cat : null;
          } catch (err) {
            console.error(`[Navigation] count error for ${cat.name}:`, err);
            return null;
          }
        })
      );

      return catsWithProducts
        .filter(Boolean) // remove nulls
        .sort((a, b) => a.order - b.order);
    } catch (err) {
      console.error("[Navigation] Error fetching categories:", err);
      return [];
    }
  };

  // On mount, fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getCategories();
      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        // Fallback if no data is available
        setCategories([
          { name: "Tshirts", image: null, subCategories: [] },
          { name: "Shirts", image: null, subCategories: [] },
          { name: "Trousers", image: null, subCategories: [] },
          { name: "Jeans", image: null, subCategories: [] },
        ]);
      }
    }
    fetchCategories();
  }, []);

  // Dynamic UI handlers
  const loginLogoutText = isLoggedIn
    ? "Logout"
    : "Login or Register to view prices";

  const handleLoginLogoutClick = () => {
    if (isLoggedIn) {
      signOutUser();
    } else {
      navigate("/otp-verify");
    }
  };

  const userIconTooltip = isLoggedIn ? "View Profile" : "Login or Create Account";

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      navigate("/my-profile");
    } else {
      navigate("/otp-verify");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleCategoryClick = (category) => {
    navigate("/shopbycategory", { state: { category } });
    // Close the mobile menu (if open)
    setMobileMenuOpen(false);
  };

  // Mobile menu content for Drawer
  const mobileMenuContent = (
    <div style={{ width: "80vw", padding: "20px", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton onClick={() => setMobileMenuOpen(false)}>
          <CloseIcon />
        </IconButton>
      </div>
      {/* Call Info */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <Tooltip title="Call us now" arrow>
          <img
            src={callIcon}
            alt="Call"
            style={{ height: "16px", marginRight: "8px", cursor: "pointer" }}
            onClick={() => window.open("tel:+918275334335")}
          />
        </Tooltip>
        <Tooltip title="Click to call +91 8275334335" arrow>
          <span
            style={{
              fontSize: 14,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => window.open("tel:+918275334335")}
          >
            +91 8275334335
          </span>
        </Tooltip>
      </div>
      {/* Social Icons */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <Tooltip title="Visit our Instagram" arrow>
          <img
            src={IGLogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="Instagram"
            onClick={() => window.open("https://www.instagram.com/vastrahub.in/", "_blank")}
          />
        </Tooltip>
        <Tooltip title="Chat with us on WhatsApp" arrow>
          <img
            src={WALogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="WhatsApp"
            onClick={() => window.open("https://wa.me/918275334335", "_blank")}
          />
        </Tooltip>
        <Tooltip title="Visit our Instagram (via Facebook icon)" arrow>
          <img
            src={FBLogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="Facebook"
            onClick={() => window.open("https://www.instagram.com/vastrahub.in/", "_blank")}
          />
        </Tooltip>
      </div>
      {/* Login/Logout */}
      <div style={{ marginBottom: "15px", cursor: "pointer", textDecoration: "underline", fontSize: "14px" }} onClick={handleLoginLogoutClick}>
        {loginLogoutText}
      </div>
      {/* Categories */}
      <div>
        <h3 style={{ marginBottom: "10px" }}>Categories</h3>
        {categories.map((category) => (
          <div
            key={category.name}
            onClick={() => handleCategoryClick(category)}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            {category.name}
          </div>
        ))}
      </div>
      {/* Additional Icons */}
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: "20px" }}>
        <Tooltip title="Search Products" arrow>
          <img
            src={searchIcon}
            alt="Search"
            style={{ height: "20px", cursor: "pointer" }}
            onClick={() => {
              setMobileMenuOpen(false);
              navigate("/search-products");
            }}
          />
        </Tooltip>
        <Tooltip title={userIconTooltip} arrow>
          <img
            src={userIcon}
            alt="User"
            style={{ height: "20px", cursor: "pointer" }}
            onClick={() => {
              setMobileMenuOpen(false);
              handleUserIconClick();
            }}
          />
        </Tooltip>
        <Tooltip title="View Cart" arrow>
          <img
            src={cartIcon}
            alt="Cart"
            style={{ height: "20px", cursor: "pointer" }}
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoggedIn) {
                navigate("/user-cart");
              } else {
                toast.info("Please log in to view your cart.");
                navigate("/otp-verify");
              }
            }}
          />
        </Tooltip>
      </div>
    </div>
  );

  // Desktop Navigation JSX
  const desktopNav = (
    <div className="navigation-bar" style={{
      fontFamily: "Plus Jakarta Sans, sans-serif",
      backgroundColor: "white",
      color: "#161515",
      padding: "20px 30px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }}>
      {/* Upper Navbar */}
      <div className="upper-navbar d-flex justify-content-between align-items-center">
        {/* Left: Call Info */}
        <div className="left-part d-flex align-items-center">
          <Tooltip title="Call us now" arrow>
            <img
              src={callIcon}
              alt="Call"
              style={{ height: "16px", marginRight: "8px", cursor: "pointer" }}
              onClick={() => window.open("tel:+918275334335")}
            />
          </Tooltip>
          <Tooltip title="Click to call +91 8275334335" arrow>
            <span
              style={{
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => window.open("tel:+918275334335")}
            >
              +91 8275334335
            </span>
          </Tooltip>
        </div>
        {/* Middle: Social Icons */}
        <div className="middle-part d-flex align-items-center">
          <Tooltip title="Visit our Instagram" arrow>
            <img
              src={IGLogo}
              height={30}
              style={{ margin: "0 8px", cursor: "pointer" }}
              alt="Instagram"
              onClick={() =>
                window.open("https://www.instagram.com/vastrahub.in/", "_blank")
              }
            />
          </Tooltip>
          <Tooltip title="Chat with us on WhatsApp" arrow>
            <img
              src={WALogo}
              height={30}
              style={{ margin: "0 8px", cursor: "pointer" }}
              alt="WhatsApp"
              onClick={() =>
                window.open("https://wa.me/918275334335", "_blank")
              }
            />
          </Tooltip>
          <Tooltip title="Visit our Instagram (via Facebook icon)" arrow>
            <img
              src={FBLogo}
              height={30}
              style={{ margin: "0 8px", cursor: "pointer" }}
              alt="Facebook"
              onClick={() =>
                window.open("https://www.instagram.com/vastrahub.in/", "_blank")
              }
            />
          </Tooltip>
        </div>
        {/* Right: Login/Logout */}
        <div className="right-part">
          <span
            style={{
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={handleLoginLogoutClick}
          >
            {loginLogoutText}
          </span>
        </div>
      </div>
      <hr style={{ margin: "10px 0", borderTop: "1px solid #555" }} />
      {/* Lower Navbar */}
      <div className="lower-navbar d-flex justify-content-between align-items-center">
        {/* Left: Logo */}
        <div
          className="left-part"
          style={{ cursor: "pointer" }}
          onClick={handleLogoClick}
        >
          <img src={logo} alt="Vastrahub Logo" style={{ height: "40px" }} />
        </div>
        {/* Middle: Categories */}
        <div className="middle-part d-flex align-items-center">
          {categories.map((category) => (
            <div
              key={category.name}
              onClick={() => handleCategoryClick(category)}
              style={{
                margin: "0 10px",
                cursor: "pointer",
                position: "relative",
                padding: "5px 0",
                fontWeight: "500",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#333")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#161515")}
            >
              {category.name}
              {/* Optional subcategory dropdown */}
              {category.subCategories.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "30px",
                    left: "0",
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    display: "none",
                    minWidth: "150px",
                  }}
                  className="subcategory-dropdown"
                >
                  {category.subCategories.map((subcat) => (
                    <div
                      key={subcat}
                      style={{
                        padding: "5px 10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() =>
                        handleCategoryClick({ ...category, subcategory: subcat })
                      }
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      {subcat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Right: Icons */}
        <div className="right-part d-flex align-items-center">
          <Tooltip title="Search Products" arrow>
            <img
              src={searchIcon}
              alt="Search"
              style={{ height: "20px", margin: "0 10px", cursor: "pointer" }}
              onClick={() => navigate("/search-products")}
            />
          </Tooltip>
          <Tooltip title={userIconTooltip} arrow>
            <img
              src={userIcon}
              alt="User"
              style={{ height: "20px", margin: "0 10px", cursor: "pointer" }}
              onClick={handleUserIconClick}
            />
          </Tooltip>
          <Tooltip title="View Cart" arrow>
            <img
              src={cartIcon}
              alt="Cart"
              style={{ height: "20px", margin: "0 10px", cursor: "pointer" }}
              onClick={() => {
                if (isLoggedIn) {
                  navigate("/user-cart");
                } else {
                  toast.info("Please log in to view your cart.");
                  navigate("/otp-verify");
                }
              }}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            backgroundColor: "white",
            position: "sticky",
            top: 0,
            zIndex: 1100,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            fontFamily: "Plus Jakarta Sans, sans-serif"
          }}>
            <div style={{ cursor: "pointer" }} onClick={handleLogoClick}>
              <img src={logo} alt="Vastrahub Logo" style={{ height: "40px" }} />
            </div>
            <IconButton onClick={() => setMobileMenuOpen(true)}>
              <MenuIcon />
            </IconButton>
          </div>
          {/* Mobile Drawer */}
          <Drawer
            anchor="right"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          >
            {mobileMenuContent}
          </Drawer>
        </>
      ) : (
        desktopNav
      )}
    </>
  );
}
