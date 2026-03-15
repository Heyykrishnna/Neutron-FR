"use client";

import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  SnackbarProvider,
  MaterialDesignContent,
  closeSnackbar,
} from "notistack";
import { styled } from "@mui/material";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "./QueryProvider";
import { theme } from "@/src/theme";
import EmotionRegistry from "./EmotionRegistry";

const base = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "0.02em",
  borderRadius: "10px",
  padding: "11px 14px",
  minWidth: "300px",
  maxWidth: "400px",
  backdropFilter: "blur(16px)",
  background: "rgba(10,10,10,0.93)",
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
  color: "rgba(255,255,255,0.82)",
  "& #notistack-snackbar": { padding: 0, gap: "10px" },
};

const StyledContent = styled(MaterialDesignContent)(() => ({
  "&.notistack-MuiContent-success": {
    ...base,
    border: "1px solid rgba(74,222,128,0.18)",
    "& #notistack-snackbar svg:first-of-type": {
      color: "#4ade80",
      flexShrink: 0,
    },
  },
  "&.notistack-MuiContent-error": {
    ...base,
    border: "1px solid rgba(248,113,113,0.18)",
    "& #notistack-snackbar svg:first-of-type": {
      color: "#f87171",
      flexShrink: 0,
    },
  },
  "&.notistack-MuiContent-warning": {
    ...base,
    border: "1px solid rgba(251,191,36,0.18)",
    "& #notistack-snackbar svg:first-of-type": {
      color: "#fbbf24",
      flexShrink: 0,
    },
  },
  "&.notistack-MuiContent-info": {
    ...base,
    border: "1px solid rgba(255,255,255,0.09)",
    "& #notistack-snackbar svg:first-of-type": {
      color: "rgba(255,255,255,0.4)",
      flexShrink: 0,
    },
  },
}));

const iconProps = { size: 15, strokeWidth: 2 };

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={4}
          autoHideDuration={3500}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          Components={{
            success: StyledContent,
            error: StyledContent,
            warning: StyledContent,
            info: StyledContent,
          }}
          iconVariant={{
            success: <CheckCircle {...iconProps} />,
            error: <XCircle {...iconProps} />,
            warning: <AlertTriangle {...iconProps} />,
            info: <Info {...iconProps} />,
          }}
          action={(id) => (
            <button
              onClick={() => closeSnackbar(id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 2px 2px 8px",
                display: "flex",
                alignItems: "center",
                color: "rgba(255,255,255,0.22)",
                marginLeft: "auto",
                flexShrink: 0,
                lineHeight: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.22)")
              }
            >
              <X size={12} />
            </button>
          )}
        >
          <AuthProvider>{children}</AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
      </EmotionRegistry>
    </QueryProvider>
  );
}
