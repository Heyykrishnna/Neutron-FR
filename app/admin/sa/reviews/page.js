"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { FileText, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useReviewProposals } from "@/src/hooks/api/useReviews";
import { LoadingState } from "@/src/components/LoadingState";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
    icon: XCircle,
  },
};

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

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
);

const TABS = ["PENDING", "APPROVED", "REJECTED"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const [status, setStatus] = useState("PENDING");
  const { data, isLoading } = useReviewProposals({ status });

  const proposals = useMemo(() => data?.proposals || [], [data]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={18} color="#c084fc" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            Edit Proposals
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Syne', sans-serif",
              mt: 0.3,
            }}
          >
            Review and action competition edit proposals from club heads
          </Typography>
        </Box>
      </Box>

      {/* Status tabs */}
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
        {TABS.map((t) => {
          const cfg = STATUS_CONFIG[t];
          const active = status === t;
          return (
            <button
              key={t}
              onClick={() => setStatus(t)}
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
                color: active ? cfg.text : "rgba(255,255,255,0.3)",
                fontSize: 12,
                fontFamily: "'Syne', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading proposals…" />
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
              gridTemplateColumns: "minmax(160px,1fr) 160px minmax(120px,1.2fr) 100px 100px 80px",
              px: 3,
              py: 1.5,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {["Competition", "Proposer", "Summary", "Submitted", "Status", ""].map((h, i) => (
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

          {proposals.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.18)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No {status.toLowerCase()} proposals
              </Typography>
            </Box>
          ) : (
            proposals.map((proposal, idx) => (
              <Box key={proposal.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(160px,1fr) 160px minmax(120px,1.2fr) 100px 100px 80px",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.018)" },
                  }}
                >
                  {/* Competition */}
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proposal.competitionTitle}
                    </Typography>
                  </Box>

                  {/* Proposer */}
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proposal.proposerName || "—"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.25)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mt: 0.2,
                      }}
                    >
                      {proposal.proposerEmail || ""}
                    </Typography>
                  </Box>

                  {/* Summary */}
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proposal.summary || proposal.changeDescription || "—"}
                    </Typography>
                  </Box>

                  {/* Date */}
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {proposal.createdAt
                      ? new Date(proposal.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </Typography>

                  {/* Status */}
                  <Box>
                    <StatusPill status={proposal.status} />
                  </Box>

                  {/* Action */}
                  <Box>
                    <Link
                      href={`/admin/sa/reviews/${proposal.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: "7px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 500,
                          transition: "all 0.15s",
                          "&:hover": {
                            background: "rgba(168,85,247,0.1)",
                            borderColor: "rgba(168,85,247,0.25)",
                            color: "#c084fc",
                          },
                        }}
                      >
                        {proposal.status === "PENDING" ? "Review" : "View"}
                      </Box>
                    </Link>
                  </Box>
                </Box>
                {idx < proposals.length - 1 && <RowDivider />}
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
