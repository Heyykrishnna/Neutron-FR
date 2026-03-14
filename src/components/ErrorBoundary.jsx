"use client";

import { Component } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            backgroundColor: "#000",
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
            <Box
              sx={{
                display: "inline-flex",
                p: 2,
                borderRadius: 2,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                mb: 2,
              }}
            >
              <AlertTriangle size={40} color="#ef4444" />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Something went wrong
            </Typography>
            <Typography color="textSecondary" paragraph>
              We encountered an unexpected error. Please try refreshing the
              page.
            </Typography>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: "#18181b",
                  borderRadius: 2,
                  fontFamily: "monospace",
                  textAlign: "left",
                  overflow: "auto",
                }}
              >
                {this.state.error.toString()}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 3 }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
