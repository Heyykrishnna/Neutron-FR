"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "./Loader";

interface LoaderWrapperProps {
  children: React.ReactNode;
}

const LoaderWrapper: React.FC<LoaderWrapperProps> = ({ children }) => {
  const [showLoader, setShowLoader] = useState<boolean | null>(null);

  useEffect(() => {
    const hasLoaderShown = sessionStorage.getItem("loader-shown");

    if (!hasLoaderShown) {
      setShowLoader(true);
      sessionStorage.setItem("loader-shown", "true");
    } else {
      setShowLoader(false);
    }
  }, []);

  useEffect(() => {
    if (showLoader) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [showLoader]);

  const handleComplete = () => {
    setShowLoader(false);
  };

  if (showLoader === null) {
    return <div className="fixed inset-0 bg-[#030303] z-9999" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <Loader key="loader" onComplete={handleComplete} />
        )}
      </AnimatePresence>
      <main className={`transition-opacity duration-1000 ${showLoader ? "opacity-0" : "opacity-100"}`}>
        {children}
      </main>
    </>
  );
};

export default LoaderWrapper;
