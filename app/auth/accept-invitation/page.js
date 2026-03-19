"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import { ArrowRight, Mail } from "lucide-react";
import apiClient from "@/lib/axios";
import { useSnackbar } from "notistack";

const fieldStyles = {
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.45)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    letterSpacing: "0.03em",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgba(255,255,255,0.72)",
  },
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    color: "#f3f4f6",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.18)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(255,255,255,0.26)",
    },
  },
};

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
        backgroundColor: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 560 }}>
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            sx={{
              color: "#f4f4f5",
              fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              fontSize: 24,
              letterSpacing: "0.01em",
              mb: 0.75,
            }}
          >
            Accept Invitation
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              letterSpacing: "0.03em",
            }}
          >
            Finish account setup to access the Neutron admin panel.
          </Typography>
        </Box>

        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            boxShadow: "0 18px 44px rgba(0,0,0,0.45)",
          }}
        >
          {validating ? (
            <Box
              sx={{
                py: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <CircularProgress
                size={22}
                sx={{ color: "rgba(255,255,255,0.65)" }}
              />
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.05em",
                }}
              >
                Validating invitation...
              </Typography>
            </Box>
          ) : !isInviteValid ? (
            <Box sx={{ py: 1 }}>
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                {error || "This invitation link is invalid or has expired."}
              </Alert>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.42)",
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
                  height: 44,
                  borderRadius: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  borderColor: "rgba(148,163,184,0.3)",
                  color: "rgba(255,255,255,0.8)",
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
                <Box
                  sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      mb: 0.45,
                    }}
                  >
                    <Mail size={13} color="rgba(255,255,255,0.48)" />
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "0.16em",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      Invited Email
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#f8fafc",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {inviteMeta.email}
                  </Typography>
                </Box>
              )}

              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2, ...fieldStyles }}
              />

              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2, ...fieldStyles }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 1.25, ...fieldStyles }}
              />

              <Typography
                sx={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.34)",
                  fontFamily: "'DM Mono', monospace",
                  mb: 2.2,
                }}
              >
                Password must be at least 8 characters.
              </Typography>

              <Divider
                sx={{ borderColor: "rgba(255,255,255,0.07)", mb: 2.2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={!canSubmit}
                endIcon={submitting ? null : <ArrowRight size={16} />}
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#f8fafc",
                  boxShadow: "none",
                  transition: "all 0.2s",
                  "&:hover": {
                    background: "rgba(255,255,255,0.18)",
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.28)",
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress
                    size={17}
                    sx={{ color: "rgba(255,255,255,0.62)" }}
                  />
                ) : (
                  "Accept Invite"
                )}
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.22)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              letterSpacing: "0.04em",
            }}
          >
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
        backgroundColor: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress
          size={24}
          sx={{ color: "rgba(255,255,255,0.65)", mb: 1.25 }}
        />
        <Typography
          sx={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
          }}
        >
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
