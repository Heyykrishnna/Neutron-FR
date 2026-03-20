"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildAuthPageHref,
  clearAuthContinuation,
  getAuthContinuation,
  setAuthContinuation,
} from "@/src/lib/authContinuation";

function PublicLoginPageContent() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryNext = searchParams.get("next") || "";
  const queryForceLogin = searchParams.get("forceLogin") === "1";
  const continuation = useMemo(() => getAuthContinuation(), []);
  const next = queryNext || continuation.next || "/competitions";
  const forceLogin = queryForceLogin || continuation.forceLogin;
  const signupHref = useMemo(() => {
    return buildAuthPageHref("/auth/signup", { next, forceLogin });
  }, [next, forceLogin]);

  useEffect(() => {
    setAuthContinuation({ next, forceLogin });
  }, [next, forceLogin]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [resendSubmitting, setResendSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const showInviteContinuationChip = next.startsWith("/team-invite/");

  useEffect(() => {
    if (!loading && user && !forceLogin) {
      router.replace(next);
    }
  }, [loading, user, router, next, forceLogin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setErrorCode("");
    setResendMessage("");
    setResendError("");

    const result = await login({ email: email.trim(), password });

    if (!result.success) {
      setErrorCode(result.errorCode || "");
      setError(result.error || "Failed to login");
      setSubmitting(false);
      return;
    }

    clearAuthContinuation();
    router.replace(next);
  };

  const handleResendVerification = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setResendError("Enter your email to resend verification.");
      return;
    }

    try {
      setResendSubmitting(true);
      setResendError("");
      setResendMessage("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}/api/v1/auth/resend-verification-public`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setResendError(data?.message || "Failed to resend verification email.");
        return;
      }

      setResendMessage(
        data?.message ||
          "If your account needs verification, we sent a verification email.",
      );
    } catch (resendVerificationError) {
      setResendError(
        resendVerificationError?.message ||
          "Failed to resend verification email.",
      );
    } finally {
      setResendSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#050505",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          background: "#0c0c0c",
          p: 3,
        }}
      >
        <Typography
          sx={{ color: "#f4f4f5", fontSize: 24, fontWeight: 700, mb: 0.5 }}
        >
          Login
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13, mb: 2.2 }}
        >
          {forceLogin
            ? "Sign in with the account that received the invite."
            : "Continue to complete your competition registration."}
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.62)", fontSize: 12, mb: 1 }}
        >
          After sign in, you’ll continue to your team invite.
        </Typography>
        {showInviteContinuationChip && (
          <Typography
            sx={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid rgba(192,132,252,0.4)",
              borderRadius: 999,
              px: 1,
              py: 0.3,
              color: "#c084fc",
              fontSize: 11,
              mb: 1.6,
            }}
          >
            Continuing to: Team Invite
          </Typography>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "grid", gap: 1.3 }}
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />

          {error && (
            <Typography sx={{ color: "#f87171", fontSize: 12 }}>
              {error}
            </Typography>
          )}

          {errorCode === "EMAIL_NOT_VERIFIED" && (
            <>
              <button
                type="button"
                disabled={resendSubmitting}
                onClick={handleResendVerification}
                style={secondaryButtonStyle(resendSubmitting)}
              >
                {resendSubmitting
                  ? "Resending..."
                  : "Resend verification email"}
              </button>

              {resendMessage && (
                <Typography sx={{ color: "#4ade80", fontSize: 12 }}>
                  {resendMessage}
                </Typography>
              )}

              {resendError && (
                <Typography sx={{ color: "#f87171", fontSize: 12 }}>
                  {resendError}
                </Typography>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={buttonStyle(submitting)}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </Box>

        <Typography
          sx={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            mt: 2,
            textAlign: "center",
          }}
        >
          New here?{" "}
          <Link
            href={signupHref}
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Create account
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

function LoginPageFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={24} sx={{ color: "#a855f7" }} />
    </Box>
  );
}

export default function PublicLoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <PublicLoginPageContent />
    </Suspense>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "#f4f4f5",
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle = (disabled) => ({
  border: "1px solid rgba(168,85,247,0.35)",
  borderRadius: 10,
  padding: "10px 16px",
  background: disabled
    ? "rgba(71,85,105,0.3)"
    : "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
  color: disabled ? "rgba(255,255,255,0.4)" : "#fff",
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: disabled ? "not-allowed" : "pointer",
  marginTop: 4,
});

const secondaryButtonStyle = (disabled) => ({
  border: "1px solid rgba(192,132,252,0.35)",
  borderRadius: 10,
  padding: "9px 14px",
  background: "transparent",
  color: disabled ? "rgba(255,255,255,0.4)" : "#c084fc",
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  cursor: disabled ? "not-allowed" : "pointer",
});
