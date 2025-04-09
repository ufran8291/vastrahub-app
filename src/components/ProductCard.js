import React, { useContext } from "react";
import { Tooltip } from "@mui/material";
import PixelTransition from "../Bits/PixelTransition";
import { GlobalContext } from "../Context/GlobalContext";

const ProductCard = ({ product, onView, onAdd }) => {
  const { currentUser, firestoreUser, checkSessionTokenConsistency } = useContext(GlobalContext);
    const isLoggedIn = !!currentUser && !!firestoreUser; 
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: "430px",
        marginRight: "10px",
        textAlign: "left",
        padding: "10px",
        height: "650px", // increased card height
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingBottom: "20px",
        border: "1px solid #eee",
        borderRadius: "8px",
      }}
    >
      <div>
        {/* Image Container with white background */}
        {/* <div
          style={{
            width: "100%",
            height: "400px", // increased image container height
            // backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            marginBottom: "10px",
            overflow: "hidden",
          }}
        > */}
          <div onClick={onView} style={{ cursor: "pointer" }}>
  <PixelTransition
    firstContent={
      <img
        src={product.image}
        alt={`Front view of ${product.title}`}
        style={{
          minWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          backgroundColor: "#DAE0E2",
          marginBottom: "20px",
        }}
      />
    }
    secondContent={
      <img
        src={product.additionalImages[0]}
        alt={`Additional view of ${product.title}`}
        style={{
          minWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          backgroundColor: "#DAE0E2",
          marginBottom: "20px",
        }}
      />
    }
    gridSize={24}
    pixelColor="#DAE0E2"
    animationStepDuration={0.4}
  />
</div>

        {/* </div> */}
        <h3
          style={{
            fontFamily: "Lora, serif",
            fontWeight: "500",
            fontSize: "20px",
            marginBottom: "10px",
            marginTop:'10px'
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
            {product.fabric}
          </p>
          <p
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "16px",
              fontWeight: "400",
              margin: 0,
            }}
          >
            From ₹ {isLoggedIn? product.price:'XXX (Login to view)'}
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
          }}
        >
          {product.sizes.map((sz, j) => {
            const pieces = sz.piecesInStock || 0;
            const boxPiecesVal = sz.boxPieces || 1;
            const fullBoxes = Math.floor(pieces / boxPiecesVal);
            const remainder = pieces % boxPiecesVal;
            const totalBoxes = fullBoxes + (remainder > 0 ? 1 : 0);
            const tooltipText =
              pieces > 0
                ? `${totalBoxes} box available (${fullBoxes} full` +
                  (remainder > 0 ? `, 1 partial (${remainder} pieces)` : "") +
                  `)`
                : "Out of stock";
            return (
              // <Tooltip key={j} title={tooltipText} arrow>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: `2px solid ${pieces > 0 ? "#333" : "#ccc"}`,
                    backgroundColor: pieces > 0 ? "#fff" : "#f5f5f5",
                    color: pieces > 0 ? "#333" : "#aaa",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    objectFit: "contain",
                  }}
                >
                  {sz.size}
                </div>
              // </Tooltip>
            );
          })}
        </div>
      </div>
      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "10px",
        }}
      >
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
          onClick={onView}
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
          onClick={onAdd}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
