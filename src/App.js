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
        // These routes are public or “unprotected” by default.
        // If you want them behind a ProtectedRoute, wrap them similarly to Homepage above.
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
        }
        
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

// export default App;

/**
 * Protected route to only allow access if condition is true
 * (e.g., userAuth.currentUser is not null).
 */
export const ProtectedRoute = ({ condition, children }) => {
  // For demonstration, we're also reading `auth.currentUser` here
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

// We now export AppWithProvider instead of App
export default AppWithProvider;