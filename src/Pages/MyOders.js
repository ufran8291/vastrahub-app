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
  IconButton,
} from "@mui/material";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../Configs/FirebaseConfig";
import { GlobalContext } from "../Context/GlobalContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// MUI icons
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InfoIcon from "@mui/icons-material/Info";

// Framer Motion & React Awesome Reveal
import { motion } from "framer-motion";
import { Fade } from "react-awesome-reveal";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Motion variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
    hover: { scale: 1.02, transition: { duration: 0.3 } },
  };

  return (
    <Container
      sx={{
        mt: 4,
        mb: 4,
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      <Fade triggerOnce>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontFamily: "Lora, serif", mb: 3 }}
        >
          My Orders
        </Typography>
      </Fade>
      {loadingOrders ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Typography variant="h6" align="center">
          You have not placed any orders yet.
        </Typography>
      ) : (
        orders.map((order, index) => (
          <motion.div
            key={order.id}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={cardVariants}
          >
            <Card
              sx={{
                mb: 2,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "8px",
                boxShadow: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                <ReceiptLongIcon
                  sx={{ fontSize: 40, mr: 2, color: "#1976d2" }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: "Lora, serif", mb: 0.5 }}
                  >
                    Order #{order.id.substring(0, 8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {order.orderStatus}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grand Total: ₹{order.grandTotal.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Placed on: {formatDate(order.createdAt)}
                  </Typography>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Button
                variant="contained"
                startIcon={<InfoIcon />}
                onClick={() =>
                  navigate("/order-details", { state: { orderId: order.id } })
                }
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#333" },
                }}
              >
                View Details
              </Button>
            </Card>
          </motion.div>
        ))
      )}
    </Container>
  );
}
