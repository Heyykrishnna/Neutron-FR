"use client";

import React from "react";
import { motion } from "framer-motion";

interface BlurHeadingProps {
  text: string;
  className?: string;
  spanClassName?: string;
}

const BlurHeading: React.FC<BlurHeadingProps> = ({ text, className, spanClassName }) => {
  const characters = text.split("");

  return (
    <h1 className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className={`inline-block transition-all duration-300 ease-out cursor-default ${spanClassName}`}
          initial={{ filter: "blur(0px)", scale: 1, opacity: 1 }}
          whileHover={{ 
            filter: "blur(6px)", 
            scale: 1.15,
            opacity: 0.9,
            transition: { duration: 0.15, ease: "easeOut" } 
          }}
          style={{ 
            display: char === " " ? "inline" : "inline-block",
            whiteSpace: char === " " ? "pre" : "normal"
          }}
        >
          {char}
        </motion.span>
      ))}
    </h1>
  );
};

export default BlurHeading;
