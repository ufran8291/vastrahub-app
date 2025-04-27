// src/Context/GlobalContext.js
import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../Configs/FirebaseConfig";
import { toast } from "react-toastify";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  updateDoc,
  getFirestore,
  getDoc,
} from "firebase/firestore";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [firestoreUser, setFirestoreUser] = useState(null);

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setFirestoreUser(null);
      localStorage.removeItem("websiteSessionToken");
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

  const checkSessionTokenConsistency = async () => {
    if (!currentUser) return;
    try {
      // Use the Firestore user's document id if available; otherwise fall back to currentUser.uid.
      const userDocId =  firestoreUser.id ;
      console.log("Checking session token consistency for user document:", firestoreUser);
      console.log("Checking session token consistency for user document:", userDocId);
      
      // Directly get the user document from the "users" collection.
      const userDocRef = doc(db, "users", userDocId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const localToken = localStorage.getItem("websiteSessionToken");
        console.log("Local session token:", localToken, "Firestore session token:", data.websiteSessionToken);
        // If the session token in Firestore does not match the local token, sign out the user.
        if (data.websiteSessionToken && data.websiteSessionToken !== localToken) {
          toast.error("You have been logged out because your account was signed in on another device.");
          await signOutUser();
        }
      } else {
        console.log("No matching user document found for document id:", userDocId);
      }
    } catch (error) {
      console.error("Error checking session token consistency:", error);
    }
  };
  

  // Example: You might call checkSessionTokenConsistency() on critical actions or periodically.
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     checkSessionTokenConsistency();
  //   }, 60000); // check every 60 seconds
  //   return () => clearInterval(intervalId);
  // }, [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      console.log(`user is ${user}`);
  
      if (user) {
        console.log("GlobalContext: Detected sign-in with phone:", user.phoneNumber);
  
        try {
          // Fetch user from Firestore by phone number
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("primaryPhone", "==", user.phoneNumber?.replace("+91", "")));
          const snapshot = await getDocs(q);
  
          let userData = null;
          if (!snapshot.empty) {
            userData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            console.log("User found by primaryPhone:", userData);
          } else {
            // Try alternatePhone
            const altQ = query(usersRef, where("alternatePhone", "==", user.phoneNumber?.replace("+91", "")));
            const altSnapshot = await getDocs(altQ);
            if (!altSnapshot.empty) {
              userData = { id: altSnapshot.docs[0].id, ...altSnapshot.docs[0].data() };
              console.log("User found by alternatePhone:", userData);
            }
          }
  
          if (userData) {
            const { userStage } = userData;
            console.log("User stage:", userStage);
  
            if (userStage === 5) {
              await signOutUser();
              window.location.href = "/request-pending";
              return;
            }
            if (userStage === -1) {
              await signOutUser();
              window.location.href = "/request-rejected";
              return;
            }
            if (userStage === -10) {
              await signOutUser();
              window.location.href = "/blocked-user";
              return;
            }
            if (userStage === 10 || userStage === 20) {
              console.log("GlobalContext: Setting Firestore user data");
              setFirestoreUser(userData);
              localStorage.setItem("websiteSessionToken", userData.websiteSessionToken || "");
            } else {
              console.log("Unknown userStage, signing out.");
              await signOutUser();
              window.location.href = "/";
            }
          } else {
            console.log("User not found in Firestore. Signing out.");
            await signOutUser();
            window.location.href = "/register";
          }
  
        } catch (err) {
          console.error("Error fetching user after Firebase sign-in:", err);
          await signOutUser();
          window.location.href = "/";
        }
  
      } else {
        console.log("GlobalContext: Detected sign-out.");
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  // New function to fetch stock data from the new API endpoint.
  const fetchGoFrugalItems = async () => {
    try {
      const response = await fetch(
        "https://fetchitems-k4uu64ikma-uc.a.run.app/"
      );
      console.log("Stock fetch response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}\nResponse: ${errorText}`
        );
      }
      const data = await response.json();
      return data.stock || data;
    } catch (err) {
      throw err;
    }
  };

  // Function to call the syncStockData function (for updating piecesInStock)
  const syncStockData = async () => {
    try {
      const response = await fetch(
        "https://syncstockdata-k4uu64ikma-uc.a.run.app",
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}\nResponse: ${errorText}`
        );
      }
      const resultText = await response.text();
      return resultText;
    } catch (err) {
      throw err;
    }
  };

  // Updated function: Accepts an array of inventoryIds, fetches stock data,
  // and then updates each product's sizes with the matching piecesInStock.
  const syncStockDataForIds = async (inventoryIds) => {
    try {
      // Fetch stock from the new endpoint.
      const items = await fetchGoFrugalItems();
      if (!Array.isArray(items)) {
        throw new Error("Expected stock array from GoFrugal API.");
      }

      let updateCount = 0;
      const dbInstance = getFirestore();
      const productsSnapshot = await getDocs(
        collection(dbInstance, "products")
      );

      // Loop through each product in Firestore.
      for (const docSnap of productsSnapshot.docs) {
        const productData = docSnap.data();
        if (!productData.sizes || !Array.isArray(productData.sizes)) continue;

        let updated = false;
        // Update sizes where the inventoryId matches the stock record's itemReferenceCode.
        const updatedSizes = productData.sizes.map((size) => {
          if (inventoryIds.includes(Number(size.inventoryId))) {
            const matchingItem = items.find(
              (item) =>
                String(item.itemReferenceCode) === String(size.inventoryId)
            );
            if (matchingItem && typeof matchingItem.stock === "number") {
              updated = true;
              return { ...size, piecesInStock: matchingItem.stock };
            }
          }
          return size;
        });

        if (updated) {
          await updateDoc(doc(dbInstance, "products", docSnap.id), {
            sizes: updatedSizes,
          });
          updateCount++;
        }
      }
      return updateCount;
    } catch (err) {
      throw err;
    }
  };

  const checkStockAvailability = async (inventoryIds) => {
    try {
      // Check store status
      const storeDoc = await getDoc(doc(db, "banners", "other-data"));
      let isStoreOpen = false;
      if (storeDoc.exists()) {
        isStoreOpen = storeDoc.data().isStoreOpen;
      }
      if (isStoreOpen) {
        // If store is open, first sync stock.
        await syncStockData();
      }
      // Then, fetch products from Firestore and extract available pieces.
      const availableStock = {};
      const productsSnapshot = await getDocs(collection(db, "products"));
      productsSnapshot.forEach((docSnap) => {
        const product = docSnap.data();
        if (product.sizes && Array.isArray(product.sizes)) {
          product.sizes.forEach((size) => {
            const invId = Number(size.inventoryId);
            if (inventoryIds.includes(invId)) {
              // If multiple products share the same inventoryId, we assume the latest value.
              availableStock[invId] = size.piecesInStock;
            }
          });
        }
      });
      return availableStock;
    } catch (err) {
      throw err;
    }
  };

  // New function to call our email Cloud Function.
  const sendEmail = async ({ email, subject, content }) => {
    try {
      const response = await fetch(
        "https://sendemail-k4uu64ikma-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, subject, content }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}\n${errorText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };
  const generatePaymentLink = async ({ amount, transactionId, merchantUserId, orderId }) => {
    try {
      console.log('trying to make a payment with : ')
      console.log(amount)
      console.log(transactionId)
      console.log(merchantUserId)
      console.log(orderId)
      const response = await fetch(
        // "https://createphonepepayment-k4uu64ikma-uc.a.run.app",
        "https://createphonepepayment-k4uu64ikma-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount,transactionId, merchantUserId, orderId  }),
        }
      );
      console.log(response)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}\n${errorText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };
  const getPhonePePaymentStatus = async ({  merchantOrderId }) => {
    try {
      const response = await fetch(
        "https://getphonepepaymentstatus-k4uu64ikma-uc.a.run.app", // Replace with actual deployed CF endpoint
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantOrderId }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status}\n${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };
  

  const createSalesOrder = async (orderData) => {
    try {
      const response = await fetch(
        "https://createsalesorder-k4uu64ikma-uc.a.run.app",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error: ${response.status} - ${response.statusText}\n${errorText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const globalContextValue = {
    currentUser, // Firebase Auth user object
    firestoreUser, // Firestore user data
    updateFirestoreUser, // Function to update Firestore user data
    signOutUser,
    checkSessionTokenConsistency,
    fetchGoFrugalItems,
    syncStockData,
    syncStockDataForIds,
    checkStockAvailability,
    sendEmail,
    createSalesOrder, 
    generatePaymentLink, // Function to sign out the user
    getPhonePePaymentStatus,
  };

  return (
    <GlobalContext.Provider value={globalContextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
