// src/Pages/MyOrders.js
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  CircularProgress,
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
  }, [isLoggedIn]);

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
      <Typography variant="h4" align="center" gutterBottom sx={{ fontFamily: "Lora, serif" }}>
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
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} key={order.id}>
              <Card>
                <CardActionArea
                  onClick={() => navigate("/order-details", { state: { orderId: order.id } })}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontFamily: "Lora, serif" }}>
                      Order #{order.id.substring(0, 8).toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      Status: {order.orderStatus}
                    </Typography>
                    <Typography variant="body2">
                      Total: ₹{order.grandTotal.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Placed on: {formatDate(order.createdAt)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
