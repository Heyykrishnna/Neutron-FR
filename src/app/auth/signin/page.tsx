"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
import { AuthInput, AuthButton } from "@/components/auth-components";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(callbackUrl);
    }, 2000);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsResetSent(true);
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="The universe is waiting for you. Sign in to continue your journey through the stars."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Sign In Account</h2>
          <p className="text-white/50">Enter your credentials to access your workspace.</p>
        </div>

        <div className="space-y-4">
          <AuthButton 
            variant="outline" 
            className="w-full flex items-center justify-center space-x-3"
            onClick={() => {}}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign in with Google</span>
          </AuthButton>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#050505] px-4 text-white/40 tracking-widest">Or continue with</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthInput 
            label="Email Address" 
            type="email" 
            placeholder="eg. explorer@neutron.io" 
            required
          />
          <AuthInput 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            required
          />
          
          <div className="flex items-center justify-end">
            <button 
              type="button"
              onClick={() => {
                setIsResetSent(false);
                setIsForgotModalOpen(true);
              }}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <AuthButton type="submit" isLoading={isLoading}>
            Sign In
          </AuthButton>
        </form>

        <p className="text-center text-white/40 text-sm">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-white font-semibold hover:underline decoration-purple-500 underline-offset-4">
            Create account
          </Link>
        </p>
      </div>

      <AuthModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Password"
      >
        {isResetSent ? (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="text-xl font-bold">Transmission Sent</h4>
            <p className="text-white/60">
              Check your inbox. We've sent instructions to reset your password to your registered email address.
            </p>
            <AuthButton onClick={() => setIsForgotModalOpen(false)}>
              Back to Sign In
            </AuthButton>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-6">
            <p className="text-white/60 text-sm leading-relaxed">
              Enter your email address and we'll send you a cosmic link to reset your credentials.
            </p>
            <AuthInput 
              label="Email Address" 
              type="email" 
              placeholder="eg. explorer@neutron.io" 
              required
            />
            <AuthButton type="submit" isLoading={isLoading} variant="secondary">
              Send Reset Link
            </AuthButton>
          </form>
        )}
      </AuthModal>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
