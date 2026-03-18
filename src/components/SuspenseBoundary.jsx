"use client";

import { Suspense } from "react";
import { Box, Skeleton, Paper } from "@mui/material";

/**
 * Loading fallback for a card/panel section
 */
export function CardSkeleton({ count = 1, height = 120 }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[...Array(count)].map((_, i) => (
        <Paper
          key={i}
          sx={{ p: 2, bg: "rgba(255,255,255,0.04)", borderRadius: 2 }}
        >
          <Skeleton height={height} sx={{ mb: 1 }} />
          <Skeleton height={40} width="60%" />
        </Paper>
      ))}
    </Box>
  );
}

/**
 * Loading fallback for a table
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <Box sx={{ width: "100%" }}>
      {[...Array(rows)].map((_, i) => (
        <Box key={i} sx={{ display: "flex", gap: 1, mb: 1.5 }}>
          {[...Array(columns)].map((_, j) => (
            <Skeleton key={j} height={40} sx={{ flex: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Loading fallback for list items
 */
export function ListSkeleton({ count = 3 }) {
  return (
    <Box sx={{ width: "100%" }}>
      {[...Array(count)].map((_, i) => (
        <Box key={i} sx={{ mb: 2 }}>
          <Skeleton height={20} width="40%" sx={{ mb: 1 }} />
          <Skeleton height={16} width="80%" />
          <Skeleton height={16} width="70%" sx={{ mt: 0.5 }} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Loading fallback for form/details section
 */
export function FormSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Skeleton height={40} />
      <Skeleton height={40} />
      <Skeleton height={100} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton height={40} width="30%" />
        <Skeleton height={40} width="30%" />
      </Box>
    </Box>
  );
}

/**
 * Generic Suspense boundary wrapper
 * Usage: <SuspenseBoundary fallback={<CardSkeleton />}><YourAsyncComponent /></SuspenseBoundary>
 */
export function SuspenseBoundary({
  children,
  fallback = <CardSkeleton />,
  name = "Content",
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Suspense boundary for page layout sections
 * Wraps multiple related content areas with a single fallback
 */
export function SectionSuspense({ children, fallback = null }) {
  return (
    <Suspense fallback={fallback || <CardSkeleton />}>{children}</Suspense>
  );
}
