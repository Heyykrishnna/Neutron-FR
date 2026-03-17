"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  InputBase,
} from "@mui/material";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Crown,
  ChevronRight,
  Plus,
  Lock,
  Users,
  Search,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCompetition,
  useCompetitionJudges,
  useAssignJudge,
  useRemoveJudge,
} from "@/src/hooks/api/useCompetitions";
import {
  useAdminCompetitionRounds,
  useAdminCompetitionTeams,
  useCreateRound,
} from "@/src/hooks/api/useJudging";
import { useUsers } from "@/src/hooks/api/useUsers";
import { LoadingState } from "@/src/components/LoadingState";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

// ── helpers ──────────────────────────────────────────────────────────────────

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
    bg: "rgba(59,130,246,0.12)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(239,68,68,0.12)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
  POSTPONED: {
    label: "Postponed",
    bg: "rgba(249,115,22,0.12)",
    text: "#fb923c",
    border: "rgba(249,115,22,0.2)",
  },
};

function Pill({ bg, text, border, children }) {
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.3,
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

function qualColor(status) {
  if (status === "QUALIFIED")
    return {
      bg: "rgba(34,197,94,0.12)",
      text: "#4ade80",
      border: "rgba(34,197,94,0.2)",
    };
  if (status === "ELIMINATED")
    return {
      bg: "rgba(239,68,68,0.12)",
      text: "#f87171",
      border: "rgba(239,68,68,0.2)",
    };
  return {
    bg: "rgba(161,161,170,0.1)",
    text: "#a1a1aa",
    border: "rgba(161,161,170,0.2)",
  };
}

// ── CreateRoundDialog ────────────────────────────────────────────────────────

function CreateRoundDialog({
  open,
  onClose,
  competitionId,
  existingRoundCount,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [roundName, setRoundName] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [teamSearch, setTeamSearch] = useState("");

  const { data: teams = [], isLoading: teamsLoading } =
    useAdminCompetitionTeams(open ? competitionId : null);
  const { mutate: createRound, isPending } = useCreateRound();

  const isFirstRound = existingRoundCount === 0;

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.collegeName?.toLowerCase().includes(q),
    );
  }, [teams, teamSearch]);

  function toggleTeam(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filteredTeams.map((t) => t.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleClose() {
    setRoundName("");
    setSelected(new Set());
    setTeamSearch("");
    onClose();
  }

  function handleCreate() {
    if (!roundName.trim()) {
      enqueueSnackbar("Please enter a round name", { variant: "warning" });
      return;
    }
    if (selected.size === 0) {
      enqueueSnackbar("Select at least one team", { variant: "warning" });
      return;
    }
    createRound(
      { competitionId, name: roundName.trim(), teamIds: Array.from(selected) },
      {
        onSuccess: () => {
          enqueueSnackbar("Round created successfully", { variant: "success" });
          handleClose();
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to create round",
            { variant: "error" },
          ),
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#f4f4f5",
          fontWeight: 600,
          fontFamily: "'Syne', sans-serif",
          fontSize: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          pb: 2,
        }}
      >
        Create New Round
      </DialogTitle>

      <DialogContent
        sx={{
          pt: "20px !important",
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {/* Round name */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "#71717a",
              display: "block",
              mb: 0.75,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: 10,
            }}
          >
            Round Name
          </Typography>
          <InputBase
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            placeholder="e.g. Preliminary Round, Finals…"
            sx={{
              width: "100%",
              px: 1.5,
              py: 1,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              color: "#f4f4f5",
              fontSize: 14,
              "&:focus-within": { borderColor: "#a855f7" },
              "& input::placeholder": { color: "#52525b" },
            }}
          />
        </Box>

        {/* Team selection */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#71717a",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: 10,
              }}
            >
              Select Teams ({selected.size} selected)
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Typography
                component="span"
                variant="caption"
                onClick={selectAll}
                sx={{
                  color: "#a855f7",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                All
              </Typography>
              <Typography
                component="span"
                variant="caption"
                sx={{ color: "#3f3f46" }}
              >
                |
              </Typography>
              <Typography
                component="span"
                variant="caption"
                onClick={clearAll}
                sx={{
                  color: "#71717a",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Clear
              </Typography>
            </Box>
          </Box>

          {/* Team search */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              mb: 1,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Search size={14} color="#52525b" />
            <InputBase
              placeholder="Search teams…"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              sx={{
                flex: 1,
                color: "#d4d4d8",
                fontSize: 13,
                "& input::placeholder": { color: "#52525b" },
              }}
            />
          </Box>

          {/* Teams list */}
          <Box
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(168,85,247,0.3)",
                borderRadius: 2,
              },
            }}
          >
            {teamsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} sx={{ color: "#a855f7" }} />
              </Box>
            ) : filteredTeams.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#52525b" }}>
                  {teams.length === 0
                    ? "No approved teams found"
                    : "No teams match search"}
                </Typography>
              </Box>
            ) : (
              filteredTeams.map((team) => {
                const qc = qualColor(team.prevRoundStatus);
                const isChecked = selected.has(team.id);
                return (
                  <Box
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.25,
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: isChecked
                        ? "rgba(168,85,247,0.06)"
                        : "transparent",
                      "&:last-child": { borderBottom: "none" },
                      "&:hover": {
                        background: isChecked
                          ? "rgba(168,85,247,0.08)"
                          : "rgba(255,255,255,0.02)",
                      },
                      transition: "background 0.1s",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Checkbox
                        checked={isChecked}
                        size="small"
                        sx={{
                          p: 0,
                          color: "#3f3f46",
                          "&.Mui-checked": { color: "#a855f7" },
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleTeam(team.id)}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#f4f4f5",
                            fontWeight: 500,
                            lineHeight: 1.3,
                          }}
                        >
                          {team.name}
                        </Typography>
                        {team.collegeName && (
                          <Typography
                            variant="caption"
                            sx={{ color: "#52525b" }}
                          >
                            {team.collegeName}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Previous round qualification status */}
                    {!isFirstRound && team.prevRoundStatus && (
                      <Pill bg={qc.bg} text={qc.text} border={qc.border}>
                        {team.prevRoundStatus === "QUALIFIED"
                          ? `R${team.prevRoundNumber} Qualified`
                          : team.prevRoundStatus === "ELIMINATED"
                            ? `R${team.prevRoundNumber} Eliminated`
                            : "Pending"}
                      </Pill>
                    )}
                    {!isFirstRound && !team.prevRoundStatus && (
                      <Pill
                        bg="rgba(100,100,100,0.08)"
                        text="#52525b"
                        border="rgba(100,100,100,0.12)"
                      >
                        Not in prev round
                      </Pill>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            color: "rgba(255,255,255,0.5)",
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            px: 2.5,
            "&:hover": {
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.2)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isPending || !roundName.trim() || selected.size === 0}
          variant="contained"
          startIcon={
            isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <Plus size={14} />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
            color: "#fff",
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            borderRadius: "8px",
            fontWeight: 600,
            px: 2.5,
            "&:hover": {
              background: "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)",
            },
            "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
          }}
        >
          Create Round
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── AddJudgeRow ──────────────────────────────────────────────────────────────

function AddJudgeRow({ competitionId, allUsers }) {
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isHeadJudge, setIsHeadJudge] = useState(false);
  const { mutate: assignJudge, isPending } = useAssignJudge();

  const suggestions = useMemo(() => {
    if (!search.trim() || !allUsers) return [];
    const q = search.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [search, allUsers]);

  function handleAssign() {
    if (!selectedUser) return;
    assignJudge(
      { competitionId, judgeUserId: selectedUser.id, isHeadJudge },
      {
        onSuccess: () => {
          enqueueSnackbar(`${selectedUser.name} assigned as judge`, {
            variant: "success",
          });
          setSearch("");
          setSelectedUser(null);
          setIsHeadJudge(false);
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to assign judge",
            { variant: "error" },
          ),
      },
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* Search input */}
        <Box sx={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              "&:focus-within": { borderColor: "#a855f7" },
            }}
          >
            <Search size={14} color="#71717a" />
            <InputBase
              placeholder="Search by name or email…"
              value={selectedUser ? selectedUser.name : search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedUser(null);
              }}
              sx={{
                flex: 1,
                color: "#f4f4f5",
                fontSize: 14,
                "& input::placeholder": { color: "#52525b" },
              }}
            />
          </Box>
          {/* Dropdown */}
          {suggestions.length > 0 && !selectedUser && (
            <Paper
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 100,
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {suggestions.map((u) => (
                <Box
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setSearch("");
                  }}
                  sx={{
                    px: 2,
                    py: 1.25,
                    cursor: "pointer",
                    "&:hover": { background: "rgba(168,85,247,0.08)" },
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#f4f4f5", fontWeight: 500 }}
                  >
                    {u.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#71717a" }}>
                    {u.email}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Head Judge toggle */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isHeadJudge}
              onChange={(e) => setIsHeadJudge(e.target.checked)}
              size="small"
              sx={{ color: "#3f3f46", "&.Mui-checked": { color: "#a855f7" } }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ color: "#a1a1aa", userSelect: "none" }}
            >
              Head Judge
            </Typography>
          }
        />

        {/* Assign button */}
        <Button
          onClick={handleAssign}
          disabled={!selectedUser || isPending}
          variant="contained"
          size="small"
          startIcon={
            isPending ? (
              <CircularProgress size={12} color="inherit" />
            ) : (
              <UserPlus size={14} />
            )
          }
          sx={{
            background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
            color: "#fff",
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            borderRadius: "8px",
            fontWeight: 600,
            alignSelf: "flex-start",
            mt: 0.25,
            "&:hover": {
              background: "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)",
            },
            "&.Mui-disabled": { opacity: 0.45, color: "#fff" },
          }}
        >
          Assign
        </Button>
      </Box>
    </Box>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CompetitionJudgingPage() {
  const { competitionId } = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [createRoundOpen, setCreateRoundOpen] = useState(false);

  const { data: competition, isLoading: compLoading } =
    useCompetition(competitionId);
  const { data: judges = [], isLoading: judgesLoading } =
    useCompetitionJudges(competitionId);
  const { data: rounds = [], isLoading: roundsLoading } =
    useAdminCompetitionRounds(competitionId);
  const { data: allUsers = [] } = useUsers();
  const { mutate: removeJudge, isPending: removingJudge } = useRemoveJudge();

  // Toggle head judge role inline
  const { mutate: toggleHeadJudge } = useMutation({
    mutationFn: async ({ assignmentId, isHeadJudge }) => {
      const { data } = await apiClient.patch(
        `/competitions/judges/${assignmentId}`,
        { isHeadJudge },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.judges(competitionId),
      });
    },
    onError: (err) =>
      enqueueSnackbar(err?.response?.data?.message || "Failed to update role", {
        variant: "error",
      }),
  });

  function handleRemoveJudge(judge) {
    removeJudge(
      { judgeAssignmentId: judge.id, competitionId },
      {
        onSuccess: () =>
          enqueueSnackbar(`${judge.user?.name || "Judge"} removed`, {
            variant: "success",
          }),
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to remove judge",
            { variant: "error" },
          ),
      },
    );
  }

  const sc = STATUS_CONFIG[competition?.status] || STATUS_CONFIG.DRAFT;

  if (compLoading) {
    return <LoadingState message="Loading competition…" />;
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      {/* ── Breadcrumb + header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
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
        <Typography variant="body2" sx={{ color: "#f4f4f5", fontWeight: 500 }}>
          {competition?.title || "—"}
        </Typography>
      </Box>

      <Box
        sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 4, mt: 1 }}
      >
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
              {competition?.title}
            </Typography>
            <Pill bg={sc.bg} text={sc.text} border={sc.border}>
              {sc.label}
            </Pill>
            {competition?.eventType && (
              <Pill
                bg="rgba(168,85,247,0.12)"
                text="#c084fc"
                border="rgba(168,85,247,0.2)"
              >
                {competition.eventType}
              </Pill>
            )}
          </Box>
          {competition?.shortDescription && (
            <Typography variant="body2" sx={{ color: "#71717a", mt: 0.5 }}>
              {competition.shortDescription}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Section A: Judges ── */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={15} color="#a855f7" />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#f4f4f5",
              fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Judges
          </Typography>
          <Chip
            label={judges.length}
            size="small"
            sx={{
              background: "rgba(168,85,247,0.12)",
              color: "#c084fc",
              height: 20,
              fontSize: 11,
            }}
          />
        </Box>

        {judgesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={20} sx={{ color: "#a855f7" }} />
          </Box>
        ) : judges.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#52525b", py: 1 }}>
            No judges assigned yet.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {judges.map((judge) => {
              const name = judge.user?.name || judge.name || "—";
              const email = judge.user?.email || judge.email || "";
              return (
                <Box
                  key={judge.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.25,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      src={judge.user?.image || null}
                      sx={{
                        width: 32,
                        height: 32,
                        background: "#1e1e1e",
                        fontSize: 12,
                        color: "#a855f7",
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "#f4f4f5", fontWeight: 500 }}
                        >
                          {name}
                        </Typography>
                        {judge.isHeadJudge && (
                          <Chip
                            icon={<Crown size={10} />}
                            label="Head Judge"
                            size="small"
                            sx={{
                              background: "rgba(251,191,36,0.12)",
                              color: "#fbbf24",
                              height: 18,
                              fontSize: 10,
                              "& .MuiChip-icon": { color: "#fbbf24", ml: 0.5 },
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        )}
                      </Box>
                      {email && (
                        <Typography variant="caption" sx={{ color: "#71717a" }}>
                          {email}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip
                      title={
                        judge.isHeadJudge
                          ? "Revoke Head Judge"
                          : "Set as Head Judge"
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          toggleHeadJudge({
                            assignmentId: judge.id,
                            isHeadJudge: !judge.isHeadJudge,
                          })
                        }
                        sx={{
                          color: judge.isHeadJudge ? "#fbbf24" : "#3f3f46",
                          "&:hover": {
                            color: "#fbbf24",
                            background: "rgba(251,191,36,0.08)",
                          },
                        }}
                      >
                        <Crown size={15} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove judge">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveJudge(judge)}
                        sx={{
                          color: "#3f3f46",
                          "&:hover": {
                            color: "#f87171",
                            background: "rgba(239,68,68,0.08)",
                          },
                        }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mb: 2 }} />
        <Typography
          variant="caption"
          sx={{
            color: "#71717a",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "block",
            mb: 1,
            fontSize: 10,
          }}
        >
          Add Judge
        </Typography>
        <AddJudgeRow competitionId={competitionId} allUsers={allUsers} />
      </Paper>

      {/* ── Section B: Rounds ── */}
      <Paper
        sx={{
          p: 3,
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#f4f4f5",
                fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Rounds
            </Typography>
            <Chip
              label={rounds.length}
              size="small"
              sx={{
                background: "rgba(168,85,247,0.12)",
                color: "#c084fc",
                height: 20,
                fontSize: 11,
              }}
            />
          </Box>

          <Button
            onClick={() => setCreateRoundOpen(true)}
            variant="outlined"
            size="small"
            startIcon={<Plus size={14} />}
            sx={{
              color: "#a855f7",
              borderColor: "rgba(168,85,247,0.35)",
              textTransform: "none",
              fontFamily: "'Syne', sans-serif",
              borderRadius: "8px",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#a855f7",
                background: "rgba(168,85,247,0.06)",
              },
            }}
          >
            Create New Round
          </Button>
        </Box>

        {roundsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} sx={{ color: "#a855f7" }} />
          </Box>
        ) : rounds.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: "10px",
            }}
          >
            <Typography variant="body2" sx={{ color: "#52525b" }}>
              No rounds yet — create the first one above
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rounds.map((round) => (
              <Box
                key={round.id}
                onClick={() =>
                  router.push(
                    `/admin/dh/judging/${competitionId}/rounds/${round.id}`,
                  )
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 2,
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "#0d0d0d",
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                  "&:hover": {
                    borderColor: "rgba(168,85,247,0.3)",
                    background: "rgba(168,85,247,0.03)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "8px",
                      flexShrink: 0,
                      background: "rgba(168,85,247,0.1)",
                      border: "1px solid rgba(168,85,247,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#a855f7",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {round.roundNumber}
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#f4f4f5", fontWeight: 600 }}
                    >
                      {round.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#71717a" }}>
                      {round.teamCount} team{round.teamCount !== 1 ? "s" : ""}
                      {round.scoresLocked ? " · Scores locked" : ""}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                  <ChevronRight size={16} color="#3f3f46" />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <CreateRoundDialog
        open={createRoundOpen}
        onClose={() => setCreateRoundOpen(false)}
        competitionId={competitionId}
        existingRoundCount={rounds.length}
      />
    </Box>
  );
}
