"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import apiClient from "@/lib/axios";

export default function PublicSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiClient.post("/auth/register", {
        name: name.trim() || undefined,
        email: email.trim(),
        password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

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
          Signup
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.4)", fontSize: 13, mb: 2.2 }}
        >
          Create your account. You must verify email before registration.
        </Typography>

        {success ? (
          <Box>
            <Typography sx={{ color: "#4ade80", fontSize: 13, mb: 1.4 }}>
              Account created. Check your email to verify, then login.
            </Typography>
            <Link
              href="/auth/login"
              style={{ color: "#c084fc", textDecoration: "none" }}
            >
              Go to login
            </Link>
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "grid", gap: 1.3 }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              style={inputStyle}
            />
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
              minLength={8}
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
              {submitting ? "Creating..." : "Create account"}
            </button>

            <Typography
              sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mt: 0.6 }}
            >
              Already have an account?{" "}
              <Link
                href="/auth/login"
                style={{ color: "#c084fc", textDecoration: "none" }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        )}
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
