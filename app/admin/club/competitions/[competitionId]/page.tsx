"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, Dialog, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSnackbar } from "notistack";
import {
  ArrowLeft,
  Users,
  FileText,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  Send,
  Building2,
  Eye,
} from "lucide-react";
import {
  useClubCompetitionDetail,
  useClubCompetitionFormResponses,
  useClubCompetitionRegistrations,
  useSubmitCompetitionEditProposal,
  type Competition,
} from "@/src/hooks/api/useClub";
import { LoadingState } from "@/src/components/LoadingState";
import {
  normalizeDateTimeFieldsToIso,
  toDateTimeLocalInput,
} from "@/src/lib/datetime";

// ── Config ────────────────────────────────────────────────────────────────────

type PillConfig = { label: string; bg: string; text: string; border: string };
const STATUS_CONFIG: Record<string, PillConfig> = {
  DRAFT: {
    label: "Draft",
    bg: "rgba(161,161,170,0.1)",
    text: "#a1a1aa",
    border: "rgba(161,161,170,0.2)",
  },
  OPEN: {
    label: "Open",
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  CLOSED: {
    label: "Closed",
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
  POSTPONED: {
    label: "Postponed",
    bg: "rgba(249,115,22,0.1)",
    text: "#fb923c",
    border: "rgba(249,115,22,0.2)",
  },
};

const REG_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#fbbf24" },
  APPROVED: { label: "Approved", color: "#4ade80" },
  REJECTED: { label: "Rejected", color: "#f87171" },
  WAITLISTED: { label: "Waitlisted", color: "#60a5fa" },
};

type EventPillConfig = { bg: string; text: string; border: string };
const EVENT_TYPE_CONFIG: Record<string, EventPillConfig> = {
  COMPETITION: {
    bg: "rgba(168,85,247,0.1)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.2)",
  },
  WORKSHOP: {
    bg: "rgba(59,130,246,0.1)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  EVENT: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
};

// ── Shared primitives ─────────────────────────────────────────────────────────

interface PillProps {
  bg: string;
  text: string;
  border: string;
  children: React.ReactNode;
}
function Pill({ bg, text, border, children }: PillProps) {
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.35,
        borderRadius: "5px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        display: "inline-block",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
);

const btnBase = {
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "7px 14px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

interface GhostBtnProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}
function GhostBtn({ onClick, children, disabled }: GhostBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

interface PurpleBtnProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
function PurpleBtn({
  onClick,
  children,
  disabled,
  type = "button",
}: PurpleBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: disabled ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.35)",
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "8px 18px",
        fontSize: 13,
      }}
    >
      {children}
    </button>
  );
}

interface DarkInputProps {
  label?: string;
  value: string | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
}
function DarkInput({ label, value, onChange, placeholder }: DarkInputProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f4f4f5",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </Box>
  );
}

interface DarkTextareaProps {
  label?: string;
  value: string | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}
function DarkTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: DarkTextareaProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        rows={rows}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f4f4f5",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </Box>
  );
}

// ── Response detail dialog ────────────────────────────────────────────────────

interface ResponseField {
  fieldLabel: string;
  value?: string;
  jsonValue?: unknown;
  fileUrl?: string;
}
interface Respondent {
  name: string;
  email: string;
  fields: ResponseField[];
}
interface ResponseModalProps {
  open: boolean;
  onClose: () => void;
  respondent: Respondent | null;
}
function ResponseModal({ open, onClose, respondent }: ResponseModalProps) {
  if (!respondent) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {respondent.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
              mt: 0.25,
            }}
          >
            {respondent.email} · {respondent.fields.length} field
            {respondent.fields.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.3)",
            padding: 4,
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </Box>

      {/* Fields */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {respondent.fields.map((f, i) => (
          <Box key={i}>
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'Syne', sans-serif",
                mb: 0.5,
              }}
            >
              {f.fieldLabel}
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "#e4e4e7",
                  fontFamily: "'DM Mono', monospace",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {f.value ||
                  (f.jsonValue ? JSON.stringify(f.jsonValue, null, 2) : "—")}
              </Typography>
              {f.fileUrl && (
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                    color: "#c084fc",
                    fontSize: 11,
                    fontFamily: "'Syne', sans-serif",
                    textDecoration: "none",
                  }}
                >
                  <Eye size={11} /> View file
                </a>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, display: "flex", justifyContent: "flex-end" }}>
        <GhostBtn onClick={onClose}>Close</GhostBtn>
      </Box>
    </Dialog>
  );
}

