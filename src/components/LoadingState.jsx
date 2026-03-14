"use client";

import { Box, CircularProgress, Skeleton, Typography } from "@mui/material";

export function LoadingState({ variant = "spinner", lines = 3, message }) {
  if (variant === "skeleton") {
    return (
      <Box sx={{ width: "100%" }}>
        {[...Array(lines)].map((_, index) => (
          <Skeleton key={index} height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress />
      {message && (
        <Typography color="textSecondary" variant="body2">
          {message}
        </Typography>
      )}
    </Box>
  );
}
