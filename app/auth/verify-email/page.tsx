"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth-layout";
import { AuthButton } from "@/components/auth-components";
import { motion } from "framer-motion";
import { useVerifyEmail } from "@/src/hooks/api/useAuth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationErrorKind, setVerificationErrorKind] = useState<
    "generic" | "missing-token" | "invalid-token" | "expired-token"
  >("generic");

  const verifyMutation = useVerifyEmail();

  const classifyVerificationError = (message: string) => {
    const normalized = message.toLowerCase();

    if (
      normalized.includes("expired") ||
      normalized.includes("no longer valid")
    ) {
      return "expired-token" as const;
    }

    if (
      normalized.includes("invalid verification token") ||
      normalized.includes("invalid token") ||
      normalized.includes("required")
    ) {
      return "invalid-token" as const;
    }

    return "generic" as const;
  };

  useEffect(() => {
    if (!token) {
      setVerificationErrorKind("missing-token");
      setVerificationError(
        "No verification token provided. Please check your email link.",
      );
      setVerificationAttempted(true);
      return;
    }

    if (verificationAttempted) return;

    const performVerification = async () => {
      try {
        setVerificationAttempted(true);
        const response = await verifyMutation.mutateAsync({ token });

        if (response.success) {
          setVerificationSuccess(true);
          setTimeout(() => {
            router.push("/auth/signin");
          }, 2000);
        } else {
          setVerificationErrorKind(
            classifyVerificationError(response.message || ""),
          );
          setVerificationError(
            response.message || "Verification failed. Please try again.",
          );
        }
      } catch (error: any) {
        const apiError = error?.response?.data?.error;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred during verification. Please try again.";

        if (
          apiError === "EMAIL_ALREADY_VERIFIED" ||
          message.toLowerCase().includes("already verified")
        ) {
          setVerificationSuccess(true);
          setTimeout(() => {
            router.push("/auth/signin");
          }, 2000);
          return;
        }

        setVerificationErrorKind(classifyVerificationError(message));
        setVerificationError(message);
      }
    };

    performVerification();
  }, [token, verificationAttempted, verifyMutation]);

  const handleRetry = () => {
    if (!token) return;
    setVerificationAttempted(false);
    setVerificationError("");
    setVerificationSuccess(false);
    setVerificationErrorKind("generic");
  };

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Completing your account verification..."
    >
      <div className="space-y-8">
        {verifyMutation.isPending ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
              <svg
                className="animate-spin"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Verifying Email</h2>
              <p className="text-white/60 text-sm">
                Please wait while we confirm your email address...
              </p>
            </div>
          </motion.div>
        ) : verificationSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline
                  points="20 6 9 17 4 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Email Verified!</h2>
              <p className="text-white/60 leading-relaxed font-light">
                Your email has been successfully verified. Redirecting to sign
                in...
              </p>
            </div>
            <div className="pt-4">
              <AuthButton
                onClick={() => router.push("/auth/signin")}
                variant="primary"
              >
                Go to Sign In
              </AuthButton>
            </div>
          </motion.div>
        ) : verificationError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {verificationErrorKind === "expired-token"
                  ? "Link Expired"
                  : verificationErrorKind === "invalid-token" ||
                      verificationErrorKind === "missing-token"
                    ? "Invalid Verification Link"
                    : "Verification Failed"}
              </h2>
              <p className="text-white/60 leading-relaxed font-light mb-4">
                {verificationErrorKind === "expired-token"
                  ? "This verification link has expired. Request a new one from sign up."
                  : verificationErrorKind === "invalid-token"
                    ? "This verification link is not valid anymore. It may have already been used or was copied incorrectly."
                    : verificationErrorKind === "missing-token"
                      ? "The verification link is missing its token. Please open the email link again."
                      : null}
                {verificationError}
              </p>
            </div>
            <div className="pt-4 space-y-3">
              {verificationErrorKind === "generic" && (
                <AuthButton
                  onClick={handleRetry}
                  variant="primary"
                  disabled={verifyMutation.isPending}
                >
                  Try Again
                </AuthButton>
              )}
              {verificationErrorKind !== "generic" && (
                <AuthButton
                  onClick={() => router.push("/auth/signup")}
                  variant="primary"
                >
                  Back to Sign Up
                </AuthButton>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full animate-pulse" />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 9v2m0 4v2m-9-7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Invalid Verification Link
              </h2>
              <p className="text-white/60 leading-relaxed font-light mb-4">
                The verification link is invalid or expired. Please request a
                new one.
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={() => router.push("/auth/signup")}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors"
              >
                Back to Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
