"use client";

import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import {
  EVENT_TYPES,
  COMPETITION_TYPES,
  STATUS_OPTS,
} from "../competitionSchemas";

// ── Shared primitive styles matching audit/approvals design language ─────────

export const inputCss = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "rgba(255,255,255,0.85)",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

export const selectCss = {
  ...inputCss,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

export function FieldLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 9.5,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)",
        fontFamily: "'Syne', sans-serif",
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return (
    <Typography
      sx={{
        fontSize: 11,
        color: "#f87171",
        mt: 0.5,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {message}
    </Typography>
  );
}

export function FieldGroup({ label, error, children, span = 1 }) {
  return (
    <Box sx={{ gridColumn: `span ${span}` }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      <FieldError message={error?.message} />
    </Box>
  );
}

// ── Step Component ────────────────────────────────────────────────────────────

export default function CompetitionBasicInfoStep({ control, errors }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2.5,
      }}
    >
      {/* Title — full width */}
      <FieldGroup label="Title *" error={errors.title} span={2}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="e.g. Code Sprint 2025"
              style={{
                ...inputCss,
                borderColor: errors.title
                  ? "rgba(248,113,113,0.5)"
                  : "rgba(255,255,255,0.1)",
              }}
            />
          )}
        />
      </FieldGroup>

      {/* Short Description — full width */}
      <FieldGroup
        label="Short Description"
        error={errors.shortDescription}
        span={2}
      >
        <Controller
          name="shortDescription"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              rows={3}
              placeholder="Brief summary shown on listing cards…"
              style={{
                ...inputCss,
                resize: "vertical",
                minHeight: 72,
              }}
            />
          )}
        />
      </FieldGroup>

      {/* Category */}
      <FieldGroup label="Category" error={errors.category}>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              placeholder="e.g. Programming, Design"
              style={inputCss}
            />
          )}
        />
      </FieldGroup>

      {/* Event Type */}
      <FieldGroup label="Event Type" error={errors.eventType}>
        <Controller
          name="eventType"
          control={control}
          render={({ field }) => (
            <select {...field} style={selectCss}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: "#0e0e0e" }}>
                  {t}
                </option>
              ))}
            </select>
          )}
        />
      </FieldGroup>

      {/* Participation Type */}
      <FieldGroup label="Participation Type" error={errors.type}>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <select {...field} style={selectCss}>
              {COMPETITION_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: "#0e0e0e" }}>
                  {t}
                </option>
              ))}
            </select>
          )}
        />
      </FieldGroup>

      {/* Status */}
      <FieldGroup label="Status" error={errors.status}>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select {...field} style={selectCss}>
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s} style={{ background: "#0e0e0e" }}>
                  {s}
                </option>
              ))}
            </select>
          )}
        />
      </FieldGroup>
    </Box>
  );
}