// ── Shared form primitives for ProposalModal ─────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode;
}
function SectionLabel({ children }: SectionLabelProps) {
  return (
    <Typography
      sx={{
        fontSize: 9.5,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.18)",
        fontFamily: "'Syne', sans-serif",
        mb: 1.5,
        mt: 2.5,
        "&:first-of-type": { mt: 0 },
      }}
    >
      {children}
    </Typography>
  );
}

interface InlineToggleProps {
  label: string;
  checked: boolean | undefined;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}
function InlineToggle({
  label,
  checked,
  onChange,
  disabled,
}: InlineToggleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {label}
      </Typography>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          border: "none",
          background: checked
            ? "rgba(168,85,247,0.7)"
            : "rgba(255,255,255,0.1)",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
    </Box>
  );
}

interface DarkSelectProps {
  label?: string;
  value: string | undefined;
  onChange: (val: string) => void;
  children: React.ReactNode;
}
function DarkSelect({ label, value, onChange, children }: DarkSelectProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: value ? "#f4f4f5" : "rgba(255,255,255,0.3)",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        {children}
      </select>
    </Box>
  );
}

interface DarkNumberInputProps {
  label?: string;
  value: number | null | undefined;
  onChange: (val: number | null) => void;
  min?: number;
  placeholder?: string;
}
function DarkNumberInput({
  label,
  value,
  onChange,
  min,
  placeholder,
}: DarkNumberInputProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      )}
      <input
        type="number"
        value={value ?? ""}
        min={min ?? 0}
        placeholder={placeholder || ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f4f4f5",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </Box>
  );
}

interface DarkDateTimeInputProps {
  label?: string;
  value: string | null | undefined;
  onChange: (val: string | null) => void;
}
function DarkDateTimeInput({ label, value, onChange }: DarkDateTimeInputProps) {
  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
      )}
      <input
        type="datetime-local"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: value ? "#f4f4f5" : "rgba(255,255,255,0.3)",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          outline: "none",
          boxSizing: "border-box",
          colorScheme: "dark",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </Box>
  );
}

// ISO datetime → datetime-local string
function toDateTimeLocal(val: string | null | undefined): string {
  return toDateTimeLocalInput(val);
}

// ── Edit Proposal modal ───────────────────────────────────────────────────────

