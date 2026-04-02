"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth-layout";
import { AuthInput, AuthButton } from "@/components/auth-components";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthMe, useRequestPasswordReset } from "@/src/hooks/api/useAuth";

const normalizeAuthResponseUser = (payload: any) => {
  if (payload?.data?.user) return payload.data.user;
  if (payload?.user) return payload.user;
  return payload;
};

function SignInContent() {
  const router = useRouter();
  const { login, logout, checkAuth } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authStatus = searchParams.get("auth");
  const authReason = searchParams.get("reason");
  const forceLogin = searchParams.get("forceLogin") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isForceLogoutPending, setIsForceLogoutPending] = useState(false);

  const authMeQuery = useAuthMe();
  const requestResetMutation = useRequestPasswordReset();

  useEffect(() => {
    if (!forceLogin && authMeQuery.data) {
      router.replace(callbackUrl);
    }
  }, [forceLogin, authMeQuery.data, callbackUrl, router]);

  useEffect(() => {
    if (!forceLogin) return;
    if (!authMeQuery.data) return;
    if (isForceLogoutPending) return;

    const forceSignOut = async () => {
      setIsForceLogoutPending(true);
      try {
        await logout();
      } finally {
        setIsForceLogoutPending(false);
      }
    };

    forceSignOut();
  }, [forceLogin, authMeQuery.data, isForceLogoutPending, logout]);

  useEffect(() => {
    if (authStatus === "failed") {
      const reason = authReason
        ? decodeURIComponent(authReason).replace(/_/g, " ")
        : "Google sign-in failed";
      setLoginError(reason);
      return;
    }

    if (authStatus === "success") {
      checkAuth();
      authMeQuery.refetch();
    }
  }, [authReason, authStatus, authMeQuery, checkAuth]);

  const isRequestingReset = requestResetMutation.isPending;
  const submitDisabled = useMemo(
    () => isSigningIn || !email.trim() || !password,
    [isSigningIn, email, password],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      setIsSigningIn(true);

      const payload = await login({
        email: email.trim(),
        password,
      });
      const user = normalizeAuthResponseUser(payload);

      if (!user) {
        throw new Error("Login failed. Please try again.");
      }

      router.replace(callbackUrl);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password.";
      setLoginError(message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await requestResetMutation.mutateAsync({
        email: forgotEmail.trim(),
      });
      setResetMessage(
        response?.message ||
          "If the email exists, a password reset link has been sent.",
      );
      setIsResetSent(true);
    } catch (error: any) {
      setResetMessage(
        error?.response?.data?.message ||
          "If the email exists, a password reset link has been sent.",
      );
      setIsResetSent(true);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, "");
    const oauthBaseUrl = normalizedBackendUrl.endsWith("/api/v1")
      ? normalizedBackendUrl
      : `${normalizedBackendUrl}/api/v1`;
    const signinReturnUrl = `${window.location.origin}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}${forceLogin ? "&forceLogin=1" : ""}`;
    const redirectUrl = encodeURIComponent(signinReturnUrl);

    window.location.href = `${oauthBaseUrl}/auth/google?redirect=${redirectUrl}`;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="The universe is waiting for you. Sign in to continue your journey through the stars."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Sign In Account</h2>
          <p className="text-white/50">
            Enter your credentials to access your workspace.
          </p>
        </div>

        {forceLogin ? (
          <p className="text-sm text-amber-300 border border-amber-300/20 bg-amber-500/10 rounded-xl px-3 py-2">
            Switching account for this team invite. Please sign in with the
            invited email.
          </p>
        ) : null}

        {forceLogin && isForceLogoutPending ? (
          <p className="text-xs text-white/55">
            Signing out current session...
          </p>
        ) : null}

        <div className="space-y-4">
          <AuthButton
            variant="outline"
            className="w-full flex items-center justify-center space-x-3"
            onClick={handleGoogleLogin}
            type="button"
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

        {loginError ? (
          <p className="text-sm text-red-400 border border-red-400/20 bg-red-500/10 rounded-xl px-3 py-2">
            {loginError}
          </p>
        ) : null}

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
          <AuthInput
            label="Email Address"
            type="email"
            placeholder="eg. explorer@neutron.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setResetMessage("");
                setIsResetSent(false);
                setIsForgotModalOpen(true);
              }}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <AuthButton
            type="submit"
            isLoading={isSigningIn}
            disabled={submitDisabled}
          >
            Sign In
          </AuthButton>
        </form>

        <p className="text-center text-white/40 text-sm">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-white font-semibold hover:underline decoration-purple-500 underline-offset-4"
          >
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
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 4L12 14.01l-3-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h4 className="text-xl font-bold">Transmission Sent</h4>
            <p className="text-white/60">
              {resetMessage ||
                "If the email exists, a password reset link has been sent."}
            </p>
            <AuthButton onClick={() => setIsForgotModalOpen(false)}>
              Back to Sign In
            </AuthButton>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-6">
            <p className="text-white/60 text-sm leading-relaxed">
              Enter your email address and we'll send you a cosmic link to reset
              your credentials.
            </p>
            <AuthInput
              label="Email Address"
              type="email"
              placeholder="eg. explorer@neutron.io"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <AuthButton
              type="submit"
              isLoading={isRequestingReset}
              disabled={isRequestingReset || !forgotEmail.trim()}
              variant="secondary"
            >
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
