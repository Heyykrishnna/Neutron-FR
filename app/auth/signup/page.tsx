"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
import { AuthInput, AuthButton } from "@/components/auth-components";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useRegister,
  useResendVerificationEmail,
} from "@/src/hooks/api/useAuth";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(false);

  const registerMutation = useRegister();
  const resendMutation = useResendVerificationEmail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    try {
      const response = await registerMutation.mutateAsync({
        name: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        password,
      });

      if (response.success) {
        setIsSignedUp(true);
      } else {
        setSignupError(response.message || "Signup failed. Please try again.");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Signup failed. Please try again.";
      setSignupError(message);
    }
  };

  const handleResendVerification = async () => {
    setResendError("");
    setResendSuccess("");

    try {
      const response = await resendMutation.mutateAsync({
        email: email.trim(),
      });

      if (response.success) {
        setResendSuccess("Verification link has been resent to your email!");
      } else {
        setResendError(
          response.message || "Failed to resend verification link.",
        );
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to resend verification link.";
      setResendError(message);
    }
  };

  return (
    <AuthLayout
      title="Get Started with Us"
      subtitle="Complete these easy steps to register your account and start exploring the Neutron universe."
    >
      <div className="space-y-8">
        {isSignedUp ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 py-4"
          >
            <div className="w-20 h-20 bg-amber-900/20 text-amber-500/80 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-amber-900/20 blur-xl rounded-full animate-pulse" />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 16v6m-3-3l3 3 3-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-4">Verify Your Identity</h2>
              <p className="text-white/60 leading-relaxed font-light">
                A link verification transmission has been sent to your email.
                Please follow the coordinates in the message to initiate your
                launch sequence.
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <AuthButton
                onClick={() =>
                  router.push(
                    "/auth/signin?callbackUrl=" +
                      encodeURIComponent(callbackUrl),
                  )
                }
                variant="primary"
              >
                Go to Sign In
              </AuthButton>
              <div className="space-y-2">
                <button
                  onClick={handleResendVerification}
                  className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer w-full"
                  disabled={resendMutation.isPending}
                >
                  Didn't receive the transmission?{" "}
                  <span className="text-amber-500/80 font-medium">
                    Resend link
                  </span>
                </button>
                {resendSuccess && (
                  <p className="text-sm text-green-400">{resendSuccess}</p>
                )}
                {resendError && (
                  <p className="text-sm text-red-400">{resendError}</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <div>
              <h2 className="text-3xl font-bold mb-2">Sign Up Account</h2>
              <p className="text-white/50">
                Enter your personal data to create your account.
              </p>
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
                <span>Sign up with Google</span>
              </AuthButton>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-4 text-white/40 tracking-widest">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <AuthInput
                  label="First Name"
                  type="text"
                  placeholder="eg. John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <AuthInput
                  label="Last Name"
                  type="text"
                  placeholder="eg. Francisco"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <AuthInput
                label="Email Address"
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AuthInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <p className="text-xs text-white/30 ml-1">
                Must be at least 8 characters.
              </p>

              {signupError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                  {signupError}
                </div>
              )}

              <AuthButton
                type="submit"
                isLoading={registerMutation.isPending}
                variant="primary"
                disabled={registerMutation.isPending}
              >
                Sign Up
              </AuthButton>
            </form>

            <p className="text-center text-white/40 text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-white font-semibold hover:underline decoration-amber-700/50 underline-offset-4"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-8 h-8 border-2 border-amber-900/20 border-t-amber-700 rounded-full animate-spin" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