interface FormState {
  title: string;
  shortDescription: string;
  category: string;
  eventType: string;
  rulesRichText: string;
  startTime: string | null;
  endTime: string | null;
  venueName: string;
  venueRoom: string;
  venueFloor: string;
  type: string;
  minTeamSize: number | null;
  maxTeamSize: number | null;
  maxTeamsPerCollege: number | null;
  autoApproveTeams: boolean;
  registrationDeadline: string | null;
  registrationsOpen: boolean;
  registrationFee: number | null;
  maxRegistrations: number | null;
  requiresApproval: boolean;
  isPaid: boolean;
  perPerson: boolean;
  attendanceRequired: boolean;
  summary: string;
}
interface ProposalModalProps {
  open: boolean;
  onClose: () => void;
  competition: Competition | null | undefined;
}
function ProposalModal({ open, onClose, competition }: ProposalModalProps) {
  const { enqueueSnackbar } = useSnackbar();
  const submitProposalMutation = useSubmitCompetitionEditProposal();
  const [form, setForm] = useState<Partial<FormState>>({});

  const set =
    <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) =>
      setForm((p) => ({ ...p, [key]: val }));

  // Initialize all fields when modal opens
  useEffect(() => {
    if (competition && open) {
      setForm({
        // Basic
        title: competition.title || "",
        shortDescription: competition.shortDescription || "",
        category: competition.category || "",
        eventType: competition.eventType || "COMPETITION",
        // Details
        rulesRichText: competition.rulesRichText || "",
        // Schedule
        startTime: toDateTimeLocal(competition.startTime),
        endTime: toDateTimeLocal(competition.endTime),
        // Venue
        venueName: competition.venueName || "",
        venueRoom: competition.venueRoom || "",
        venueFloor: competition.venueFloor || "",
        // Team
        type: competition.type || "SOLO",
        minTeamSize: competition.minTeamSize ?? null,
        maxTeamSize: competition.maxTeamSize ?? null,
        maxTeamsPerCollege: competition.maxTeamsPerCollege ?? null,
        autoApproveTeams: !!competition.autoApproveTeams,
        // Registration
        registrationDeadline: toDateTimeLocal(competition.registrationDeadline),
        registrationsOpen: !!competition.registrationsOpen,
        registrationFee: competition.registrationFee ?? 0,
        maxRegistrations: competition.maxRegistrations ?? null,
        requiresApproval: !!competition.requiresApproval,
        isPaid: !!competition.isPaid,
        perPerson: !!competition.perPerson,
        // Other
        attendanceRequired: !!competition.attendanceRequired,
        // Summary
        summary: "",
      });
    }
  }, [competition, open]);

  async function handleSubmit() {
    try {
      const { summary, ...fields } = form;
      // Omit null and empty-string values so optional fields that are cleared
      // are simply excluded from the proposal (backend rejects null for integer fields)
      const payload = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== null && v !== ""),
      );

      const normalizedPayload = normalizeDateTimeFieldsToIso(payload as any, [
        "startTime",
        "endTime",
        "registrationDeadline",
      ]);

      await submitProposalMutation.mutateAsync({
        competitionId: competition!._id,
        payload: normalizedPayload,
        summary: summary ?? "",
        changeDescription: summary ?? "",
      });
      enqueueSnackbar("Edit proposal submitted for review", {
        variant: "success",
      });
      onClose();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      enqueueSnackbar(
        e?.response?.data?.message || e?.message || "Failed to submit proposal",
        { variant: "error" },
      );
    }
  }

  if (!competition) return null;

  const pending = submitProposalMutation.isPending;
  const isTeam = form.type === "TEAM";

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Propose Edit
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
              mt: 0.25,
            }}
          >
            {competition.title} · requires SA approval
          </Typography>
        </Box>
        {!pending && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.3)",
              padding: 4,
              lineHeight: 0,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        )}
      </Box>

      {/* Scrollable form body */}
      <Box
        data-lenis-prevent
        sx={{ px: 3, py: 2.5, overflowY: "auto", flex: 1 }}
      >
        <Box
          sx={{
            p: 1.5,
            mb: 3,
            borderRadius: "8px",
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.15)",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(168,85,247,0.8)",
              fontFamily: "'Syne', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Pencil size={12} />
            All fields are pre-filled with current values. Only modified fields
            will appear in the proposal diff.
          </Typography>
        </Box>

        {/* ── Basic Info ── */}
        <SectionLabel>Basic Info</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: "0 16px",
          }}
        >
          <DarkInput label="Title" value={form.title} onChange={set("title")} />
          <DarkSelect
            label="Event Type"
            value={form.eventType}
            onChange={set("eventType")}
          >
            <option value="COMPETITION" style={{ background: "#0e0e0e" }}>
              Competition
            </option>
            <option value="WORKSHOP" style={{ background: "#0e0e0e" }}>
              Workshop
            </option>
            <option value="EVENT" style={{ background: "#0e0e0e" }}>
              Event
            </option>
          </DarkSelect>
        </Box>
        <DarkInput
          label="Short Description"
          value={form.shortDescription}
          onChange={set("shortDescription")}
        />
        <DarkInput
          label="Category"
          value={form.category}
          onChange={set("category")}
          placeholder="e.g. Robotics, Coding…"
        />
        <DarkTextarea
          label="Rules"
          value={form.rulesRichText}
          onChange={set("rulesRichText")}
          placeholder="Competition rules and guidelines…"
          rows={4}
        />

        {/* ── Schedule ── */}
        <SectionLabel>Schedule</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: "0 16px",
          }}
        >
          <DarkDateTimeInput
            label="Start Time"
            value={form.startTime}
            onChange={set("startTime")}
          />
          <DarkDateTimeInput
            label="End Time"
            value={form.endTime}
            onChange={set("endTime")}
          />
        </Box>

        {/* ── Venue ── */}
        <SectionLabel>Venue</SectionLabel>
        <DarkInput
          label="Venue Name"
          value={form.venueName}
          onChange={set("venueName")}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: "0 16px",
          }}
        >
          <DarkInput
            label="Room"
            value={form.venueRoom}
            onChange={set("venueRoom")}
            placeholder="e.g. Lab 3"
          />
          <DarkInput
            label="Floor"
            value={form.venueFloor}
            onChange={set("venueFloor")}
            placeholder="e.g. Ground Floor"
          />
        </Box>

        {/* ── Team Settings ── */}
        <SectionLabel>Team Settings</SectionLabel>
        <DarkSelect
          label="Participation Type"
          value={form.type}
          onChange={set("type")}
        >
          <option value="SOLO" style={{ background: "#0e0e0e" }}>
            Solo (Individual)
          </option>
          <option value="TEAM" style={{ background: "#0e0e0e" }}>
            Team
          </option>
        </DarkSelect>
        {isTeam && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "0 16px",
            }}
          >
            <DarkNumberInput
              label="Min Team Size"
              value={form.minTeamSize}
              onChange={set("minTeamSize")}
              min={1}
            />
            <DarkNumberInput
              label="Max Team Size"
              value={form.maxTeamSize}
              onChange={set("maxTeamSize")}
              min={1}
            />
            <DarkNumberInput
              label="Max Teams / College"
              value={form.maxTeamsPerCollege}
              onChange={set("maxTeamsPerCollege")}
              min={1}
            />
          </Box>
        )}
        {isTeam && (
          <InlineToggle
            label="Auto-approve teams"
            checked={form.autoApproveTeams}
            onChange={set("autoApproveTeams")}
          />
        )}

        {/* ── Registration ── */}
        <SectionLabel>Registration</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: "0 16px",
          }}
        >
          <DarkDateTimeInput
            label="Registration Deadline"
            value={form.registrationDeadline}
            onChange={set("registrationDeadline")}
          />
          <DarkNumberInput
            label="Max Registrations"
            value={form.maxRegistrations}
            onChange={set("maxRegistrations")}
            min={1}
            placeholder="Unlimited"
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: "0 16px",
          }}
        >
          <DarkNumberInput
            label="Registration Fee (₹)"
            value={form.registrationFee}
            onChange={set("registrationFee")}
            min={0}
          />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "8px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            mb: 2,
          }}
        >
          <InlineToggle
            label="Registrations Open"
            checked={form.registrationsOpen}
            onChange={set("registrationsOpen")}
          />
          <InlineToggle
            label="Requires Approval"
            checked={form.requiresApproval}
            onChange={set("requiresApproval")}
          />
          <InlineToggle
            label="Paid Event"
            checked={form.isPaid}
            onChange={set("isPaid")}
          />
          <InlineToggle
            label="Fee Per Person"
            checked={form.perPerson}
            onChange={set("perPerson")}
          />
          <Box sx={{ mb: 0 }}>
            <InlineToggle
              label="Attendance Required"
              checked={form.attendanceRequired}
              onChange={set("attendanceRequired")}
            />
          </Box>
        </Box>

        {/* ── Summary ── */}
        <SectionLabel>Summary of Changes</SectionLabel>
        <DarkTextarea
          value={form.summary}
          onChange={set("summary")}
          placeholder="Briefly describe what you changed and why. This is required for the SA to review your proposal."
          rows={3}
        />
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          pb: 2.5,
          pt: 2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <GhostBtn onClick={onClose} disabled={pending}>
          Cancel
        </GhostBtn>
        <PurpleBtn
          onClick={handleSubmit}
          disabled={pending || !(form.summary as string | undefined)?.trim()}
        >
          {pending ? (
            <CircularProgress size={12} sx={{ color: "#fff" }} />
          ) : (
            <Send size={13} />
          )}
          Submit Proposal
        </PurpleBtn>
      </Box>
    </Dialog>
  );
}

