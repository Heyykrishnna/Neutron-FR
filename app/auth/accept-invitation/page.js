"use client";

import { useState } from "react";
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
} from "@mui/material";
import { Lock } from "lucide-react";
import apiClient from "@/lib/axios";
import { useSnackbar } from "notistack";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Invalid or missing invite token.");
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
      router.push("/admin/auth");
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
      <Box sx={{ width: "100%", maxWidth: 480 }}>
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
        <Card sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!token && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                This invite link is invalid or missing a token.
              </Alert>
            )}

            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting || !token}
              startIcon={submitting && <CircularProgress size={20} />}
            >
              {submitting ? "Setting up..." : "Set Password"}
            </Button>
          </Box>
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

