"use client";

import { useState, useMemo } from "react";
import { Box, Typography, Paper, Chip, InputBase, Grid } from "@mui/material";
import { Star, Search, ChevronRight, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";
import { LoadingState } from "@/src/components/LoadingState";

// ── status configs ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    bg: "rgba(161,161,170,0.12)",
    text: "#a1a1aa",
    border: "rgba(161,161,170,0.2)",
  },
  OPEN: {
    label: "Open",
    bg: "rgba(34,197,94,0.12)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  CLOSED: {
    label: "Closed",
    bg: "rgba(234,179,8,0.12)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  ARCHIVED: {
    label: "Archived",
    bg: "rgba(161,161,170,0.08)",
    text: "#71717a",
    border: "rgba(161,161,170,0.12)",
  },
};

const EVENT_TYPE_CONFIG = {
  SOLO: { label: "Solo", bg: "rgba(59,130,246,0.12)", text: "#60a5fa" },
  TEAM: { label: "Team", bg: "rgba(168,85,247,0.12)", text: "#c084fc" },
  GROUP: { label: "Group", bg: "rgba(20,184,166,0.12)", text: "#2dd4bf" },
};

// ── CompetitionCard ───────────────────────────────────────────────────────────

function CompetitionCard({ competition, onClick }) {
  const status = STATUS_CONFIG[competition.status] || STATUS_CONFIG.DRAFT;
  const eventType =
    EVENT_TYPE_CONFIG[competition.eventType || competition.type];
  const name = competition.title || competition.name || "Untitled";
  const description = competition.description || competition.tagline || "";

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5,
        background: "#0c0c0c",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "rgba(168,85,247,0.4)",
          boxShadow: "0 0 0 1px rgba(168,85,247,0.15)",
        },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Top row */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.3,
              mb: 0.5,
            }}
            noWrap
          >
            {name}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              sx={{
                color: "#71717a",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.4,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <ChevronRight
          size={16}
          color="#52525b"
          style={{ flexShrink: 0, marginTop: 2 }}
        />
      </Box>

      {/* Bottom row — chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Chip
          label={status.label}
          size="small"
          sx={{
            backgroundColor: status.bg,
            color: status.text,
            border: `1px solid ${status.border}`,
            fontSize: 11,
            fontWeight: 600,
            height: 22,
          }}
        />
        {eventType && (
          <Chip
            label={eventType.label}
            size="small"
            sx={{
              backgroundColor: eventType.bg,
              color: eventType.text,
              fontSize: 11,
              height: 22,
            }}
          />
        )}
        {competition.category && (
          <Chip
            label={competition.category}
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#a1a1aa",
              fontSize: 11,
              height: 22,
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JudgingPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: competitions = [], isLoading } = useCompetitions();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return competitions;
    return competitions.filter(
      (c) =>
        (c.title || c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q),
    );
  }, [competitions, search]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Judging
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            ml: 0.5,
          }}
        >
          Select a competition to manage judges and rounds
        </Typography>
      </Box>

      {/* Search */}
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          mb: 3,
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          maxWidth: 400,
        }}
      >
        <Search size={15} color="#52525b" />
        <InputBase
          placeholder="Search competitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            fontSize: 13,
            color: "#d4d4d8",
            "& input::placeholder": { color: "#52525b" },
          }}
        />
      </Paper>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading competitions…" />
      ) : filtered.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography sx={{ color: "#71717a", mb: 1 }}>
            {search
              ? "No competitions match your search"
              : "No competitions found"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((comp) => (
            <Grid item xs={12} sm={6} md={4} key={comp.id}>
              <CompetitionCard
                competition={comp}
                onClick={() => router.push(`/admin/dh/judging/${comp.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
