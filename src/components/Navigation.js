import React, { useState, useEffect, useContext } from 'react';
import '../App.css';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom'; 

// Import SVGs
import logo from '../assets/vastrahubLogo.svg';
import callIcon from '../assets/phoneIcon.svg';
import searchIcon from '../assets/searchIcon.svg';
import userIcon from '../assets/accounticon.svg';
import cartIcon from '../assets/cartIcon.svg';
import FBLogo from '../assets/FBLogo.svg';
import IGLogo from '../assets/IGLogo.svg';
import WALogo from '../assets/WALogo.svg';

// Import GlobalContext
import { GlobalContext } from '../Context/GlobalContext';

// Material UI Tooltip (optional)
import { Tooltip } from '@mui/material';
import { toast } from 'react-toastify';

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
      const querySnapshot = await getDocs(collection(db, 'categories'));
      querySnapshot.forEach((doc) => {
        fetchedCategories.push(doc.data().categoryName);
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
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
        setCategories(['Tshirts', 'Shirts', 'Trousers', 'Jeans']);
      }
    }
    fetchCategories();
  }, []);

  // -------------------------
  // DYNAMIC UI HANDLERS
  // -------------------------

  // Text shown in top-right: either "Login to view prices" or "Logout"
  const loginLogoutText = isLoggedIn ? 'Logout' : 'Login or Register to view prices';

  // When top-right text is clicked
  const handleLoginLogoutClick = () => {
    if (isLoggedIn) {
      // If logged in, sign out
      signOutUser();
    } else {
      // If logged out, go to OTP verification
      navigate('/otp-verify');
    }
  };

  // Tooltip for user icon: "View Profile" if logged in, "Login or Create Account" if logged out
  const userIconTooltip = isLoggedIn ? 'View Profile' : 'Login or Create Account';

  // When user icon is clicked
  const handleUserIconClick = () => {
    if (isLoggedIn) {
      // If logged in, sign out (or navigate to profile if you prefer)
      navigate('my-profile')
    } else {
      // If logged out, go to OTP verification
      navigate('/otp-verify');
    }
  };

  // When logo is clicked, navigate home
  const handleLogoClick = () => {
    navigate('/');
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div
      className="navigation-bar"
      style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        backgroundColor: 'white',
        color: '#161515',
        padding: '20px 30px',
      }}
    >
      {/* Upper Part */}
      <div className="upper-navbar d-flex justify-content-between align-items-center">
        {/* Left Part */}
        <div className="left-part d-flex align-items-center">
          <img src={callIcon} alt="Call" style={{ height: '16px', marginRight: '8px' }} />
          <span style={{ fontSize: 12 }}>Call us on 1234567890</span>
        </div>

        {/* Middle Part */}
        <div className="middle-part d-flex align-items-center">
          <img src={IGLogo} height={30} style={{ margin: '0 8px' }} alt="Instagram" />
          <img src={WALogo} height={30} style={{ margin: '0 8px' }} alt="WhatsApp" />
          <img src={FBLogo} height={30} style={{ margin: '0 8px' }} alt="Facebook" />
        </div>

        {/* Right Part */}
        <div className="right-part">
          <span
            style={{ fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={handleLoginLogoutClick}
          >
            {loginLogoutText}
          </span>
        </div>
      </div>

      {/* Horizontal Divider */}
      <hr style={{ margin: '10px 0', borderTop: '1px solid #555' }} />

      {/* Lower Part */}
      <div className="lower-navbar d-flex justify-content-between align-items-center">
        {/* Left Part: Logo */}
        <div className="left-part" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
          <img src={logo} alt="Vastrahub Logo" style={{ height: '40px' }} />
        </div>

        {/* Middle Part: Categories */}
        <div className="middle-part d-flex">
          {categories.map((category) => (
            <span key={category} style={{ margin: '0 10px', cursor: 'pointer' }}>
              {category}
            </span>
          ))}
        </div>

        {/* Right Part: Icons (Search, User, Cart) */}
        <div className="right-part d-flex align-items-center">
          <img
            src={searchIcon}
            alt="Search"
            style={{ height: '20px', margin: '0 10px', cursor: 'pointer' }}
            onClick={() => navigate("/search-products")}
          />

          {/* User Icon with Tooltip */}
          <Tooltip title={userIconTooltip} arrow>
            <img
              src={userIcon}
              alt="User"
              style={{ height: '20px', margin: '0 10px', cursor: 'pointer' }}
              onClick={handleUserIconClick}
            />
          </Tooltip>

          <img
            src={cartIcon}
            alt="Cart"
            style={{ height: '20px', margin: '0 10px', cursor: 'pointer' }}
            onClick={()=>{
              if (isLoggedIn) {
                   
                    navigate("/user-cart");
                    return;
              }else{
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
