"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicLoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/competitions";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login({ email: email.trim(), password });

    if (!result.success) {
      setError(result.error || "Failed to login");
      setSubmitting(false);
      return;
    }

    router.replace(next);
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
          Continue to complete your competition registration.
        </Typography>

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
            href="/auth/signup"
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Create account
          </Link>
        </Typography>
      </Box>
    </Box>
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
