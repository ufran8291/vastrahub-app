// src/App.js
import React, { useState } from "react";
import "./App.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Root from "./components/Root";
import NoRoute from "./components/NoRoute";
import { auth } from "./Configs/FirebaseConfig";

// Existing pages
import Homepage from "./Pages/Homepage";
import SignIn from "./Pages/SignIn";
import OTPVerification from "./Pages/OTPVerification";

// New or updated pages
import NewUser from "./Pages/NewUser";             // Registration page
import RequestPending from "./Pages/RequestPending";
import RequestRejected from "./Pages/RequestRejected";
import BlockedUser from "./Pages/BlockedUser";
import RegistrationSuccess from "./Pages/RegistrationSuccess";
import { GlobalProvider } from "./Context/GlobalContext";
import ViewProduct from "./Pages/ViewProduct";
import SearchProducts from "./Pages/SearchProducts";
import UserCart from "./Pages/UserCart";
import MyProfile from "./Pages/MyProfile";
import ShopByCategory from "./Pages/ShopByCategory";
import HelpPage from "./Pages/HelpPage";
import OrderPage from "./Pages/OrderPage";
import OrderSuccess from "./Pages/OrderSuccess";
// import MyOrders from "./Pages/MyOrders";
import MyOders from './Pages/MyOders';
import OrderDetails from "./Pages/OrderDetails";
import RefundPolicy from "./Pages/RefundPolicy";

// New pages to add:
import AboutUs from "./Pages/AboutUs";
import TermsAndConditions from "./Pages/TermsAndConditions";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import TagProducts from "./Pages/TagProducts";
import CustomCursor from "./components/CustomCursor";

import { motion } from "framer-motion";
import ShippingPolicy from "./Pages/ShippingPolicy";
import PaymentStatus from "./Pages/PaymentStatus";

// A helper component that adds a smooth transition to its children.
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    style={{ height: "100%" }}
  >
    {children}
  </motion.div>
);

// A helper function to wrap a component with PageTransition.
const withTransition = (component) => <PageTransition>{component}</PageTransition>;

function App() {
  if (process.env.NODE_ENV === "development") {
    console.log("Running in development mode");
  }

  // Keep track of auth for ProtectedRoute usage
  const [userAuth] = useState(auth);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      errorElement: <NoRoute />,
      children: [
        {
          // Homepage (protected)
          path: "/",
          element: withTransition(<Homepage />),
        },
        {
          path: "/signin",
          element: withTransition(<SignIn />),
        },
        {
          path: "/otp-verify",
          element: withTransition(<OTPVerification />),
        },
        {
          path: "/register",
          element: withTransition(<NewUser />),
        },
        {
          path: "/registration-success",
          element: withTransition(<RegistrationSuccess />),
        },
        {
          path: "/request-pending",
          element: withTransition(<RequestPending />),
        },
        {
          path: "/request-rejected",
          element: withTransition(<RequestRejected />),
        },
        {
          path: "/blocked-user",
          element: withTransition(<BlockedUser />),
        },
        {
          path: "/view-product",
          element: withTransition(<ViewProduct />),
        },
        {
          path: "/search-products",
          element: withTransition(<SearchProducts />),
        },
        {
          path: "/user-cart",
          element: withTransition(<UserCart />),
        },
        {
          path: "/my-profile",
          element: withTransition(<MyProfile />),
        },
        {
          path: "/shopbycategory",
          element: withTransition(<ShopByCategory />),
        },
        {
          path: "/contact",
          element: withTransition(<HelpPage />),
        },
        {
          path: "/order",
          element: withTransition(<OrderPage />),
        },
        {
          path: "/order-success",
          element: withTransition(<OrderSuccess />),
        },
        {
          path: "/order-details",
          element: withTransition(<OrderDetails />),
        },
        {
          path: "/my-orders",
          element: withTransition(<MyOders />),
        },
        {
          path: "/refund-policy",
          element: withTransition(<RefundPolicy />),
        },
        // New pages added:
        {
          path: "/about-us",
          element: withTransition(<AboutUs />),
        },
        {
          path: "/terms-and-conditions",
          element: withTransition(<TermsAndConditions />),
        },
        {
          path: "/privacy-policy",
          element: withTransition(<PrivacyPolicy />),
        },
        {
          path: "/shipping-policy",
          element: withTransition(<ShippingPolicy />),
        },
        {
          path: "/tag-products",
          element: withTransition(<TagProducts />),
        },
        {
          path: "/payment",
          element: withTransition(<PaymentStatus />),
        },
        
       
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

/**
 * Protected route to only allow access if condition is true.
 * For demonstration, we're also reading auth.currentUser.
 */
export const ProtectedRoute = ({ condition, children }) => {
  const [userExists] = useState(auth);
  console.log(
    `ProtectedRoute check -> condition: ${condition}, userExists: ${
      userExists.currentUser ? "true" : "false"
    }`
  );
  if (userExists.currentUser !== null || condition === true) {
    return children;
  } else {
    return <Navigate to="/signin" />;
  }
};

function AppWithProvider() {
  return (
    <GlobalProvider>
      {/* <CustomCursor /> */}
      <App />
    </GlobalProvider>
  );
}

export default AppWithProvider;
