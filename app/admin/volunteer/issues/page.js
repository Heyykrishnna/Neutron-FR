"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useCreateIssue } from "@/src/hooks/api/useIssues";

const sy = { fontFamily: "'Syne', sans-serif" };

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.75)" },
    "& textarea": {
      color: "rgba(255,255,255,0.9)",
      fontFamily: "'Syne', sans-serif",
      fontSize: 13,
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.38)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    "&.Mui-focused": { color: "rgba(192,132,252,0.95)" },
  },
};

export default function VolunteerIssuesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { mutateAsync: createIssue, isPending } = useCreateIssue();

  const [message, setMessage] = useState("");
  // session-local history (backend list endpoint is DH/SA only)
  const [submitted, setSubmitted] = useState([]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      enqueueSnackbar("Please describe the issue before submitting", {
        variant: "warning",
      });
      return;
    }
    if (trimmed.length < 10) {
      enqueueSnackbar("Message too short — please provide more detail", {
        variant: "warning",
      });
      return;
    }
    try {
      await createIssue({ message: trimmed });
      setSubmitted((prev) => [
        { message: trimmed, sentAt: new Date() },
        ...prev,
      ]);
      setMessage("");
      enqueueSnackbar("Issue escalated to Department Head", {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit issue",
        { variant: "error" },
      );
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={15} color="#fbbf24" />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", ...sy }}
            >
              Escalate Issue
            </Typography>
            <Typography
              sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", ...sy }}
            >
              Report a problem to your Department Head
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          href="/admin/volunteer"
          variant="outlined"
          size="small"
          startIcon={<ArrowLeft size={13} />}
          sx={{
            textTransform: "none",
            borderColor: "rgba(255,255,255,0.15)",
            color: "#a1a1aa",
            ...sy,
          }}
        >
          Back
        </Button>
      </Box>

      {/* Info banner */}
      <Alert
        severity="info"
        icon={<Info size={14} />}
        sx={{
          mb: 3,
          background: "rgba(56,189,248,0.07)",
          border: "1px solid rgba(56,189,248,0.15)",
          color: "#7dd3fc",
          "& .MuiAlert-icon": { color: "#38bdf8" },
          "& .MuiAlert-message": sy,
          ...sy,
          fontSize: 12,
        }}
      >
        Issues are escalated directly to your Department Head and SA. Be
        specific — describe what happened, where, and any relevant participant
        details.
      </Alert>

      {/* Form */}
      <Paper
        sx={{
          p: 2.5,
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.22)",
            mb: 1.5,
            ...sy,
          }}
        >
          New Issue
        </Typography>

        <TextField
          multiline
          minRows={5}
          maxRows={12}
          fullWidth
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the issue clearly — include location, participant info, or any relevant context…"
          sx={{ ...inputSx, mb: 1.5 }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)", ...sy }}
          >
            {message.trim().length} / 1000 characters
          </Typography>
          <Button
            variant="contained"
            disabled={isPending || message.trim().length < 10}
            onClick={handleSubmit}
            startIcon={
              isPending ? (
                <CircularProgress size={13} sx={{ color: "#fff" }} />
              ) : (
                <AlertTriangle size={13} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: 12,
              ...sy,
              backgroundColor: "#b45309",
              "&:hover": { backgroundColor: "#92400e" },
              "&.Mui-disabled": {
                backgroundColor: "#27272a",
                color: "#52525b",
              },
            }}
          >
            {isPending ? "Submitting…" : "Submit Issue"}
          </Button>
        </Box>
      </Paper>

      {/* Session history */}
      {submitted.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              mb: 1.5,
              ...sy,
            }}
          >
            Submitted This Session
          </Typography>
          <Stack spacing={1.25}>
            {submitted.map((item, idx) => (
              <Paper
                key={idx}
                sx={{
                  p: 2,
                  background: "#0c0c0c",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 0.75,
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <CheckCircle2 size={13} color="#4ade80" />
                    <Typography sx={{ fontSize: 11, color: "#4ade80", ...sy }}>
                      Escalated
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Clock size={11} color="rgba(255,255,255,0.25)" />
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.25)",
                        ...sy,
                      }}
                    >
                      {item.sentAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Divider
                  sx={{ mb: 0.75, borderColor: "rgba(255,255,255,0.05)" }}
                />
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    ...sy,
                    lineHeight: 1.65,
                  }}
                >
                  {item.message}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
