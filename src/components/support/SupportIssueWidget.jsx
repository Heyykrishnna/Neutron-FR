"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { LifeBuoy, X, Send } from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateIssue } from "@/src/hooks/api/useIssues";

export default function SupportIssueWidget() {
  const { user, loading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { mutateAsync: createIssue, isPending } = useCreateIssue();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (loading || !user) return null;

  const handleSubmit = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      enqueueSnackbar("Please describe your issue", { variant: "warning" });
      return;
    }

    if (trimmed.length < 10) {
      enqueueSnackbar("Please provide a little more detail", {
        variant: "warning",
      });
      return;
    }

    try {
      await createIssue({ message: trimmed });
      setMessage("");
      setOpen(false);
      enqueueSnackbar("Issue submitted to support queue", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to submit issue",
        { variant: "error" },
      );
    }
  };

  return (
    <>
      {open && (
        <Box
          sx={{
            position: "fixed",
            right: { xs: 12, sm: 16 },
            bottom: { xs: 74, sm: 82 },
            width: { xs: "calc(100vw - 24px)", sm: 360 },
            maxWidth: 360,
            zIndex: 1350,
            background: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.55)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 1.75,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              sx={{
                color: "#f4f4f5",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Support Request
            </Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              disabled={isPending}
              sx={{ color: "rgba(255,255,255,0.45)" }}
            >
              <X size={14} />
            </IconButton>
          </Box>

          <Box sx={{ p: 1.75 }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                mb: 1,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Submit your issue. DH and SA can review it in the Issues
              dashboard.
            </Typography>

            <TextField
              multiline
              minRows={4}
              maxRows={8}
              fullWidth
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe your issue..."
              disabled={isPending}
              sx={{
                mb: 1.25,
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.9)",
                  borderRadius: "8px",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 13,
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.18)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(168,85,247,0.75)",
                  },
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {message.trim().length} / 1000
              </Typography>

              <Button
                onClick={handleSubmit}
                disabled={isPending || message.trim().length < 10}
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  background: "linear-gradient(90deg, #a855f7, #7c3aed)",
                  minWidth: 126,
                  "&:hover": {
                    background: "linear-gradient(90deg, #9333ea, #6d28d9)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(255,255,255,0.14)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
                startIcon={
                  isPending ? (
                    <CircularProgress size={12} sx={{ color: "#fff" }} />
                  ) : (
                    <Send size={12} />
                  )
                }
              >
                {isPending ? "Sending..." : "Submit"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Button
        onClick={() => setOpen((prev) => !prev)}
        variant="contained"
        sx={{
          position: "fixed",
          right: { xs: 12, sm: 16 },
          bottom: { xs: 14, sm: 16 },
          zIndex: 1351,
          borderRadius: "999px",
          textTransform: "none",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: 12,
          px: 1.6,
          py: 0.9,
          minWidth: "unset",
          background: open
            ? "rgba(255,255,255,0.16)"
            : "linear-gradient(90deg, #a855f7, #7c3aed)",
          color: "#fff",
          border: open
            ? "1px solid rgba(255,255,255,0.28)"
            : "1px solid rgba(168,85,247,0.45)",
          "&:hover": {
            background: open
              ? "rgba(255,255,255,0.22)"
              : "linear-gradient(90deg, #9333ea, #6d28d9)",
          },
        }}
        startIcon={<LifeBuoy size={14} />}
      >
        Support
      </Button>
    </>
  );
}
