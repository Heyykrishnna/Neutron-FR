"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Popover,
  Button,
  CircularProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  ArrowLeft,
  Trophy,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Users,
  ChevronRight,
} from "lucide-react";
import { useSnackbar } from "notistack";
import {
  useAdminRoundTeams,
  useAdminCompetitionRounds,
  useMarkTeamQualification,
} from "@/src/hooks/api/useJudging";
import { useCompetition } from "@/src/hooks/api/useCompetitions";
import { LoadingState } from "@/src/components/LoadingState";

// ── helpers ──────────────────────────────────────────────────────────────────

const cellSx = {
  color: "#d4d4d8",
  borderColor: "rgba(255,255,255,0.05)",
  py: 1.5,
};
const headSx = {
  color: "#71717a",
  borderColor: "rgba(255,255,255,0.05)",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontFamily: "'DM Mono', monospace",
};

function QualChip({ status }) {
  if (status === "QUALIFIED")
    return (
      <Chip
        icon={<CheckCircle2 size={11} />}
        label="Qualified"
        size="small"
        sx={{
          background: "rgba(34,197,94,0.12)",
          color: "#4ade80",
          height: 22,
          fontSize: 11,
          "& .MuiChip-icon": { color: "#4ade80", ml: 0.5 },
          "& .MuiChip-label": { px: 0.75 },
        }}
      />
    );
  if (status === "ELIMINATED")
    return (
      <Chip
        icon={<XCircle size={11} />}
        label="Eliminated"
        size="small"
        sx={{
          background: "rgba(239,68,68,0.12)",
          color: "#f87171",
          height: 22,
          fontSize: 11,
          "& .MuiChip-icon": { color: "#f87171", ml: 0.5 },
          "& .MuiChip-label": { px: 0.75 },
        }}
      />
    );
  return (
    <Chip
      icon={<Clock size={11} />}
      label="Pending"
      size="small"
      sx={{
        background: "rgba(161,161,170,0.1)",
        color: "#a1a1aa",
        height: 22,
        fontSize: 11,
        "& .MuiChip-icon": { color: "#a1a1aa", ml: 0.5 },
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
}

// ── QualificationPopover ─────────────────────────────────────────────────────

function QualificationPopover({
  anchorEl,
  onClose,
  roundId,
  teamId,
  currentStatus,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: markQual, isPending } = useMarkTeamQualification();

  const options = [
    {
      status: "QUALIFIED",
      label: "Mark Qualified",
      color: "#4ade80",
      bg: "rgba(34,197,94,0.08)",
    },
    {
      status: "ELIMINATED",
      label: "Mark Eliminated",
      color: "#f87171",
      bg: "rgba(239,68,68,0.08)",
    },
    {
      status: "PENDING",
      label: "Reset to Pending",
      color: "#a1a1aa",
      bg: "rgba(161,161,170,0.06)",
    },
  ];

  function handleMark(status) {
    if (status === currentStatus) {
      onClose();
      return;
    }
    markQual(
      { roundId, teamId, status },
      {
        onSuccess: () => {
          enqueueSnackbar("Qualification updated", { variant: "success" });
          onClose();
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to update qualification",
            { variant: "error" },
          ),
      },
    );
  }

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      PaperProps={{
        sx: {
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          overflow: "hidden",
          minWidth: 160,
          boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
        },
      }}
    >
      {isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} sx={{ color: "#a855f7" }} />
        </Box>
      ) : (
        options.map((opt) => (
          <Box
            key={opt.status}
            onClick={() => handleMark(opt.status)}
            sx={{
              px: 2,
              py: 1.25,
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              "&:last-child": { borderBottom: "none" },
              background: currentStatus === opt.status ? opt.bg : "transparent",
              "&:hover": { background: opt.bg },
              transition: "background 0.1s",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: opt.color,
                fontWeight: currentStatus === opt.status ? 700 : 400,
              }}
            >
              {opt.label}
            </Typography>
          </Box>
        ))
      )}
    </Popover>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RoundResultsPage() {
  const { competitionId, roundId } = useParams();
  const router = useRouter();
  const [popover, setPopover] = useState({
    anchor: null,
    teamId: null,
    currentStatus: null,
  });

  const { data: competition } = useCompetition(competitionId);
  const { data: rounds = [] } = useAdminCompetitionRounds(competitionId);
  const { data: roundData, isLoading } = useAdminRoundTeams(roundId);

  const round = roundData?.round || rounds.find((r) => r.id === roundId);
  const teams = roundData?.teams || [];

  const qualifiedCount = teams.filter((t) => t.status === "QUALIFIED").length;
  const eliminatedCount = teams.filter((t) => t.status === "ELIMINATED").length;
  const pendingCount = teams.filter((t) => t.status === "PENDING").length;

  function openPopover(e, teamId, currentStatus) {
    setPopover({ anchor: e.currentTarget, teamId, currentStatus });
  }

  function closePopover() {
    setPopover({ anchor: null, teamId: null, currentStatus: null });
  }

  if (isLoading) return <LoadingState message="Loading round results…" />;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* ── Breadcrumb ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <IconButton
          onClick={() => router.push("/admin/dh/judging")}
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
          onClick={() => router.push("/admin/dh/judging")}
          sx={{
            color: "#71717a",
            cursor: "pointer",
            "&:hover": { color: "#a1a1aa" },
          }}
        >
          Judging
        </Typography>
        <Typography variant="body2" sx={{ color: "#3f3f46" }}>
          /
        </Typography>
        <Typography
          variant="body2"
          onClick={() => router.push(`/admin/dh/judging/${competitionId}`)}
          sx={{
            color: "#71717a",
            cursor: "pointer",
            "&:hover": { color: "#a1a1aa" },
          }}
        >
          {competition?.title || "Competition"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#3f3f46" }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: "#f4f4f5", fontWeight: 500 }}>
          {round?.name || `Round ${round?.roundNumber || ""}`}
        </Typography>
      </Box>

      {/* ── Header ── */}
      <Box
        sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3, mt: 1 }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            flexShrink: 0,
            background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "'DM Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {round?.roundNumber || "?"}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "#f4f4f5",
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {round?.name || "Round"}
            </Typography>
            {round?.scoresLocked && (
              <Chip
                icon={<Lock size={11} />}
                label="Scores Locked"
                size="small"
                sx={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                  height: 22,
                  fontSize: 11,
                  "& .MuiChip-icon": { color: "#f87171", ml: 0.5 },
                }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: "#71717a", mt: 0.25 }}>
            {teams.length} team{teams.length !== 1 ? "s" : ""} in this round
            {teams[0]?.totalJudges > 0 &&
              ` · ${teams[0].totalJudges} judge${teams[0].totalJudges !== 1 ? "s" : ""} assigned`}
          </Typography>
        </Box>
      </Box>

      {/* ── Summary chips ── */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: "8px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <CheckCircle2 size={13} color="#4ade80" />
          <Typography
            variant="caption"
            sx={{ color: "#4ade80", fontWeight: 600 }}
          >
            {qualifiedCount} Qualified
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: "8px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <XCircle size={13} color="#f87171" />
          <Typography
            variant="caption"
            sx={{ color: "#f87171", fontWeight: 600 }}
          >
            {eliminatedCount} Eliminated
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: "8px",
            background: "rgba(161,161,170,0.08)",
            border: "1px solid rgba(161,161,170,0.15)",
          }}
        >
          <Clock size={13} color="#a1a1aa" />
          <Typography
            variant="caption"
            sx={{ color: "#a1a1aa", fontWeight: 600 }}
          >
            {pendingCount} Pending
          </Typography>
        </Box>
      </Box>

      {/* ── Table ── */}
      <Paper
        sx={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {teams.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Users size={32} color="#27272a" style={{ marginBottom: 12 }} />
            <Typography variant="body2" sx={{ color: "#52525b" }}>
              No teams found in this round
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "rgba(255,255,255,0.015)" }}>
                  <TableCell sx={{ ...headSx, pl: 3 }}>#</TableCell>
                  <TableCell sx={headSx}>Team</TableCell>
                  <TableCell sx={headSx}>College</TableCell>
                  <TableCell sx={{ ...headSx, textAlign: "right" }}>
                    Avg Score
                  </TableCell>
                  <TableCell sx={{ ...headSx, textAlign: "center" }}>
                    Judges
                  </TableCell>
                  <TableCell sx={headSx}>Qualification</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team, idx) => (
                  <TableRow
                    key={team.teamId}
                    sx={{
                      "&:hover": { background: "rgba(255,255,255,0.018)" },
                      "&:last-child td": { border: 0 },
                    }}
                  >
                    {/* Rank */}
                    <TableCell sx={{ ...cellSx, pl: 3 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            idx === 0
                              ? "#fbbf24"
                              : idx === 1
                                ? "#d1d5db"
                                : idx === 2
                                  ? "#b45309"
                                  : "#52525b",
                          fontWeight: idx < 3 ? 700 : 400,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {idx + 1}
                      </Typography>
                    </TableCell>

                    {/* Team name */}
                    <TableCell sx={cellSx}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#f4f4f5", fontWeight: 600 }}
                      >
                        {team.teamName}
                      </Typography>
                    </TableCell>

                    {/* College */}
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ color: "#71717a" }}>
                        {team.collegeName || "—"}
                      </Typography>
                    </TableCell>

                    {/* Average score */}
                    <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: team.avgScore !== null ? "#a855f7" : "#3f3f46",
                          fontWeight: team.avgScore !== null ? 700 : 400,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {team.avgScore !== null
                          ? Number(team.avgScore).toFixed(2)
                          : "—"}
                      </Typography>
                    </TableCell>

                    {/* Judges submitted */}
                    <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            team.judgesScored === team.totalJudges &&
                            team.totalJudges > 0
                              ? "#4ade80"
                              : "#71717a",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {team.judgesScored}/{team.totalJudges}
                      </Typography>
                    </TableCell>

                    {/* Qualification — clickable to change */}
                    <TableCell sx={cellSx}>
                      <Box
                        component="span"
                        onClick={(e) =>
                          !round?.scoresLocked &&
                          openPopover(e, team.teamId, team.status)
                        }
                        sx={{
                          cursor: round?.scoresLocked ? "default" : "pointer",
                          display: "inline-flex",
                        }}
                      >
                        <Tooltip
                          title={
                            round?.scoresLocked
                              ? "Scores are locked"
                              : "Click to change qualification"
                          }
                          placement="top"
                        >
                          <span>
                            <QualChip status={team.status} />
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Hint */}
      {!round?.scoresLocked && teams.length > 0 && (
        <Typography
          variant="caption"
          sx={{ color: "#3f3f46", mt: 1.5, display: "block" }}
        >
          Click a qualification chip to mark teams as Qualified, Eliminated or
          reset to Pending.
        </Typography>
      )}

      {/* Qualification Popover */}
      <QualificationPopover
        anchorEl={popover.anchor}
        onClose={closePopover}
        roundId={roundId}
        teamId={popover.teamId}
        currentStatus={popover.currentStatus}
      />
    </Box>
  );
}
