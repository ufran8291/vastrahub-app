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
import MyOders from './Pages/MyOders'
import OrderDetails from "./Pages/OrderDetails";
import RefundPolicy from "./Pages/RefundPolicy";

// New pages to add:
import AboutUs from "./Pages/AboutUs";
import TermsAndConditions from "./Pages/TermsAndConditions";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import TagProducts from "./Pages/TagProducts";

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
          element: (
            // <ProtectedRoute condition={!!userAuth.currentUser}>
              <Homepage />
            // </ProtectedRoute>
          ),
        },
        {
          path: "/signin",
          element: <SignIn />,
        },
        {
          path: "/otp-verify",
          element: <OTPVerification />,
        },
        {
          path: "/register",
          element: <NewUser />,
        },
        {
          path: "/registration-success",
          element: <RegistrationSuccess />,
        },
        {
          path: "/request-pending",
          element: <RequestPending />,
        },
        {
          path: "/request-rejected",
          element: <RequestRejected />,
        },
        {
          path: "/blocked-user",
          element: <BlockedUser />,
        },
        {
          path: "/view-product",
          element: <ViewProduct />,
        },
        {
          path: "/search-products",
          element: <SearchProducts />,
        },
        {
          path: "/user-cart",
          element: <UserCart />,
        },
        {
          path: "/my-profile",
          element: <MyProfile />,
        },
        {
          path: "/shopbycategory",
          element: <ShopByCategory />,
        },
        {
          path: "/help",
          element: <HelpPage />,
        },
        {
          path: "/order",
          element: <OrderPage />,
        },
        {
          path: "/order-success",
          element: <OrderSuccess />,
        },
        {
          path: "/order-details",
          element: <OrderDetails />,
        },
        {
          path: "/my-orders",
          element: <MyOders />,
        },
        {
          path: "/refund-policy",
          element: <RefundPolicy />,
        },
        // New pages added:
        {
          path: "/about-us",
          element: <AboutUs />,
        },
        {
          path: "/terms-and-conditions",
          element: <TermsAndConditions />,
        },
        {
          path: "/privacy-policy",
          element: <PrivacyPolicy />,
        },
        {
          path: "/tag-products",
          element: <TagProducts />,
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
      <App />
    </GlobalProvider>
  );
}

export default AppWithProvider;
