"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Send,
  AlertTriangle,
} from "lucide-react";
import {
  useApproveReviewProposal,
  useRejectReviewProposal,
  useReviewProposalDetail,
} from "@/src/hooks/api/useReviews";
import { LoadingState } from "@/src/components/LoadingState";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: { label: "Pending", bg: "rgba(234,179,8,0.1)", text: "#fbbf24", border: "rgba(234,179,8,0.2)", icon: Clock },
  APPROVED: { label: "Approved", bg: "rgba(34,197,94,0.1)", text: "#4ade80", border: "rgba(34,197,94,0.2)", icon: CheckCircle },
  REJECTED: { label: "Rejected", bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)", icon: XCircle },
};

// Human-readable field label mapping
const FIELD_LABELS = {
  title: "Title",
  shortDescription: "Short Description",
  category: "Category",
  eventType: "Event Type",
  rulesRichText: "Rules",
  status: "Status",
  type: "Participation Type",
  minTeamSize: "Min Team Size",
  maxTeamSize: "Max Team Size",
  registrationDeadline: "Registration Deadline",
  registrationsOpen: "Registrations Open",
  registrationFee: "Registration Fee",
  maxRegistrations: "Max Registrations",
  maxTeamsPerCollege: "Max Teams / College",
  venueName: "Venue Name",
  venueRoom: "Room",
  venueFloor: "Floor",
  subVenues: "Sub-Venues",
  startTime: "Start Time",
  endTime: "End Time",
  autoApproveTeams: "Auto-Approve Teams",
  requiresApproval: "Requires Approval",
  perPerson: "Fee Per Person",
  attendanceRequired: "Attendance Required",
  isPaid: "Paid Event",
  prizePool: "Prize Pool",
};

function formatFieldValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  // ISO date strings
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      return new Date(value).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { /* fall through */ }
  }
  return String(value);
}

function getDiffRows(before = {}, after = {}) {
  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));
  return keys
    .filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))
    .map((k) => ({ key: k, label: FIELD_LABELS[k] || k, before: before?.[k], after: after?.[k] }));
}

// ── Primitives ────────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.35,
        borderRadius: "5px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {cfg.label}
    </Box>
  );
}

