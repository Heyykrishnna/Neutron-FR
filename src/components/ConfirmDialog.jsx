"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress,
} from "@mui/material";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  severity = "info",
}) {
  const getConfirmStyles = () => {
    switch (severity) {
      case "error":
      case "danger":
        return {
          background: "rgba(239,68,68,0.9)",
          border: "1px solid rgba(239,68,68,0.5)",
          color: "#fff",
          hover: "rgba(220,38,38,0.95)",
          spinner: "#fff",
        };
      case "warning":
        return {
          background: "rgba(245,158,11,0.85)",
          border: "1px solid rgba(245,158,11,0.45)",
          color: "#111",
          hover: "rgba(217,119,6,0.9)",
          spinner: "#111",
        };
      case "success":
        return {
          background: "rgba(34,197,94,0.85)",
          border: "1px solid rgba(34,197,94,0.45)",
          color: "#fff",
          hover: "rgba(22,163,74,0.9)",
          spinner: "#fff",
        };
      default:
        return {
          background: "rgba(168,85,247,0.85)",
          border: "1px solid rgba(168,85,247,0.45)",
          color: "#fff",
          hover: "rgba(147,51,234,0.9)",
          spinner: "#fff",
        };
    }
  };

  const confirmStyles = getConfirmStyles();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#f4f4f5",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          pb: 1.5,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        <DialogContentText
          sx={{
            color: "rgba(255,255,255,0.65)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            px: 2,
            "&:hover": {
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.2)",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          endIcon={
            loading ? (
              <CircularProgress
                size={14}
                sx={{ color: confirmStyles.spinner }}
              />
            ) : null
          }
          sx={{
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            borderRadius: "8px",
            px: 2,
            background: confirmStyles.background,
            border: confirmStyles.border,
            color: confirmStyles.color,
            "&:hover": {
              background: confirmStyles.hover,
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