// ── Registration group card ───────────────────────────────────────────────────

interface RegistrationMember {
  registrationId: string;
  name: string;
  email: string;
  status: string;
  registeredAt?: string;
  collegeName?: string;
}
interface RegistrationGroupProps {
  groupLabel: string;
  members: RegistrationMember[];
  defaultOpen?: boolean;
}
function RegistrationGroup({
  groupLabel,
  members,
  defaultOpen = false,
}: RegistrationGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box
      sx={{
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        mb: 1.5,
      }}
    >
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.025)",
          border: "none",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Building2 size={14} color="rgba(255,255,255,0.3)" />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#e4e4e7",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {groupLabel}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.2,
              borderRadius: "5px",
              background: "rgba(255,255,255,0.06)",
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {members.length}
          </Box>
        </Box>
        {open ? (
          <ChevronDown size={14} color="rgba(255,255,255,0.3)" />
        ) : (
          <ChevronRight size={14} color="rgba(255,255,255,0.3)" />
        )}
      </button>

      {/* Members */}
      {open && (
        <Box>
          {members.map((reg, i) => {
            const sc = REG_STATUS[reg.status] || {
              label: reg.status || "—",
              color: "rgba(255,255,255,0.4)",
            };
            return (
              <Box key={reg.registrationId}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {reg.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'DM Mono', monospace",
                        mt: 0.2,
                      }}
                    >
                      {reg.email}
                    </Typography>
                  </Box>
                  {reg.registeredAt && (
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.2)",
                        fontFamily: "'DM Mono', monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.3,
                      borderRadius: "5px",
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: sc.color,
                      border: `1px solid ${sc.color}30`,
                      background: `${sc.color}10`,
                      lineHeight: 1.6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sc.label}
                  </Box>
                </Box>
                {i < members.length - 1 && (
                  <Box
                    sx={{
                      height: "1px",
                      background: "rgba(255,255,255,0.04)",
                      mx: 2,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClubCompetitionDetailPage() {
  const params = useParams();
  const competitionId = Array.isArray(params?.competitionId)
    ? params.competitionId[0]
    : params?.competitionId;

  const { data: competition, isLoading: competitionLoading } =
    useClubCompetitionDetail(competitionId);
  const { data: registrations = [], isLoading: registrationsLoading } =
    useClubCompetitionRegistrations(competitionId);
  const { data: responses = [], isLoading: responsesLoading } =
    useClubCompetitionFormResponses(competitionId);

  const [tab, setTab] = useState("registrations");
  const [responseModal, setResponseModal] = useState<Respondent | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);

  // Group registrations by collegeName
  const registrationGroups = useMemo(() => {
    const groups: Record<
      string,
      { label: string; members: RegistrationMember[] }
    > = {};
    for (const reg of registrations) {
      const key = (reg.collegeName as string | undefined) || "__none__";
      if (!groups[key])
        groups[key] = {
          label: (reg.collegeName as string | undefined) || "No College Listed",
          members: [],
        };
      groups[key].members.push(reg as unknown as RegistrationMember);
    }
    return Object.values(groups).sort((a, b) =>
      a.label === "No College Listed"
        ? 1
        : b.label === "No College Listed"
          ? -1
          : a.label.localeCompare(b.label),
    );
  }, [registrations]);

  // Group form responses by userId
  const respondentGroups = useMemo(() => {
    const groups: Record<string, Respondent> = {};
    for (const r of responses) {
      const key = r.userId as string;
      if (!groups[key]) {
        groups[key] = {
          name: (r.respondentName as string | undefined) || "Unknown",
          email: (r.respondentEmail as string | undefined) || "",
          fields: [],
        };
      }
      groups[key].fields.push(r as unknown as ResponseField);
    }
    return Object.values(groups);
  }, [responses]);

  if (competitionLoading) {
    return <LoadingState />;
  }

  if (!competition) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Competition not found.
        </Typography>
      </Box>
    );
  }

  const sc = STATUS_CONFIG[competition.status] || STATUS_CONFIG.DRAFT;
  const ec =
    EVENT_TYPE_CONFIG[competition.eventType] || EVENT_TYPE_CONFIG.COMPETITION;

  const tabList = [
    {
      key: "registrations",
      label: "Registrations",
      icon: Users,
      count: registrations.length,
    },
    {
      key: "responses",
      label: "Form Responses",
      icon: FileText,
      count: respondentGroups.length,
    },
    { key: "proposal", label: "Edit Proposal", icon: Pencil },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      {/* Back nav */}
      <Link href="/admin/club/competitions" style={{ textDecoration: "none" }}>
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.04em",
            mb: 2.5,
            transition: "color 0.15s",
            "&:hover": { color: "rgba(255,255,255,0.6)" },
          }}
        >
          <ArrowLeft size={13} />
          Competitions
        </Box>
      </Link>

      {/* Competition header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: "12px",
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              <Pill bg={ec.bg} text={ec.text} border={ec.border}>
                {competition.eventType || "—"}
              </Pill>
              <Pill bg={sc.bg} text={sc.text} border={sc.border}>
                {sc.label}
              </Pill>
            </Box>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 600,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.01em",
                mb: 0.5,
              }}
            >
              {competition.title}
            </Typography>
            {competition.shortDescription && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {competition.shortDescription}
              </Typography>
            )}
          </Box>

          <PurpleBtn onClick={() => setProposalOpen(true)}>
            <Pencil size={13} />
            Propose Edit
          </PurpleBtn>
        </Box>

        {(competition.venueName || competition.startDate) && (
          <Box
            sx={{
              display: "flex",
              gap: 3,
              mt: 2,
              pt: 2,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              flexWrap: "wrap",
            }}
          >
            {competition.venueName && (
              <Box>
                <Typography
                  sx={{
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Syne', sans-serif",
                    mb: 0.3,
                  }}
                >
                  Venue
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {competition.venueName}
                </Typography>
              </Box>
            )}
            {competition.startDate && (
              <Box>
                <Typography
                  sx={{
                    fontSize: 9.5,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Syne', sans-serif",
                    mb: 0.3,
                  }}
                >
                  Date
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {new Date(competition.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Tab switcher */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          mb: 3,
          p: 0.5,
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px",
          width: "fit-content",
        }}
      >
        {tabList.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                border: active
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid transparent",
                borderRadius: "7px",
                color: active
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.3)",
                fontSize: 12,
                fontFamily: "'Syne', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={13} />
              {t.label}
              {t.count !== undefined && (
                <Box
                  component="span"
                  sx={{
                    px: 0.75,
                    py: 0.1,
                    borderRadius: "4px",
                    background: active
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.06)",
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: active
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.25)",
                    lineHeight: 1.5,
                  }}
                >
                  {t.count}
                </Box>
              )}
            </button>
          );
        })}
      </Box>

      {/* ── Registrations tab ── */}
      {tab === "registrations" && (
        <Box>
          {registrationsLoading ? (
            <LoadingState message="Loading registrations…" />
          ) : registrations.length === 0 ? (
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#0c0c0c",
              }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.18)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No registrations yet
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 9.5,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {registrationGroups.length} group
                  {registrationGroups.length !== 1 ? "s" : ""} ·{" "}
                  {registrations.length} registrant
                  {registrations.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
              {registrationGroups.map((group, i) => (
                <RegistrationGroup
                  key={i}
                  groupLabel={group.label}
                  members={group.members}
                  defaultOpen={i === 0}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Form Responses tab ── */}
      {tab === "responses" && (
        <Box>
          {responsesLoading ? (
            <LoadingState message="Loading responses…" />
          ) : respondentGroups.length === 0 ? (
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#0c0c0c",
              }}
            >
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.18)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No form responses yet
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "#0c0c0c",
                overflow: "hidden",
              }}
            >
              {/* Column headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px",
                  px: 3,
                  py: 1.5,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {["Respondent", "Fields", ""].map((h, i) => (
                  <Typography
                    key={i}
                    sx={{
                      fontSize: 9.5,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.2)",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>

              <RowDivider />

              {respondentGroups.map((r, idx) => (
                <Box key={idx}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px",
                      alignItems: "center",
                      px: 3,
                      py: 1.75,
                      transition: "background 0.12s",
                      "&:hover": { background: "rgba(255,255,255,0.018)" },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#e4e4e7",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        {r.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                          mt: 0.2,
                        }}
                      >
                        {r.email}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {r.fields.length}
                    </Typography>
                    <Box>
                      <button
                        type="button"
                        onClick={() => setResponseModal(r)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 7,
                          color: "rgba(255,255,255,0.45)",
                          fontSize: 11,
                          fontFamily: "'Syne', sans-serif",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(168,85,247,0.1)";
                          e.currentTarget.style.borderColor =
                            "rgba(168,85,247,0.25)";
                          e.currentTarget.style.color = "#c084fc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor =
                            "rgba(255,255,255,0.08)";
                          e.currentTarget.style.color =
                            "rgba(255,255,255,0.45)";
                        }}
                      >
                        <Eye size={11} />
                        View
                      </button>
                    </Box>
                  </Box>
                  {idx < respondentGroups.length - 1 && <RowDivider />}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Edit Proposal tab (redirect to modal) ── */}
      {tab === "proposal" && (
        <Box
          sx={{
            p: 3,
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#0c0c0c",
          }}
        >
          <Typography
            sx={{
              fontSize: 9.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'Syne', sans-serif",
              mb: 1.5,
            }}
          >
            Propose Changes
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "'Syne', sans-serif",
              mb: 3,
              maxWidth: 480,
            }}
          >
            As a Club Head you can propose edits to this competition. Proposals
            are reviewed by an SA before being applied.
          </Typography>
          <PurpleBtn onClick={() => setProposalOpen(true)}>
            <Pencil size={13} />
            Open Edit Proposal
          </PurpleBtn>
        </Box>
      )}

      {/* Modals */}
      <ResponseModal
        open={!!responseModal}
        onClose={() => setResponseModal(null)}
        respondent={responseModal}
      />
      <ProposalModal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        competition={competition}
      />
    </Box>
  );
}
