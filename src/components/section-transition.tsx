"use client";

import React, { useRef } from "react";
import { motion, useInView, HTMLMotionProps } from "framer-motion";

interface SectionTransitionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
}

export function SectionTransition({ children, className = "", ...props }: SectionTransitionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as any, { once: true, margin: "-10%" });

  return (
    <motion.section
      ref={ref as any}
      initial={{ opacity: 0, filter: "blur(20px) brightness(2)", scale: 0.95 }}
      animate={isInView ? { opacity: 1, filter: "blur(0px) brightness(1)", scale: 1 } : { opacity: 0, filter: "blur(20px) brightness(2)", scale: 0.95 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className={`will-change-[opacity,transform,filter] ${className}`}
      {...props}
    >
      {children}
    </motion.section>
  );
}