const MetaItem = ({ icon: Icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Icon size={13} color="rgba(255,255,255,0.25)" />
    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Mono', monospace" }}>
      {value}
    </Typography>
  </Box>
);

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "9px 20px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

function GhostBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.4)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DarkInput({ label, value, onChange, placeholder }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      {label && (
        <Typography sx={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif", mb: 0.75 }}>
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

function DarkTextarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      {label && (
        <Typography sx={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif", mb: 0.75 }}>
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

// ── Decision panel sub-components ─────────────────────────────────────────────

function PendingDecisionPanel({ proposalId, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirming, setConfirming] = useState(null); // "approve" | "reject"
  const approveMutation = useApproveReviewProposal();
  const rejectMutation = useRejectReviewProposal();

  const pending = approveMutation.isPending || rejectMutation.isPending;

  async function handleApprove() {
    try {
      await approveMutation.mutateAsync({ proposalId, reviewNotes });
      enqueueSnackbar("Proposal approved and changes applied", { variant: "success" });
      setConfirming(null);
      onSuccess?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Failed to approve", { variant: "error" });
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      enqueueSnackbar("Rejection reason is required", { variant: "warning" });
      return;
    }
    try {
      await rejectMutation.mutateAsync({ proposalId, rejectionReason, reviewNotes });
      enqueueSnackbar("Proposal rejected", { variant: "success" });
      setConfirming(null);
      onSuccess?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || "Failed to reject", { variant: "error" });
    }
  }

  // Confirmation step
  if (confirming === "approve") {
    return (
      <Box>
        <Box sx={{ p: 1.5, mb: 2, borderRadius: "8px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <Typography sx={{ fontSize: 12, color: "#4ade80", fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircle size={13} />
            Approving will immediately apply all proposed changes to the competition.
          </Typography>
        </Box>
        <DarkTextarea label="Review Notes (optional)" value={reviewNotes} onChange={setReviewNotes} placeholder="Add any notes visible to the proposer…" rows={3} />
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <GhostBtn onClick={() => setConfirming(null)} disabled={pending}>Back</GhostBtn>
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            style={{
              ...btnBase,
              background: pending ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.85)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: pending ? "rgba(255,255,255,0.3)" : "#fff",
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <CheckCircle size={14} />}
            Confirm Approve
          </button>
        </Box>
      </Box>
    );
  }

  if (confirming === "reject") {
    return (
      <Box>
        <Box sx={{ p: 1.5, mb: 2, borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <Typography sx={{ fontSize: 12, color: "#f87171", fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 0.75 }}>
            <XCircle size={13} />
            Rejection is final. The proposer will be notified with your reason.
          </Typography>
        </Box>
        <DarkInput label="Rejection Reason" value={rejectionReason} onChange={setRejectionReason} placeholder="Explain why this proposal is being rejected…" />
        <DarkTextarea label="Review Notes (optional)" value={reviewNotes} onChange={setReviewNotes} placeholder="Additional notes for the proposer…" rows={2} />
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <GhostBtn onClick={() => setConfirming(null)} disabled={pending}>Back</GhostBtn>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending || !rejectionReason.trim()}
            style={{
              ...btnBase,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
              cursor: (pending || !rejectionReason.trim()) ? "not-allowed" : "pointer",
              opacity: (pending || !rejectionReason.trim()) ? 0.5 : 1,
            }}
          >
            {pending ? <CircularProgress size={12} sx={{ color: "#f87171" }} /> : <XCircle size={14} />}
            Confirm Reject
          </button>
        </Box>
      </Box>
    );
  }

  // Default: choose action
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", mb: 2 }}>
        Review the field changes on the left, then choose an action.
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <button
          type="button"
          onClick={() => setConfirming("approve")}
          style={{
            ...btnBase,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "#4ade80",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(34,197,94,0.08)"; }}
        >
          <CheckCircle size={14} />
          Approve
        </button>
        <button
          type="button"
          onClick={() => setConfirming("reject")}
          style={{
            ...btnBase,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
        >
          <XCircle size={14} />
          Reject
        </button>
      </Box>
    </Box>
  );
}

function ReviewedPanel({ proposal }) {
  const cfg = STATUS_CONFIG[proposal.status];
  const Icon = cfg?.icon || CheckCircle;

  return (
    <Box>
      <Box
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: "10px",
          background: `${cfg?.bg || "rgba(255,255,255,0.04)"}`,
          border: `1px solid ${cfg?.border || "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Icon size={18} color={cfg?.text} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: cfg?.text, fontFamily: "'Syne', sans-serif" }}>
            {proposal.status === "APPROVED" ? "Proposal Approved" : "Proposal Rejected"}
          </Typography>
          {proposal.reviewedAt && (
            <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace", mt: 0.25 }}>
              {new Date(proposal.reviewedAt).toLocaleString("en-US", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </Typography>
          )}
        </Box>
      </Box>

      {proposal.rejectionReason && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif", mb: 0.75 }}>
            Rejection Reason
          </Typography>
          <Box sx={{ p: 1.5, borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <Typography sx={{ fontSize: 13, color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
              {proposal.rejectionReason}
            </Typography>
          </Box>
        </Box>
      )}

      {proposal.reviewNotes && (
        <Box>
          <Typography sx={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif", mb: 0.75 }}>
            Review Notes
          </Typography>
          <Box sx={{ p: 1.5, borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Mono', monospace" }}>
              {proposal.reviewNotes}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReviewDetailPage() {
  const { proposalId } = useParams();
  const { data: proposal, isLoading } = useReviewProposalDetail(proposalId);

  const diffRows = useMemo(
    () => getDiffRows(proposal?.beforeSnapshot, proposal?.afterSnapshot),
    [proposal],
  );

  if (isLoading) return <LoadingState />;

  if (!proposal) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "'Syne', sans-serif" }}>
          Proposal not found.
        </Typography>
      </Box>
    );
  }

  const isPending = proposal.status === "PENDING";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      {/* Back nav */}
      <Link href="/admin/sa/reviews" style={{ textDecoration: "none" }}>
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
          All Proposals
        </Box>
      </Link>

      {/* Proposal header */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: "12px",
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
          <Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", fontFamily: "'Syne', sans-serif", letterSpacing: "0.01em", mb: 0.5 }}
            >
              {proposal.competitionTitle}
            </Typography>
            {(proposal.summary || proposal.changeDescription) && (
              <Typography
                sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'Syne', sans-serif" }}
              >
                {proposal.summary || proposal.changeDescription}
              </Typography>
            )}
          </Box>
          <StatusPill status={proposal.status} />
        </Box>

        <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
          {proposal.proposerName && (
            <MetaItem icon={User} label="Proposed by" value={proposal.proposerName} />
          )}
          {proposal.createdAt && (
            <MetaItem
              icon={Calendar}
              label="Submitted"
              value={new Date(proposal.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            />
          )}
          <MetaItem icon={FileText} label="Changes" value={`${diffRows.length} field${diffRows.length !== 1 ? "s" : ""}`} />
        </Box>
      </Box>

      {/* Two-column layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* ── Left: Diff table ── */}
        <Box
          sx={{
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#0c0c0c",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 1.75,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{ fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif" }}
            >
              Field Changes
            </Typography>
            <Typography
              sx={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "'DM Mono', monospace" }}
            >
              {diffRows.length} changed
            </Typography>
          </Box>

          {diffRows.length === 0 ? (
            <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.18)", fontFamily: "'Syne', sans-serif" }}>
                No field differences found
              </Typography>
            </Box>
          ) : (
            diffRows.map((row, idx) => (
              <Box key={row.key}>
                <Box sx={{ px: 3, py: 2 }}>
                  {/* Field name */}
                  <Typography
                    sx={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", fontFamily: "'Syne', sans-serif", mb: 1 }}
                  >
                    {row.label}
                  </Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    {/* Before */}
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: "7px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.12)",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(239,68,68,0.5)", fontFamily: "'DM Mono', monospace", mb: 0.5 }}
                      >
                        Before
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "#fca5a5", fontFamily: "'DM Mono', monospace", wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                      >
                        {formatFieldValue(row.key, row.before)}
                      </Typography>
                    </Box>

                    {/* After */}
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: "7px",
                        background: "rgba(34,197,94,0.06)",
                        border: "1px solid rgba(34,197,94,0.12)",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(34,197,94,0.5)", fontFamily: "'DM Mono', monospace", mb: 0.5 }}
                      >
                        After
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "#86efac", fontFamily: "'DM Mono', monospace", wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                      >
                        {formatFieldValue(row.key, row.after)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {idx < diffRows.length - 1 && (
                  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
                )}
              </Box>
            ))
          )}
        </Box>

        {/* ── Right: Decision panel ── */}
        <Box
          sx={{
            borderRadius: "12px",
            border: `1px solid ${isPending ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.06)"}`,
            background: "#0c0c0c",
            p: 3,
            position: { lg: "sticky" },
            top: { lg: 24 },
          }}
        >
          <Typography
            sx={{ fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "'Syne', sans-serif", mb: 2 }}
          >
            {isPending ? "Decision" : "Review Result"}
          </Typography>

          {isPending ? (
            <PendingDecisionPanel proposalId={proposalId} />
          ) : (
            <ReviewedPanel proposal={proposal} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
