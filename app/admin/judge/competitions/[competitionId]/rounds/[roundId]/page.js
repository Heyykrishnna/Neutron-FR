"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  TextField,
  CircularProgress,
  Divider,
  Tooltip,
  Button,
} from "@mui/material";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users,
  Lock,
  Send,
  Bell,
  Star,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useRoundParticipants,
  useJudgingCriteria,
  useRoundLeaderboard,
  useAllScored,
  usePendingJudges,
  useTeamScoreDetails,
  useSubmitCriteriaScore,
  useAddEvaluationNotes,
  useSubmitFinalScore,
  useSendLockRequest,
  useMyJudgingCompetitions,
  useCompetitionRounds,
} from "@/src/hooks/api/useJudging";
import { LoadingState } from "@/src/components/LoadingState";

/* ── helpers ─────────────────────────────────────────────────────── */

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

function SubmitChip({ submitted }) {
  if (submitted)
    return (
      <Chip
        icon={<CheckCircle2 size={11} />}
        label="Submitted"
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

/* ── ScoringPanel ─────────────────────────────────────────────────── */

function ScoringPanel({ team, roundId, criteria, onScoreSubmitted }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: scoreDetails } = useTeamScoreDetails(roundId, team?.teamId);
  const { mutateAsync: submitCriteriaScore } = useSubmitCriteriaScore();
  const { mutateAsync: addNotes } = useAddEvaluationNotes();
  const { mutateAsync: submitFinal } = useSubmitFinalScore();

  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from existing score details when team or details change
  useEffect(() => {
    if (!scoreDetails) return;
    const existingScores = {};
    const myScores =
      scoreDetails.criteriaScores ||
      scoreDetails.scores ||
      scoreDetails.myScores ||
      [];
    myScores.forEach((s) => {
      existingScores[s.criteriaId] = s.score;
    });
    if (Object.keys(existingScores).length > 0) setScores(existingScores);
    setNotes(scoreDetails.notes || scoreDetails.myNotes || "");
  }, [scoreDetails, team?.teamId]);

  // Calculate weighted total preview
  const weightedTotal = useMemo(() => {
    if (!criteria || criteria.length === 0) return null;
    let total = 0;
    let coveredWeight = 0;
    criteria.forEach((c) => {
      const s = scores[c.id];
      if (s != null) {
        const weight = parseFloat(c.weight) || 0;
        total += (s / (c.maxScore || 100)) * weight * 100;
        coveredWeight += weight;
      }
    });
    if (coveredWeight === 0) return null;
    return total.toFixed(2);
  }, [scores, criteria]);

  async function handleSubmit() {
    if (!team) return;
    const unanswered = criteria.filter((c) => scores[c.id] == null);
    if (unanswered.length > 0) {
      enqueueSnackbar(
        `Please score all ${unanswered.length} criterion${unanswered.length !== 1 ? "a" : ""} before submitting`,
        { variant: "warning" },
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Submit each criterion score
      for (const criterion of criteria) {
        await submitCriteriaScore({
          roundId,
          teamId: team.teamId,
          criteriaId: criterion.id,
          score: scores[criterion.id],
        });
      }

      // 2. Save evaluation notes if any
      if (notes.trim()) {
        await addNotes({ roundId, teamId: team.teamId, notes: notes.trim() });
      }

      // 3. Submit final score (backend calculates weighted total)
      await submitFinal({ roundId, teamId: team.teamId });

      enqueueSnackbar("Score submitted successfully!", { variant: "success" });
      onScoreSubmitted?.();
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || "Failed to submit score",
        { variant: "error" },
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!team) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          color: "#3f3f46",
          gap: 1.5,
        }}
      >
        <Users size={40} strokeWidth={1} />
        <Typography
          variant="body2"
          sx={{ color: "#52525b", fontFamily: "'Syne', sans-serif" }}
        >
          Select a team from the list to start scoring
        </Typography>
      </Box>
    );
  }

  const alreadySubmitted = team.hasSubmitted || team.isSubmitted;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Team header */}
      <Box>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f4f4f5",
            fontFamily: "'Syne', sans-serif",
            mb: 0.25,
          }}
        >
          {team.teamName}
        </Typography>
        <Typography variant="body2" sx={{ color: "#71717a" }}>
          {team.collegeName || "—"}
        </Typography>
        {alreadySubmitted && (
          <Box
            sx={{
              mt: 1.5,
              px: 2,
              py: 1,
              borderRadius: "8px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.15)",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <CheckCircle2 size={13} color="#4ade80" />
            <Typography
              variant="caption"
              sx={{ color: "#4ade80", fontWeight: 600 }}
            >
              You have already submitted a score for this team
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

      {/* Criteria */}
      {criteria.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            color: "#52525b",
          }}
        >
          <Typography variant="body2">
            No judging criteria defined for this round yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {criteria.map((criterion, idx) => {
            const score = scores[criterion.id] ?? "";
            const maxScore = criterion.maxScore || 100;
            const weight = Math.round(parseFloat(criterion.weight) * 100);
            return (
              <Box key={criterion.id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      {criterion.name}
                    </Typography>
                    {criterion.description && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#52525b", display: "block", mt: 0.25 }}
                      >
                        {criterion.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={`${weight}%`}
                      size="small"
                      sx={{
                        background: "rgba(168,85,247,0.1)",
                        color: "#c084fc",
                        fontSize: 11,
                        height: 20,
                      }}
                    />
                    <TextField
                      value={score}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          const next = { ...scores };
                          delete next[criterion.id];
                          setScores(next);
                          return;
                        }
                        const n = Math.max(
                          0,
                          Math.min(maxScore, parseInt(v, 10) || 0),
                        );
                        setScores((p) => ({ ...p, [criterion.id]: n }));
                      }}
                      disabled={alreadySubmitted}
                      type="number"
                      inputProps={{ min: 0, max: maxScore, step: 1 }}
                      size="small"
                      sx={{
                        width: 72,
                        "& .MuiInputBase-root": {
                          background: "#0c0c0c",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "8px",
                          color: "#f4f4f5",
                          fontSize: 13,
                          fontFamily: "'DM Mono', monospace",
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          py: 0.75,
                          px: 1,
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#3f3f46",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      / {maxScore}
                    </Typography>
                  </Box>
                </Box>
                <Slider
                  value={typeof score === "number" ? score : 0}
                  onChange={(_, val) =>
                    setScores((p) => ({ ...p, [criterion.id]: val }))
                  }
                  disabled={alreadySubmitted}
                  min={0}
                  max={maxScore}
                  step={1}
                  sx={{
                    color: "#a855f7",
                    "& .MuiSlider-thumb": {
                      width: 14,
                      height: 14,
                      backgroundColor: "#a855f7",
                      "&:hover, &.Mui-focusVisible": {
                        boxShadow: "0 0 0 8px rgba(168,85,247,0.15)",
                      },
                    },
                    "& .MuiSlider-rail": {
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "& .MuiSlider-track": {
                      background:
                        "linear-gradient(90deg, #a855f7 0%, #3b82f6 100%)",
                      border: "none",
                    },
                  }}
                />
                {idx < criteria.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: "rgba(255,255,255,0.04)",
                      mt: 1,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Eval notes */}
      <Box>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "#71717a",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          Evaluation Notes
        </Typography>
        <TextField
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={alreadySubmitted}
          placeholder="Add your observations, feedback, or notes about this team's performance…"
          sx={{
            "& .MuiInputBase-root": {
              background: "#0c0c0c",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              color: "#d4d4d8",
              fontSize: 13,
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#3f3f46",
              opacity: 1,
            },
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        />
      </Box>

      {/* Weighted total preview + submit */}
      {!alreadySubmitted && criteria.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            pt: 1,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#52525b", display: "block", mb: 0.25 }}
            >
              Weighted Total (preview)
            </Typography>
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: weightedTotal != null ? "#a855f7" : "#27272a",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {weightedTotal != null ? weightedTotal : "—"}
            </Typography>
          </Box>
          <Button
            onClick={handleSubmit}
            disabled={submitting || criteria.length === 0}
            variant="contained"
            startIcon={
              submitting ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <Send size={14} />
              )
            }
            sx={{
              background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
              color: "#fff",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              px: 3,
              py: 1,
              borderRadius: "10px",
              textTransform: "none",
              boxShadow: "0 0 20px rgba(168,85,247,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)",
                boxShadow: "0 0 28px rgba(168,85,247,0.4)",
              },
              "&:disabled": {
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.2)",
                boxShadow: "none",
              },
            }}
          >
            {submitting ? "Submitting…" : "Submit Score"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* ── Main page ─────────────────────────────────────────────────────── */

export default function JudgeScoringPage() {
  const { competitionId, roundId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const { data: participants = [], isLoading: loadingTeams } =
    useRoundParticipants(roundId);
  const { data: criteria = [], isLoading: loadingCriteria } =
    useJudgingCriteria(roundId);
  const { data: leaderboard = [], isLoading: loadingLeaderboard } =
    useRoundLeaderboard(roundId);
  const { data: allScored } = useAllScored(roundId);
  const { data: pendingJudges = [] } = usePendingJudges(roundId);
  const { data: rounds = [] } = useCompetitionRounds(competitionId);
  const { data: assignments = [] } = useMyJudgingCompetitions();

  const { mutate: sendLockRequest, isPending: sendingLock } =
    useSendLockRequest();

  const assignment = assignments.find(
    (a) => (a.competitionId || a.competition?.id) === competitionId,
  );
  const isHeadJudge = assignment?.isHeadJudge || false;
  const comp = assignment?.competition || {};
  const compName = comp.title || comp.name || "Competition";

  const round = rounds.find((r) => r.id === roundId);
  const roundName = round?.name || `Round ${round?.roundNumber || ""}`;

  const selectedTeam = participants.find((p) => p.teamId === selectedTeamId);

  // Build a set of teamIds already submitted by this judge from leaderboard
  const submittedTeamIds = useMemo(() => {
    const myEntry = leaderboard.filter((e) => e.submittedByMe);
    return new Set(myEntry.map((e) => e.teamId));
  }, [leaderboard]);

  function handleLockRequest() {
    sendLockRequest(roundId, {
      onSuccess: () =>
        enqueueSnackbar("Lock request sent to SA for approval!", {
          variant: "success",
        }),
      onError: (err) =>
        enqueueSnackbar(
          err?.response?.data?.message || "Failed to send lock request",
          { variant: "error" },
        ),
    });
  }

  if (loadingTeams || loadingCriteria) {
    return <LoadingState message="Loading scoring panel…" />;
  }

  const scoresLocked = round?.scoresLocked;

  return (
    <Box sx={{ maxWidth: 1300 }}>
      {/* ── Breadcrumb ── */}
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
          onClick={() =>
            router.push(`/admin/judge/competitions/${competitionId}/rounds`)
          }
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
        <Typography
          variant="body2"
          onClick={() =>
            router.push(`/admin/judge/competitions/${competitionId}/rounds`)
          }
          sx={{
            color: "#71717a",
            cursor: "pointer",
            "&:hover": { color: "#a1a1aa" },
          }}
        >
          {compName}
        </Typography>
        <Typography variant="body2" sx={{ color: "#3f3f46" }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: "#f4f4f5", fontWeight: 500 }}>
          {roundName}
        </Typography>
      </Box>

      {/* ── Round header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
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
          <Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.25 }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "#f4f4f5",
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {roundName}
              </Typography>
              {scoresLocked && (
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
            <Typography variant="body2" sx={{ color: "#71717a" }}>
              {participants.length} team
              {participants.length !== 1 ? "s" : ""} · {criteria.length}{" "}
              {criteria.length !== 1 ? "criteria" : "criterion"}
            </Typography>
          </Box>
        </Box>

        {/* Head Judge actions */}
        {isHeadJudge && !scoresLocked && (
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {!allScored && pendingJudges.length > 0 && (
              <Tooltip
                title={`${pendingJudges.length} judge${pendingJudges.length !== 1 ? "s" : ""} pending: ${pendingJudges.map((j) => j.name || j.email).join(", ")}`}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "8px",
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    cursor: "default",
                  }}
                >
                  <Bell size={13} color="#fbbf24" />
                  <Typography
                    variant="caption"
                    sx={{ color: "#fbbf24", fontWeight: 600 }}
                  >
                    {pendingJudges.length} judge
                    {pendingJudges.length !== 1 ? "s" : ""} pending
                  </Typography>
                </Box>
              </Tooltip>
            )}
            {allScored && (
              <Button
                onClick={handleLockRequest}
                disabled={sendingLock}
                startIcon={
                  sendingLock ? (
                    <CircularProgress size={13} sx={{ color: "#fff" }} />
                  ) : (
                    <Lock size={13} />
                  )
                }
                size="small"
                sx={{
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                  color: "#fff",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  px: 2,
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)",
                  },
                  "&:disabled": {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                Send Lock Request to SA
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* ── All-Scored status banner ── */}
      {allScored != null && !scoresLocked && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            mb: 3,
            borderRadius: "10px",
            background: allScored
              ? "rgba(34,197,94,0.08)"
              : "rgba(251,191,36,0.06)",
            border: allScored
              ? "1px solid rgba(34,197,94,0.2)"
              : "1px solid rgba(251,191,36,0.15)",
          }}
        >
          {allScored ? (
            <CheckCircle2 size={15} color="#4ade80" />
          ) : (
            <AlertCircle size={15} color="#fbbf24" />
          )}
          <Typography
            variant="body2"
            sx={{
              color: allScored ? "#4ade80" : "#fbbf24",
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            {allScored
              ? "All judges have submitted scores for all teams — round is ready to be locked"
              : `Waiting for ${pendingJudges.length > 0 ? pendingJudges.length + " " : ""}pending judge${pendingJudges.length !== 1 ? "s" : ""} to submit scores`}
          </Typography>
        </Box>
      )}

      {/* ── Two-column scoring area ── */}
      <Box
        sx={{
          display: "flex",
          gap: 2.5,
          alignItems: "flex-start",
          flexDirection: { xs: "column", lg: "row" },
          mb: 4,
        }}
      >
        {/* Left: team roster */}
        <Paper
          sx={{
            width: { xs: "100%", lg: 280 },
            flexShrink: 0,
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: "#52525b",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Teams ({participants.length})
            </Typography>
          </Box>

          {participants.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Users size={24} color="#27272a" style={{ marginBottom: 8 }} />
              <Typography variant="caption" sx={{ color: "#3f3f46" }}>
                No teams in this round
              </Typography>
            </Box>
          ) : (
            <Box>
              {participants.map((team) => {
                const isSelected = selectedTeamId === team.teamId;
                const submitted =
                  team.hasSubmitted ||
                  team.isSubmitted ||
                  submittedTeamIds.has(team.teamId);
                return (
                  <Box
                    key={team.teamId}
                    onClick={() => setSelectedTeamId(team.teamId)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      "&:last-child": { borderBottom: "none" },
                      background: isSelected
                        ? "rgba(168,85,247,0.08)"
                        : "transparent",
                      borderLeft: isSelected
                        ? "2px solid #a855f7"
                        : "2px solid transparent",
                      transition: "all 0.1s",
                      "&:hover": {
                        background: isSelected
                          ? "rgba(168,85,247,0.1)"
                          : "rgba(255,255,255,0.02)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: isSelected ? "#e4e4e7" : "#a1a1aa",
                          fontWeight: isSelected ? 600 : 400,
                          fontSize: 13,
                          lineHeight: 1.3,
                          flex: 1,
                          minWidth: 0,
                        }}
                        noWrap
                      >
                        {team.teamName}
                      </Typography>
                      <SubmitChip submitted={submitted} />
                    </Box>
                    {team.collegeName && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#3f3f46",
                          display: "block",
                          mt: 0.25,
                        }}
                        noWrap
                      >
                        {team.collegeName}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>

        {/* Right: scoring panel */}
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            p: 3,
          }}
        >
          <ScoringPanel
            team={selectedTeam}
            roundId={roundId}
            criteria={criteria}
            onScoreSubmitted={() => setSelectedTeamId(null)}
          />
        </Paper>
      </Box>

      {/* ── Live Leaderboard ── */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "7px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trophy size={13} color="rgba(255,255,255,0.6)" />
          </Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Live Leaderboard
          </Typography>
          <Typography variant="caption" sx={{ color: "#3f3f46" }}>
            (average across all judges)
          </Typography>
        </Box>

        <Paper
          sx={{
            background: "#0a0a0a",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {loadingLeaderboard ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={20} sx={{ color: "#a855f7" }} />
            </Box>
          ) : leaderboard.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Star size={28} color="#27272a" style={{ marginBottom: 12 }} />
              <Typography variant="body2" sx={{ color: "#52525b" }}>
                Leaderboard will populate as judges submit scores
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
                      Judges Scored
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry, idx) => (
                    <TableRow
                      key={entry.teamId}
                      sx={{
                        "&:hover": {
                          background: "rgba(255,255,255,0.018)",
                        },
                        "&:last-child td": { border: 0 },
                      }}
                    >
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
                      <TableCell sx={cellSx}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#f4f4f5", fontWeight: 600 }}
                        >
                          {entry.teamName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Typography variant="body2" sx={{ color: "#71717a" }}>
                          {entry.collegeName || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              entry.avgScore != null ? "#a855f7" : "#3f3f46",
                            fontWeight: entry.avgScore != null ? 700 : 400,
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {entry.avgScore != null
                            ? Number(entry.avgScore).toFixed(2)
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              entry.judgesScored > 0 ? "#4ade80" : "#52525b",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {entry.judgesScored ?? "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
