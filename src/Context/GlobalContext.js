// src/Context/GlobalContext.js
import React, { createContext, useState, useEffect } from "react";
import { auth } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  // User data from Firebase auth
  const [currentUser, setCurrentUser] = useState(null);
  // User data from Firestore for the corresponding user.
  const [firestoreUser, setFirestoreUser] = useState(null);

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setFirestoreUser(null);
      console.log("User signed out globally.");
      toast.success("Logged Out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateFirestoreUser = (userData) => {
    try {
      setFirestoreUser(userData);
      console.log("GlobalContext: Firestore user data updated:", userData);
    } catch (error) {
      console.error("Error updating Firestore user data:", error);
    }
  };

  // New function: sendSMStoUserPhone
  const sendSMStoUserPhone = async (message) => {
    if (!currentUser || !currentUser.phoneNumber) {
      console.error("No user or phone number available");
      toast.error("Unable to send SMS: No phone number available");
      return;
    }
    const phoneNumber = currentUser.phoneNumber;
    try {
      const response = await fetch("https://api.msg91.com/api/sendhttp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // Construct the request payload as URL-encoded parameters.
        body: new URLSearchParams({
          authkey: "YOUR_MSG91_API_KEY", // Replace with your Msg91 API key
          mobiles: phoneNumber,          // Ensure this is in the required format (include country code if needed)
          message: message,
          sender: "VASTRA",              // Customize your sender ID (usually 6 characters)
          route: "4",                    // As per your Msg91 settings
          country: "91",                 // Country code (for India)
        }).toString(),
      });
      if (!response.ok) {
        throw new Error("SMS sending failed");
      }
      const result = await response.text();
      console.log("SMS sent successfully:", result);
      return result;
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Error sending SMS");
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        console.log("GlobalContext: Detected sign-in with phone:", user.phoneNumber);
      } else {
        console.log("GlobalContext: Detected sign-out.");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const globalContextValue = {
    currentUser,         // Firebase Auth user object
    firestoreUser,       // Firestore user data
    updateFirestoreUser, // Function to update Firestore user data
    signOutUser,         // Function to sign out the user
    sendSMStoUserPhone,  // New function to send an SMS to the user's phone
  };

  return (
    <GlobalContext.Provider value={globalContextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
