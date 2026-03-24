"use client";

import Link from "next/link";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Trophy, UserCircle2, ChevronRight } from "lucide-react";
import { useClubDashboard, useMyClubs } from "@/src/hooks/api/useClub";
import { LoadingState } from "@/src/components/LoadingState";

// ── Shared primitives ─────────────────────────────────────────────────────────

const ROLE_BADGE = {
  HEAD: { label: "Head", bg: "rgba(168,85,247,0.12)", color: "#c084fc", border: "rgba(168,85,247,0.25)" },
  MEMBER: { label: "Member", bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "rgba(255,255,255,0.1)" },
};

function RoleBadge({ role }) {
  const cfg = ROLE_BADGE[role?.toUpperCase()] || ROLE_BADGE.MEMBER;
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
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        display: "inline-block",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </Box>
  );
}

function StatCard({ label, value, color = "rgba(255,255,255,0.7)" }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: "12px",
        background: "#0c0c0c",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
          fontFamily: "'Syne', sans-serif",
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color,
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1,
        }}
      >
        {value ?? 0}
      </Typography>
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClubDashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useClubDashboard();
  const { data: clubs = [], isLoading: clubsLoading } = useMyClubs();

  if (dashboardLoading || clubsLoading) {
    return <LoadingState />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
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
            <UserCircle2 size={18} color="#c084fc" />
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
              Club Dashboard
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.03em",
                mt: 0.3,
              }}
            >
              Your clubs, competitions and proposal activity
            </Typography>
          </Box>
        </Box>

        <Link href="/admin/club/competitions" style={{ textDecoration: "none" }}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: "9px",
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: "#c084fc",
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 500,
              letterSpacing: "0.02em",
              transition: "all 0.15s",
              "&:hover": {
                background: "rgba(168,85,247,0.2)",
                borderColor: "rgba(168,85,247,0.4)",
              },
            }}
          >
            <Trophy size={14} />
            Competitions
            <ChevronRight size={13} />
          </Box>
        </Link>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard label="My Clubs" value={dashboard?.clubsCount} color="rgba(255,255,255,0.7)" />
        <StatCard label="Competitions" value={dashboard?.competitionsCount} color="#c084fc" />
        <StatCard label="Pending Proposals" value={dashboard?.pendingProposalsCount} color="#fbbf24" />
      </Box>

      {/* Club memberships */}
      <Box
        sx={{
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#0c0c0c",
          overflow: "hidden",
        }}
      >
        {/* Section header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            Club Memberships
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.18)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {clubs.length} club{clubs.length !== 1 ? "s" : ""}
          </Typography>
        </Box>

        {clubs.length === 0 ? (
          <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.18)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              No club memberships found
            </Typography>
          </Box>
        ) : (
          clubs.map((club, idx) => (
            <Box key={club.id}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  px: 3,
                  py: 2,
                  transition: "background 0.12s",
                  "&:hover": { background: "rgba(255,255,255,0.018)" },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#e4e4e7",
                      fontFamily: "'Syne', sans-serif",
                      mb: 0.4,
                    }}
                  >
                    {club.name}
                  </Typography>
                  {club.description && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 400,
                      }}
                    >
                      {club.description}
                    </Typography>
                  )}
                </Box>
                <RoleBadge role={club.memberRole} />
              </Box>
              {idx < clubs.length - 1 && (
                <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
