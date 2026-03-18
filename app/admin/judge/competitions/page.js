"use client";

import { useState, useMemo } from "react";
import { Box, Typography, Paper, Chip, InputBase, Grid } from "@mui/material";
import { Trophy, Search, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyJudgingCompetitions } from "@/src/hooks/api/useJudging";

import {
  AsyncDataBoundary,
  CardSuspense,
} from "@/src/components/AsyncBoundary";
import { CardSkeleton } from "@/src/components/SuspenseBoundary";

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

function CompetitionCard({ competition, isHeadJudge, onClick }) {
  const comp = competition.competition || competition;
  const status = STATUS_CONFIG[comp.status] || STATUS_CONFIG.DRAFT;
  const eventType = EVENT_TYPE_CONFIG[comp.eventType || comp.type];
  const name = comp.title || comp.name || "Untitled";
  const description = comp.description || comp.tagline || "";

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
        {isHeadJudge && (
          <Chip
            label="Head Judge"
            size="small"
            sx={{
              backgroundColor: "rgba(168,85,247,0.12)",
              color: "#c084fc",
              border: "1px solid rgba(168,85,247,0.2)",
              fontSize: 11,
              fontWeight: 600,
              height: 22,
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

export default function JudgeCompetitionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const {
    data: assignments = [],
    isLoading,
    error,
  } = useMyJudgingCompetitions();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return assignments;
    return assignments.filter((a) => {
      const comp = a.competition || a;
      return (
        (comp.title || comp.name || "").toLowerCase().includes(q) ||
        (comp.description || "").toLowerCase().includes(q) ||
        (comp.category || "").toLowerCase().includes(q)
      );
    });
  }, [assignments, search]);

  return (
    <Box sx={{ p: { xs: 0, md: 0 }, maxWidth: 1200 }}>
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
            <Trophy size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            My Competitions
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
          Competitions you are assigned to judge
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
      <AsyncDataBoundary
        data={assignments}
        loading={isLoading}
        error={error}
        fallback={<CardSkeleton count={3} height={160} />}
      >
        <CompetitionsContent
          filtered={filtered}
          search={search}
          router={router}
        />
      </AsyncDataBoundary>
    </Box>
  );
}

function CompetitionsContent({ filtered, search, router }) {
  if (filtered.length === 0) {
    return (
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
            : "You are not assigned to any competitions yet"}
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={2}>
      {filtered.map((assignment) => {
        const comp = assignment.competition || assignment;
        const compId = assignment.competitionId || comp.id;
        return (
          <Grid item xs={12} sm={6} md={4} key={compId}>
            <CompetitionCard
              competition={assignment}
              isHeadJudge={assignment.isHeadJudge}
              onClick={() =>
                router.push(`/admin/judge/competitions/${compId}/rounds`)
              }
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
