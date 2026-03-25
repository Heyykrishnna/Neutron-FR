import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-5xl" }: ModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-pointer"
          />
          
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 35, stiffness: 200 }}
              className={`w-full ${maxWidth} max-h-[90vh] bg-[#050505]/80 border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto relative overflow-hidden backdrop-blur-3xl flex flex-col`}
            >
              <div className="absolute -top-24 -left-24 w-1/2 h-1/2 bg-white/5 blur-[120px] -z-10 rounded-full animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-1/2 h-1/2 bg-white/5 blur-[120px] -z-10 rounded-full animate-pulse" />
              
          <div className="flex items-center justify-between mb-12 shrink-0">
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-white/30 uppercase">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-4 hover:bg-white/5 rounded-full transition-all duration-300 text-white/40 hover:text-white group"
                >
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                    className="group-hover:rotate-90 transition-transform duration-300"
                  >
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              
              <div 
                className="relative z-10 overflow-y-auto custom-scrollbar pr-4 grow"
                data-lenis-prevent
              >
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
