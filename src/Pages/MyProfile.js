import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  updateDoc
} from "firebase/firestore";
import { GlobalContext } from "../Context/GlobalContext";
import { toast } from "react-toastify";
import {
  MdShoppingCart,
  MdReceiptLong,
  MdHelpOutline,
  MdLogout,
  MdEdit,
  MdSave,
  MdClose
} from "react-icons/md"; // icons for cart, orders, help, logout, etc.

export default function MyProfile() {
  const navigate = useNavigate();
  const { currentUser, firestoreUser, signOutUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;

  // If Firestore user doc has "id" or "docId"
  const [userDocId, setUserDocId] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    altPhone: "",
    email: "",
    address: "",
    gstin: "",
    pan: "",
    transportService: "",
    joinedOn: null,
  });

  // For editing transport
  const [isEditingTransport, setIsEditingTransport] = useState(false);
  const [tempTransport, setTempTransport] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your profile.");
      navigate("/otp-verify");
      return;
    }
    // Load data from "firestoreUser"
    if (firestoreUser) {
        console.log(firestoreUser)
      setProfileData({
        fullName: firestoreUser.name || "",
        businessName: firestoreUser.businessName || "",
        phone: firestoreUser.primaryPhone || "",
        altPhone: firestoreUser.alternatePhone || "",
        email: firestoreUser.email || "",
        address: firestoreUser.address || "",
        gstin: firestoreUser.gstin || "",
        pan: firestoreUser.pan || "",
        transportService: firestoreUser.transportService || "",
        joinedOn: firestoreUser.JoinedOn || null,
      });
      setTempTransport(firestoreUser.transportService||"");

      if (firestoreUser.id) {
        setUserDocId(firestoreUser.id);
      }
    }
  }, [isLoggedIn, firestoreUser, navigate]);

  // Format "joinedOn" if it's a Firestore Timestamp or a JS Date
  const formatDate = (val) => {
    if (!val) return "";
    const dateObj = val.toDate ? val.toDate() : val; 
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getAvatarLetter = () => {
    const nameStr = profileData.businessName || profileData.fullName;
    if (!nameStr) return "?";
    return nameStr.charAt(0).toUpperCase();
  };

  // Section click => navigate
  const handleSectionClick = (section) => {
    if (section === "cart") {
      navigate("/user-cart");
    } else if (section === "orders") {
      navigate("/my-orders");
    } else if (section === "help") {
      navigate("/help");
    }
  };

  // Transport editing
  const handleEditTransport = () => {
    setTempTransport(profileData.transportService);
    setIsEditingTransport(true);
  };
  const handleCancelTransport = () => {
    setIsEditingTransport(false);
    setTempTransport("");
  };
  const handleSaveTransport = async () => {
    if (!userDocId) {
      toast.error("Unable to update: Missing user doc ID");
      return;
    }
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", userDocId);

      await updateDoc(userRef, {
        transportService: tempTransport
      });
      // update local state
      setProfileData((prev) => ({
        ...prev,
        transportService: tempTransport
      }));
      toast.success("Preferred Transport updated.");
    } catch (error) {
      console.error("Error updating transport service:", error);
      toast.error("Failed to update transport service.");
    } finally {
      setIsEditingTransport(false);
    }
  };

  // Logout button => signOutUser
  const handleLogout = () => {
    signOutUser();
    toast.info("Logged out successfully.");
    navigate("/");
  };

  if (!isLoggedIn) return null; 

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "30px" }}>
      {/* Title Row: "My Profile" + Logout button on right */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "Lora, serif",
            fontWeight: "600",
            fontSize: "32px",
            textTransform: "uppercase",
            margin: 0,
            flex: 1
          }}
        >
          My Profile
        </h1>
        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "#fff",
            color: "#333",
            border: "1px solid #333",
            cursor: "pointer",
            padding: "8px 12px",
            fontSize: "14px",
          }}
        >
          <MdLogout size={18} />
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        {/* Avatar + Basic Info */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#333",
              color: "#fff",
              fontSize: "36px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: "20px",
            }}
          >
            {getAvatarLetter()}
          </div>

          {/* Name + BusinessName + JoinedOn */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontWeight: 600, fontSize: "20px" }}>
              {profileData.fullName || "Your Name"}
            </h2>
            <p style={{ margin: "4px 0", color: "#555" }}>
              {profileData.businessName || "Your Business"}
            </p>
            {profileData.joinedOn && (
              <p style={{ margin: 0, fontStyle: "italic", fontSize: "14px", color: "#999" }}>
                Member Since: {formatDate(profileData.joinedOn)}
              </p>
            )}
          </div>
        </div>

        {/* Detailed Info */}
        <div style={{ display: "grid", rowGap: "10px" }}>
          <div>
            <strong>Phone:</strong>{" "}
            <span style={{ marginLeft: "4px" }}>{profileData.phone || "N/A"}</span>
          </div>
          {profileData.altPhone && (
            <div>
              <strong>Alternate Phone:</strong>{" "}
              <span style={{ marginLeft: "4px" }}>{profileData.altPhone}</span>
            </div>
          )}
          <div>
            <strong>Email:</strong>{" "}
            <span style={{ marginLeft: "4px" }}>{profileData.email || "N/A"}</span>
          </div>
          <div>
            <strong>Address:</strong>{" "}
            <span style={{ marginLeft: "4px" }}>{profileData.address || "N/A"}</span>
          </div>

          {/* GST / PAN */}
          {(profileData.gstin || profileData.pan) ? (
            <>
              {profileData.gstin && (
                <div>
                  <strong>GSTIN:</strong>{" "}
                  <span style={{ marginLeft: "4px" }}>{profileData.gstin}</span>
                </div>
              )}
              {profileData.pan && (
                <div>
                  <strong>PAN:</strong>{" "}
                  <span style={{ marginLeft: "4px" }}>{profileData.pan}</span>
                </div>
              )}
            </>
          ) : (
            <div>
              <strong>GSTIN/PAN:</strong>{" "}
              <span style={{ marginLeft: "4px" }}>N/A</span>
            </div>
          )}

          {/* Transport: Edit logic */}
          <div>
            <strong>Preferred Transport:</strong>
            {!isEditingTransport ? (
              <>
                <span style={{ marginLeft: "4px" }}>
                  {profileData.transportService || "N/A"}
                </span>
                {/* Edit button */}
                <button
                  onClick={() => handleEditTransport()}
                  style={{
                    marginLeft: "10px",
                    backgroundColor: "#fff",
                    color: "#333",
                    border: "1px solid #333",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <MdEdit size={14} />
                  Edit
                </button>
              </>
            ) : (
              <div style={{ marginTop: "6px" }}>
                <input
                  type="text"
                  value={tempTransport}
                  onChange={(e) => setTempTransport(e.target.value)}
                  style={{
                    padding: "6px",
                    fontSize: "14px",
                    marginRight: "8px",
                  }}
                />
                <button
                  onClick={handleSaveTransport}
                  style={{
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "none",
                    padding: "6px 12px",
                    marginRight: "6px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <MdSave size={14} />
                  Save
                </button>
                <button
                  onClick={handleCancelTransport}
                  style={{
                    backgroundColor: "#fff",
                    color: "#333",
                    border: "1px solid #333",
                    padding: "6px 12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <MdClose size={14} />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sections: My Cart, My Orders, Help */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}
      >
        {/* My Cart */}
        <div
          onClick={() => handleSectionClick("cart")}
          style={{
            flex: "1 1 200px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <MdShoppingCart size={32} />
          <h3
            style={{
              marginTop: "10px",
              fontSize: "18px",
              fontWeight: 500,
            }}
          >
            My Cart
          </h3>
        </div>

        {/* My Orders */}
        <div
          onClick={() => handleSectionClick("orders")}
          style={{
            flex: "1 1 200px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <MdReceiptLong size={32} />
          <h3
            style={{
              marginTop: "10px",
              fontSize: "18px",
              fontWeight: 500,
            }}
          >
            My Orders
          </h3>
        </div>

        {/* Help */}
        <div
          onClick={() => handleSectionClick("help")}
          style={{
            flex: "1 1 200px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <MdHelpOutline size={32} />
          <h3
            style={{
              marginTop: "10px",
              fontSize: "18px",
              fontWeight: 500,
            }}
          >
            Help
          </h3>
        </div>
      </div>
    </div>
  );
}
