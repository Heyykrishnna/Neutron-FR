"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "@/lib/axios";

export default function PublicVerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!token) {
        if (!mounted) return;
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        if (mounted) {
          setStatus("loading");
          setMessage("");
        }

        const { data } = await apiClient.get("/auth/verify-email", {
          params: { token },
        });

        if (!mounted) return;
        setStatus("success");
        setMessage(data?.message || "Email verified successfully.");
      } catch (error) {
        if (!mounted) return;

        const apiMessage = error?.response?.data?.message;
        const code = error?.response?.data?.error;

        if (code === "EMAIL_ALREADY_VERIFIED") {
          setStatus("success");
          setMessage(apiMessage || "Email is already verified.");
          return;
        }

        setStatus("error");
        setMessage(apiMessage || "Email verification failed.");
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [token]);

  const isSuccess = useMemo(() => status === "success", [status]);

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
          maxWidth: 460,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          background: "#0c0c0c",
          p: 3,
          textAlign: "center",
        }}
      >
        {status === "loading" ? (
          <>
            <CircularProgress size={28} sx={{ color: "#a855f7", mb: 1.25 }} />
            <Typography
              sx={{ color: "#f4f4f5", fontSize: 18, fontWeight: 600 }}
            >
              Verifying your email
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.42)", fontSize: 13, mt: 0.8 }}
            >
              Please wait while we confirm your token.
            </Typography>
          </>
        ) : (
          <>
            {isSuccess ? (
              <CheckCircle2
                size={34}
                color="#4ade80"
                style={{ marginBottom: 10 }}
              />
            ) : (
              <AlertCircle
                size={34}
                color="#f87171"
                style={{ marginBottom: 10 }}
              />
            )}
            <Typography
              sx={{
                color: "#f4f4f5",
                fontSize: 20,
                fontWeight: 700,
                mb: 0.9,
              }}
            >
              {isSuccess ? "Email Verified" : "Verification Failed"}
            </Typography>
            <Typography
              sx={{
                color: isSuccess ? "rgba(74,222,128,0.92)" : "#f87171",
                fontSize: 13,
                mb: 2,
              }}
            >
              {message}
            </Typography>

            <Link href="/auth/login" style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  border: "1px solid rgba(168,85,247,0.35)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  background:
                    "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
                  color: "#fff",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Go to Login
              </button>
            </Link>
          </>
        )}
      </Box>
    </Box>
  );
}
