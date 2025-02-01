// src/Pages/Navigation.js

import React, { useState, useEffect, useContext } from "react";
import "../App.css";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

// Material UI Tooltip (optional)
import { Tooltip } from "@mui/material";
import { toast } from "react-toastify";

export default function Navigation() {
  const navigate = useNavigate();

  // Access global states/functions
  const { currentUser, firestoreUser, signOutUser } = useContext(GlobalContext);

  // "Logged in" if both currentUser & firestoreUser are not null
  const isLoggedIn = Boolean(currentUser && firestoreUser);

  // Categories State
  const [categories, setCategories] = useState([]);

  // Fetch categories from Firestore
  const getCategories = async () => {
    const db = getFirestore();
    const fetchedCategories = [];
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({
          name: doc.data().categoryName || "UNNAMED",
          image: doc.data().imageUrl || null, // Include image if available
          subCategories: doc.data().subCategories || [],
        });
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
    return fetchedCategories;
  };

  // On mount, attempt to fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getCategories();
      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        // Default fallback if no data in Firestore
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

  // -------------------------
  // DYNAMIC UI HANDLERS
  // -------------------------

  // Text shown in top-right: either "Login to view prices" or "Logout"
  const loginLogoutText = isLoggedIn
    ? "Logout"
    : "Login or Register to view prices";

  // When top-right text is clicked
  const handleLoginLogoutClick = () => {
    if (isLoggedIn) {
      // If logged in, sign out
      signOutUser();
    } else {
      // If logged out, go to OTP verification
      navigate("/otp-verify");
    }
  };

  // Tooltip for user icon: "View Profile" if logged in, "Login or Create Account" if logged out
  const userIconTooltip = isLoggedIn
    ? "View Profile"
    : "Login or Create Account";

  // When user icon is clicked
  const handleUserIconClick = () => {
    if (isLoggedIn) {
      // If logged in, navigate to profile
      navigate("/my-profile");
    } else {
      // If logged out, go to OTP verification
      navigate("/otp-verify");
    }
  };

  // When logo is clicked, navigate home
  const handleLogoClick = () => {
    navigate("/");
  };

  // When category is clicked, navigate to ShopByCategory with category data
  const handleCategoryClick = (category) => {
    navigate("/shopbycategory", { state: { category } });
  };

  return (
    <div
      className="navigation-bar"
      style={{
        fontFamily: "Plus Jakarta Sans, sans-serif",
        backgroundColor: "white",
        color: "#161515",
        padding: "20px 30px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* Upper Part */}
      <div className="upper-navbar d-flex justify-content-between align-items-center">
        {/* Left Part */}
        <div className="left-part d-flex align-items-center">
          <img
            src={callIcon}
            alt="Call"
            style={{ height: "16px", marginRight: "8px" }}
          />
          <span style={{ fontSize: 12 }}>Call us on 1234567890</span>
        </div>

        {/* Middle Part */}
        <div className="middle-part d-flex align-items-center">
          <img
            src={IGLogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="Instagram"
            onClick={() => window.open("https://instagram.com", "_blank")}
          />
          <img
            src={WALogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="WhatsApp"
            onClick={() => window.open("https://wa.me/", "_blank")}
          />
          <img
            src={FBLogo}
            height={30}
            style={{ margin: "0 8px", cursor: "pointer" }}
            alt="Facebook"
            onClick={() => window.open("https://facebook.com", "_blank")}
          />
        </div>

        {/* Right Part */}
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

      {/* Horizontal Divider */}
      <hr style={{ margin: "10px 0", borderTop: "1px solid #555" }} />

      {/* Lower Part */}
      <div className="lower-navbar d-flex justify-content-between align-items-center">
        {/* Left Part: Logo */}
        <div
          className="left-part"
          style={{ cursor: "pointer" }}
          onClick={handleLogoClick}
        >
          <img src={logo} alt="Vastrahub Logo" style={{ height: "40px" }} />
        </div>

        {/* Middle Part: Categories */}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#333";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#161515";
              }}
            >
              {category.name}
              {/* Optional: Dropdown for subcategories */}
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
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      {subcat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Part: Icons (Search, User, Cart) */}
        <div className="right-part d-flex align-items-center">
          <img
            src={searchIcon}
            alt="Search"
            style={{
              height: "20px",
              margin: "0 10px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/search-products")}
          />

          {/* User Icon with Tooltip */}
          <Tooltip title={userIconTooltip} arrow>
            <img
              src={userIcon}
              alt="User"
              style={{
                height: "20px",
                margin: "0 10px",
                cursor: "pointer",
              }}
              onClick={handleUserIconClick}
            />
          </Tooltip>

          <img
            src={cartIcon}
            alt="Cart"
            style={{
              height: "20px",
              margin: "0 10px",
              cursor: "pointer",
            }}
            onClick={() => {
              if (isLoggedIn) {
                navigate("/user-cart");
                return;
              } else {
                toast.info("Please log in to view your cart.");
                navigate("/otp-verify");
                return;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* Add the following CSS to your App.css or corresponding CSS file to handle the subcategory dropdown */

