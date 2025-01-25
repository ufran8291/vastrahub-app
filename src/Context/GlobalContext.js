import React, { createContext, useState, useEffect } from "react";
import { auth } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    //user data from the Firebase auth object
  const [currentUser, setCurrentUser] = useState(null);
//   user data from the Firestore doc for corresponding user.
  const [firestoreUser, setFirestoreUser] = useState(null);

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null); 
      setFirestoreUser(null); 
      console.log("User signed out globally.");
      toast.success('Logged Out')
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

  // Expose our global state and functions
  const globalContextValue = {
    currentUser,       // The Firebase Auth user object
    firestoreUser,     // The Firestore user data
    updateFirestoreUser, //function to update firestore user object
    signOutUser, //signout both user data.
  };

  return (
    <GlobalContext.Provider value={globalContextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
