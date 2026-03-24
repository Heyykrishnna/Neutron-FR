"use client";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { Trophy, ArrowLeft, Lock, Unlock } from "lucide-react";
import { useClubCompetitions } from "@/src/hooks/api/useClub";
import { LoadingState } from "@/src/components/LoadingState";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", bg: "rgba(161,161,170,0.1)", text: "#a1a1aa", border: "rgba(161,161,170,0.2)" },
  OPEN: { label: "Open", bg: "rgba(34,197,94,0.1)", text: "#4ade80", border: "rgba(34,197,94,0.2)" },
  CLOSED: { label: "Closed", bg: "rgba(234,179,8,0.1)", text: "#fbbf24", border: "rgba(234,179,8,0.2)" },
  ARCHIVED: { label: "Archived", bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  CANCELLED: { label: "Cancelled", bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.2)" },
  POSTPONED: { label: "Postponed", bg: "rgba(249,115,22,0.1)", text: "#fb923c", border: "rgba(249,115,22,0.2)" },
};

const EVENT_TYPE_CONFIG = {
  COMPETITION: { bg: "rgba(168,85,247,0.1)", text: "#c084fc", border: "rgba(168,85,247,0.2)" },
  WORKSHOP: { bg: "rgba(59,130,246,0.1)", text: "#60a5fa", border: "rgba(59,130,246,0.2)" },
  EVENT: { bg: "rgba(34,197,94,0.1)", text: "#4ade80", border: "rgba(34,197,94,0.2)" },
};

function Pill({ bg, text, border, children }) {
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClubCompetitionsPage() {
  const { data: competitions = [], isLoading } = useClubCompetitions();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Link href="/admin/club" style={{ textDecoration: "none" }}>
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
              mb: 2,
              transition: "color 0.15s",
              "&:hover": { color: "rgba(255,255,255,0.6)" },
            }}
          >
            <ArrowLeft size={13} />
            Dashboard
          </Box>
        </Link>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            <Trophy size={18} color="#c084fc" />
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
              Club Competitions
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Syne', sans-serif",
                mt: 0.3,
              }}
            >
              Competitions assigned to your clubs
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <Box
        sx={{
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#0c0c0c",
          overflowX: "auto",
        }}
      >
        {/* Column headers */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 1fr) 120px 100px 90px 100px",
            minWidth: 640,
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["Competition", "Type", "Status", "Reg.", ""].map((h, i) => (
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

        {competitions.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.18)",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              No competitions assigned to your clubs yet
            </Typography>
          </Box>
        ) : (
          competitions.map((comp, idx) => {
            const sc = STATUS_CONFIG[comp.status] || STATUS_CONFIG.DRAFT;
            const ec = EVENT_TYPE_CONFIG[comp.eventType] || EVENT_TYPE_CONFIG.COMPETITION;
            return (
              <Box key={comp.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(200px, 1fr) 120px 100px 90px 100px",
                    minWidth: 640,
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.018)" },
                  }}
                >
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
                      {comp.title}
                    </Typography>
                    {comp.shortDescription && (
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          mt: 0.25,
                        }}
                      >
                        {comp.shortDescription}
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Pill bg={ec.bg} text={ec.text} border={ec.border}>
                      {comp.eventType || "—"}
                    </Pill>
                  </Box>

                  <Box>
                    <Pill bg={sc.bg} text={sc.text} border={sc.border}>
                      {sc.label}
                    </Pill>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {comp.registrationsOpen ? (
                      <Unlock size={12} color="#4ade80" />
                    ) : (
                      <Lock size={12} color="rgba(255,255,255,0.25)" />
                    )}
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: comp.registrationsOpen ? "#4ade80" : "rgba(255,255,255,0.25)",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {comp.registrationsOpen ? "Open" : "Closed"}
                    </Typography>
                  </Box>

                  <Box>
                    <Link
                      href={`/admin/club/competitions/${comp.id}`}
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
                        View
                        <ArrowLeft size={11} style={{ transform: "rotate(180deg)" }} />
                      </Box>
                    </Link>
                  </Box>
                </Box>
                {idx < competitions.length - 1 && <RowDivider />}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
