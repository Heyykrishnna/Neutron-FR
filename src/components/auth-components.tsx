"use client";

import React from "react";
import { motion } from "framer-motion";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-2 group">
        <label className="text-sm font-medium text-white/60 ml-1 transition-colors group-focus-within:text-amber-500/80">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-900/40 focus:border-amber-700/50 transition-all ${
              icon ? "pl-12" : ""
            } ${error ? "border-red-500/50 ring-red-500/20" : ""}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  isLoading?: boolean;
}

export const AuthButton = ({
  children,
  variant = "primary",
  isLoading,
  className,
  ...props
}: AuthButtonProps) => {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.15)]",
    secondary: "bg-[#6f4e37] text-white hover:bg-[#5d4037] shadow-[0_0_20px_rgba(111,78,55,0.2)]",
    outline: "bg-transparent border border-white/10 text-white hover:bg-white/5",
  };

  return (
    <button
      disabled={isLoading}
      className={`w-full relative overflow-hidden flex items-center justify-center px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        children
      )}
    </button>
  );
};
