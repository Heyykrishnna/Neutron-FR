"use client";

import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Paper, Chip, IconButton, Grid } from "@mui/material";
import { ArrowLeft, Lock, ChevronRight, Star } from "lucide-react";
import {
  useCompetitionRounds,
  useMyJudgingCompetitions,
} from "@/src/hooks/api/useJudging";
import { LoadingState } from "@/src/components/LoadingState";

function RoundCard({ round, onClick }) {
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
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Round number badge */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "11px",
          flexShrink: 0,
          background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: "'DM Mono', monospace",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {round.roundNumber ?? "?"}
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
            noWrap
          >
            {round.name || `Round ${round.roundNumber}`}
          </Typography>
          {round.scoresLocked && (
            <Chip
              icon={<Lock size={10} />}
              label="Locked"
              size="small"
              sx={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                height: 20,
                fontSize: 10,
                "& .MuiChip-icon": { color: "#f87171", ml: 0.5 },
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Box>
        {round.teamCount != null && (
          <Typography variant="caption" sx={{ color: "#52525b" }}>
            {round.teamCount} team{round.teamCount !== 1 ? "s" : ""}
          </Typography>
        )}
      </Box>

      <ChevronRight size={16} color="#52525b" style={{ flexShrink: 0 }} />
    </Paper>
  );
}

export default function JudgeRoundsPage() {
  const { competitionId } = useParams();
  const router = useRouter();
  const { data: rounds = [], isLoading } = useCompetitionRounds(competitionId);
  const { data: assignments = [] } = useMyJudgingCompetitions();

  const assignment = assignments.find(
    (a) => (a.competitionId || a.competition?.id) === competitionId,
  );
  const comp = assignment?.competition || {};
  const compName = comp.title || comp.name || "Competition";

  return (
    <Box sx={{ maxWidth: 900 }}>
      {/* Breadcrumb */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <IconButton
          onClick={() => router.push("/admin/judge/competitions")}
          size="small"
          sx={{
            color: "#71717a",
            "&:hover": {
              color: "#f4f4f5",
              background: "rgba(255,255,255,0.05)",
            },
          }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Typography
          variant="body2"
          onClick={() => router.push("/admin/judge/competitions")}
          sx={{
            color: "#71717a",
            cursor: "pointer",
            "&:hover": { color: "#a1a1aa" },
          }}
        >
          My Competitions
        </Typography>
        <Typography variant="body2" sx={{ color: "#3f3f46" }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: "#f4f4f5", fontWeight: 500 }}>
          {compName}
        </Typography>
      </Box>

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
            {compName}
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
          Select a round to score participants
        </Typography>
      </Box>

      {/* Rounds */}
      {isLoading ? (
        <LoadingState message="Loading rounds…" />
      ) : rounds.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography sx={{ color: "#71717a" }}>
            No rounds have been created for this competition yet
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {rounds.map((round) => (
            <Grid item xs={12} sm={6} key={round.id}>
              <RoundCard
                round={round}
                onClick={() =>
                  router.push(
                    `/admin/judge/competitions/${competitionId}/rounds/${round.id}`,
                  )
                }
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
