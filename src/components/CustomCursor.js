// CustomCursor.js
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  // "active" indicates when the cursor should show the interactive (scaled) state.
  const [active, setActive] = useState(false);

  useEffect(() => {
    const moveHandler = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const overHandler = (e) => {
      // Check if the hovered element is interactive:
      // 1. It is a link or button, or has a custom attribute,
      // 2. OR its computed cursor style is "pointer".
      const computedCursor = window.getComputedStyle(e.target).cursor;
      if (
        e.target.closest("a") ||
        e.target.closest("button") ||
        e.target.hasAttribute("data-cursor-hover") ||
        computedCursor === "pointer"
      ) {
        setActive(true);
      }
    };

    const outHandler = () => {
      setActive(false);
    };

    // On click (mousedown), briefly trigger the active state.
    const clickHandler = () => {
      setActive(true);
      setTimeout(() => {
        setActive(false);
      }, 300);
    };

    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseover", overHandler);
    window.addEventListener("mouseout", outHandler);
    window.addEventListener("mousedown", clickHandler);

    return () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseover", overHandler);
      window.removeEventListener("mouseout", outHandler);
      window.removeEventListener("mousedown", clickHandler);
    };
  }, []);

  return (
    <>
      {/* Outer filled circle */}
      <motion.div
        className="cursor-outer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: active ? "#FF4081" : "#3F51B5",
          mixBlendMode: "difference",
        }}
        animate={{
          x: position.x - 20,
          y: position.y - 20,
          scale: active ? 1.8 : 1,
          rotate: active ? 45 : 0,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      {/* Inner dot */}
      <motion.div
        className="cursor-inner"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: active ? "#FF4081" : "#3F51B5",
          mixBlendMode: "difference",
        }}
        animate={{
          x: position.x - 4,
          y: position.y - 4,
          opacity: 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </>
  );
};

export default CustomCursor;
