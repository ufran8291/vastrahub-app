// src/Pages/MyOrders.js
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function MyOrders() {
  const { currentUser, firestoreUser } = useContext(GlobalContext);
  const isLoggedIn = !!currentUser && !!firestoreUser;
  const uid = firestoreUser?.id;
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.info("Please log in to view your orders.");
      navigate("/otp-verify");
      return;
    }
    fetchOrders();
  }, [isLoggedIn, navigate]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontFamily: "Lora, serif", mb: 3 }}>
        My Orders
      </Typography>
      {loadingOrders ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Typography variant="h6" align="center">
          You have not placed any orders yet.
        </Typography>
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            sx={{
              mb: 2,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "8px",
              boxShadow: 2,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontFamily: "Lora, serif" }}>
                Order #{order.id.substring(0, 8).toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Status: {order.orderStatus}
              </Typography>
              <Typography variant="body2">
                Grand Total: ₹{order.grandTotal.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                Placed on: {formatDate(order.createdAt)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <Button
              variant="contained"
              onClick={() => navigate("/order-details", { state: { orderId: order.id } })}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              View Details
            </Button>
          </Card>
        ))
      )}
    </Container>
  );
}
