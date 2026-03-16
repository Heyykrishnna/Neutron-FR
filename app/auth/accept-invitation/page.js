"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Avatar,
  TextField,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import { ArrowRight, Lock } from "lucide-react";
import apiClient from "@/lib/axios";
import { useSnackbar } from "notistack";

function AcceptInvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(true);
  const [isInviteValid, setIsInviteValid] = useState(false);
  const [inviteMeta, setInviteMeta] = useState(null);

  useEffect(() => {
    let mounted = true;

    const validateInvite = async () => {
      if (!token) {
        if (!mounted) return;
        setIsInviteValid(false);
        setError("Invalid or missing invite token.");
        setValidating(false);
        return;
      }

      try {
        if (mounted) {
          setValidating(true);
          setError("");
        }

        const { data } = await apiClient.get("/auth/invite/validate", {
          params: { token },
        });

        if (!mounted) return;
        setIsInviteValid(Boolean(data?.data?.valid));
        setInviteMeta(data?.data || null);
      } catch (err) {
        if (!mounted) return;

        const apiMessage = err?.response?.data?.message;
        const normalizedMessage =
          apiMessage === "Invalid invitation token."
            ? "This invitation link is invalid or has already been used."
            : apiMessage || "This invitation link is invalid or has expired.";

        setIsInviteValid(false);
        setInviteMeta(null);
        setError(normalizedMessage);
      } finally {
        if (mounted) setValidating(false);
      }
    };

    validateInvite();

    return () => {
      mounted = false;
    };
  }, [token]);

  const canSubmit = useMemo(
    () => isInviteValid && !submitting && !validating,
    [isInviteValid, submitting, validating],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token || !isInviteValid) {
      setError("This invitation link is invalid or has already been used.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await apiClient.post("/auth/invite/accept", {
        token,
        name: name.trim() || undefined,
        password,
      });

      enqueueSnackbar("Account set up successfully. You can now sign in.", {
        variant: "success",
      });
      router.replace("/admin/auth");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to complete invite.";
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
            }}
          >
            <Lock size={32} />
          </Avatar>
          <Typography
            variant="h4"
            sx={{ color: "#fff", fontWeight: 700, mb: 1 }}
          >
            Set Up Your Account
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create a password to finish activating your account.
          </Typography>
        </Box>

        {/* Card */}
        <Card
          sx={{
            p: 4,
            background: "#0b0b0b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          }}
        >
          {validating ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <CircularProgress size={22} sx={{ color: "#818cf8", mb: 1.25 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                Validating invitation...
              </Typography>
            </Box>
          ) : !isInviteValid ? (
            <Box>
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                {error || "This invitation link is invalid or has expired."}
              </Alert>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'Syne', sans-serif",
                  mb: 2.5,
                }}
              >
                Ask your administrator to send a fresh invitation.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push("/admin/auth")}
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  borderColor: "rgba(148,163,184,0.3)",
                  color: "rgba(226,232,240,0.86)",
                  "&:hover": {
                    borderColor: "rgba(148,163,184,0.55)",
                    background: "rgba(148,163,184,0.08)",
                  },
                }}
              >
                Go to Sign In
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {inviteMeta?.email && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      fontFamily: "'Syne', sans-serif",
                      mb: 0.4,
                    }}
                  >
                    Invited Email
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#f8fafc",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {inviteMeta.email}
                  </Typography>
                </Paper>
              )}

              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    color: "#f3f4f6",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    color: "#f3f4f6",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    color: "#f3f4f6",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!canSubmit}
                endIcon={submitting ? null : <ArrowRight size={16} />}
                sx={{
                  height: 48,
                  borderRadius: "10px",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background:
                    "linear-gradient(135deg, #3356d4 0%, #5577ff 100%)",
                  boxShadow:
                    "0 4px 24px rgba(60,90,220,0.35), 0 0 0 1px rgba(120,160,255,0.15) inset",
                  transition: "all 0.25s",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #3d65e8 0%, #6688ff 100%)",
                    boxShadow:
                      "0 6px 32px rgba(60,90,220,0.5), 0 0 0 1px rgba(140,175,255,0.2) inset",
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(60,80,160,0.25)",
                    color: "rgba(180,200,255,0.3)",
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress
                    size={18}
                    sx={{ color: "rgba(180,210,255,0.6)" }}
                  />
                ) : (
                  "Accept Invite"
                )}
              </Button>
            </Box>
          )}
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#52525b" }}>
            © {new Date().getFullYear()} Neutron. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function AcceptInviteFallback() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress size={24} sx={{ color: "#818cf8", mb: 1.25 }} />
        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          Loading invitation...
        </Typography>
      </Box>
    </Box>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInvitePageContent />
    </Suspense>
  );
}
