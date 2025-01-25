import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import productPlaceholder from "../assets/prodimgplaceholder.png"; // Fallback if no product image
import searchIcon from "../assets/searchIcon.svg"; // Any icon for the placeholder UI

export default function SearchProducts() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [allProducts, setAllProducts] = useState([]);  // store all products from Firestore
  const [filteredProducts, setFilteredProducts] = useState([]); // store search results
  const [loading, setLoading] = useState(true);

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const productsSnap = await getDocs(collection(db, "products"));
        const productsArr = [];
        productsSnap.forEach((doc) => {
          const data = doc.data();
          productsArr.push({
            id: doc.id,
            title: data.title,
            fabric: data.fabric,
            image: data.coverImage || productPlaceholder,
            price: data.sizes && data.sizes.length > 0 ? data.sizes[0].pricePerPiece : 0,
            sizes: data.sizes || [],
          });
        });
        setAllProducts(productsArr);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products whenever `searchText` changes
  useEffect(() => {
    if (!searchText.trim()) {
      // If empty, show no results (or show the placeholder UI)
      setFilteredProducts([]);
      return;
    }
    const lowerSearch = searchText.toLowerCase();
    const results = allProducts.filter((prod) =>
      prod.title.toLowerCase().includes(lowerSearch)
    );
    setFilteredProducts(results);
  }, [searchText, allProducts]);

  // Handler for changing search input
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, sans-serif", padding: "30px" }}>
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          maxWidth: "600px",
          margin: "0 auto 20px",
        }}
      >
        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search products by Brand, Category, or Article no..."
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            outline: "none",
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          {/* If no input, show placeholder */}
          {!searchText.trim() && (
            <div style={{ textAlign: "center", marginTop: "100px", marginBottom:'200px' }}>
              <img src={searchIcon} alt="Search Placeholder" style={{ height: "80px", marginBottom: "20px" }} />
              <p style={{ fontSize: "18px", color: "#666" }}>
                Type in the search box above to find products.
              </p>
            </div>
          )}

          {/* If input is typed, show results or "no matches" */}
          {searchText.trim() && filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <p style={{ fontSize: "18px", color: "#666" }}>
                No products found for "<strong>{searchText}</strong>"
              </p>
            </div>
          )}

          {/* Show results if searchText and we have matches */}
          {searchText.trim() && filteredProducts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
                marginTop: "30px",
              }}
            >
              {filteredProducts.map((product, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Product Image */}
                  <div>
                    <img
                      src={product.image}
                      alt={product.title}
                      style={{
                        width: "100%",
                        height: "220px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  {/* Product Info */}
                  <div style={{ padding: "10px" }}>
                    <h3
                      style={{
                        fontFamily: "Lora, serif",
                        fontWeight: "500",
                        fontSize: "20px",
                        marginBottom: "10px",
                      }}
                    >
                      {product.title}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: "400",
                          margin: 0,
                        }}
                      >
                        {product.fabric || "N/A"}
                      </p>
                      <p
                        style={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "16px",
                          fontWeight: "400",
                          margin: 0,
                        }}
                      >
                        From ₹{product.price}
                      </p>
                    </div>
                    <p
                      style={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontSize: "16px",
                        fontWeight: "500",
                        marginBottom: "10px",
                      }}
                    >
                      Available Sizes:
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      {product.sizes.map((eachSize, ind) => (
                        <div
                          key={ind}
                          style={{
                            width: "40px",
                            height: "40px",
                            border: `2px solid ${
                              eachSize.boxesInStock > 0 ? "#333" : "#ccc"
                            }`,
                            backgroundColor:
                              eachSize.boxesInStock > 0 ? "#fff" : "#f5f5f5",
                            color: eachSize.boxesInStock > 0 ? "#333" : "#aaa",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor:
                              eachSize.boxesInStock > 0
                                ? "pointer"
                                : "not-allowed",
                            opacity: eachSize.boxesInStock > 0 ? 1 : 0.6,
                          }}
                        >
                          {eachSize.size}
                          {eachSize.boxesInStock === 0 && (
                            <div
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "2px",
                                backgroundColor: "#aaa",
                                transform: "rotate(-45deg)",
                                top: "50%",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "#fff",
                          color: "#333",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "14px",
                          fontWeight: "500",
                          borderRadius: "0px",
                          border: "solid 1px #333",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          navigate("/view-product", {
                            state: { productId: product.id },
                          });
                        }}
                      >
                        View More
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "#333",
                          color: "#fff",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontSize: "14px",
                          fontWeight: "500",
                          borderRadius: "0px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          alert(`Adding ${product.title} to cart`)
                        }
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
