"use client";

import React, { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth-layout";
import { AuthInput, AuthButton } from "@/components/auth-components";
import { useResetPassword } from "@/src/hooks/api/useAuth";
import { motion, AnimatePresence } from "framer-motion";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const resetMutation = useResetPassword();

  const isInvalid = useMemo(() => {
    return !password || !confirmPassword || password !== confirmPassword || password.length < 8;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing or invalid. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await resetMutation.mutateAsync({
        token,
        password,
      });

      if (response.success) {
        setIsSuccess(true);
        setSuccessMessage(response.message || "Your password has been successfully reset.");
      } else {
        setError(response.message || "Failed to reset password. The link may have expired.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "An error occurred. Please try again.");
    }
  };

  if (!token && !isSuccess) {
    return (
      <AuthLayout
        title="Invalid Link"
        subtitle="The transmission link seems to be broken or corrupted."
      >
        <div className="text-center space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            Reset token is missing. Please request a new password reset link from the sign-in page.
          </div>
          <Link href="/auth/signin">
            <AuthButton variant="secondary">Back to Sign In</AuthButton>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Establish your new credentials to regain access to the Neutron network."
    >
      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-4"
            >
              <div className="w-20 h-20 bg-green-900/20 text-green-500/80 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-green-900/20 blur-xl rounded-full animate-pulse" />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4">Credentials Updated</h2>
                <p className="text-white/60 leading-relaxed font-light">
                  {successMessage} You can now proceed to log in with your new password.
                </p>
              </div>
              <Link href="/auth/signin">
                <AuthButton variant="primary">Proceed to Sign In</AuthButton>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">New Security Phase</h2>
                <p className="text-white/50">Enter a secure new password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AuthInput
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <AuthInput
                  label="Confirm New Password"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <AuthButton
                  type="submit"
                  isLoading={resetMutation.isPending}
                  disabled={isInvalid || resetMutation.isPending}
                  variant="primary"
                >
                  Finalize Reset
                </AuthButton>
              </form>

              <p className="text-center text-white/40 text-sm">
                Remember your password?{" "}
                <Link href="/auth/signin" className="text-white font-semibold hover:underline decoration-amber-700/50 underline-offset-4">
                  Log in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-8 h-8 border-2 border-amber-900/20 border-t-amber-700 rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
