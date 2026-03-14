"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Alert,
} from "@mui/material";
import {
  Users,
  UserPlus,
  Trash2,
  Trophy,
  Lock,
  Unlock,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { useSnackbar } from "notistack";
import {
  useCompetitions,
  useCompetitionJudges,
  useCompetitionVolunteers,
  useToggleRegistrations,
  useFreezeChanges,
  useToggleReadOnlyMode,
  useCancelOrPostpone,
  useAssignJudge,
  useRemoveJudge,
  useAssignVolunteer,
  useRemoveVolunteer,
} from "@/src/hooks/api/useCompetitions";
import { useUsers } from "@/src/hooks/api/useUsers";
import { LoadingState } from "@/src/components/LoadingState";

// ─────────────────────────────────────────────────────────── helpers ──

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "#3f3f46" },
    "&:hover fieldset": { borderColor: "#71717a" },
    "&.Mui-focused fieldset": { borderColor: "#a855f7" },
  },
  "& .MuiInputLabel-root": { color: "#71717a" },
  "& .MuiSelect-icon": { color: "#71717a" },
};

const cellSx = { color: "#d4d4d8", borderColor: "#27272a" };
const headSx = { color: "#a1a1aa", borderColor: "#27272a", fontWeight: 600 };

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", bgColor: "#3f3f4622", color: "#a1a1aa" },
  OPEN: { label: "Open", bgColor: "#16a34a22", color: "#4ade80" },
  CLOSED: { label: "Closed", bgColor: "#ca8a0422", color: "#fbbf24" },
  ARCHIVED: { label: "Archived", bgColor: "#0369a122", color: "#38bdf8" },
  CANCELLED: { label: "Cancelled", bgColor: "#dc262622", color: "#f87171" },
  POSTPONED: { label: "Postponed", bgColor: "#92400e22", color: "#fb923c" },
};

// ─────────────────────────────────────── sub-component: toggle switch ──

function CompetitionToggles({ competition, onRefresh }) {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: toggleReg, isPending: togglingReg } =
    useToggleRegistrations();
  const { mutate: freeze, isPending: freezing } = useFreezeChanges();
  const { mutate: toggleReadonly, isPending: togglingRO } =
    useToggleReadOnlyMode();

  function toggle(action, label) {
    action(competition.id, {
      onSuccess: () => {
        enqueueSnackbar(`${label} updated`, { variant: "success" });
        onRefresh?.();
      },
      onError: (err) => {
        enqueueSnackbar(
          err?.response?.data?.message ||
            err?.message ||
            `Failed to update ${label}`,
          { variant: "error" },
        );
      },
    });
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      <FormControlLabel
        control={
          <Switch
            checked={!!competition.registrationsOpen}
            onChange={() => toggle(toggleReg, "Registrations")}
            disabled={togglingReg}
            size="small"
            sx={{ "& .MuiSwitch-thumb": { backgroundColor: "#a855f7" } }}
          />
        }
        label={
          <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
            Reg. Open
          </Typography>
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!competition.changesFrozen}
            onChange={() => toggle(freeze, "Changes freeze")}
            disabled={freezing}
            size="small"
          />
        }
        label={
          <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
            Frozen
          </Typography>
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!competition.readOnlyMode}
            onChange={() => toggle(toggleReadonly, "Read-only mode")}
            disabled={togglingRO}
            size="small"
          />
        }
        label={
          <Typography variant="caption" sx={{ color: "#a1a1aa" }}>
            Read-only
          </Typography>
        }
      />
    </Box>
  );
}

// ──────────────────────────────────── sub-component: manage dialog ──

function ManageDialog({ competition, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);

  // Judge management
  const [judgeUserId, setJudgeUserId] = useState("");
  const { data: judges = [], isLoading: judgesLoading } = useCompetitionJudges(
    open ? competition?.id : null,
  );
  const { data: judgeUsers = [] } = useUsers({ role: "JUDGE", limit: 200 });
  const { mutate: assignJudge, isPending: assigningJudge } = useAssignJudge();
  const { mutate: removeJudge } = useRemoveJudge();
  const [removingJudgeId, setRemovingJudgeId] = useState(null);

  // Volunteer management
  const [volunteerUserId, setVolunteerUserId] = useState("");
  const { data: volunteers = [], isLoading: volunteersLoading } =
    useCompetitionVolunteers(open ? competition?.id : null);
  const { data: volunteerUsers = [] } = useUsers({
    role: "VOLUNTEER",
    limit: 500,
  });
  const { mutate: assignVolunteer, isPending: assigningVol } =
    useAssignVolunteer();
  const { mutate: removeVolunteer } = useRemoveVolunteer();
  const [removingVolId, setRemovingVolId] = useState(null);

  // Cancel / postpone
  const [dangerAction, setDangerAction] = useState("");
  const [dangerDate, setDangerDate] = useState("");
  const [dangerNote, setDangerNote] = useState("");
  const { mutate: cancelOrPostpone, isPending: dangerPending } =
    useCancelOrPostpone();

  function handleAssignJudge() {
    if (!judgeUserId) return;
    assignJudge(
      { competitionId: competition.id, judgeUserId },
      {
        onSuccess: () => {
          enqueueSnackbar("Judge assigned", { variant: "success" });
          setJudgeUserId("");
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to assign judge",
            { variant: "error" },
          ),
      },
    );
  }

  function handleRemoveJudge(assignmentId) {
    setRemovingJudgeId(assignmentId);
    removeJudge(assignmentId, {
      onSuccess: () => enqueueSnackbar("Judge removed", { variant: "success" }),
      onError: (err) =>
        enqueueSnackbar(
          err?.response?.data?.message || "Failed to remove judge",
          { variant: "error" },
        ),
      onSettled: () => setRemovingJudgeId(null),
    });
  }

  function handleAssignVolunteer() {
    if (!volunteerUserId) return;
    assignVolunteer(
      { competitionId: competition.id, userId: volunteerUserId },
      {
        onSuccess: () => {
          enqueueSnackbar("Volunteer assigned", { variant: "success" });
          setVolunteerUserId("");
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to assign volunteer",
            { variant: "error" },
          ),
      },
    );
  }

  function handleRemoveVolunteer(assignmentId) {
    setRemovingVolId(assignmentId);
    removeVolunteer(assignmentId, {
      onSuccess: () =>
        enqueueSnackbar("Volunteer removed", { variant: "success" }),
      onError: (err) =>
        enqueueSnackbar(
          err?.response?.data?.message || "Failed to remove volunteer",
          { variant: "error" },
        ),
      onSettled: () => setRemovingVolId(null),
    });
  }

  function handleDangerAction() {
    cancelOrPostpone(
      {
        competitionId: competition.id,
        action: dangerAction,
        newDate: dangerDate || undefined,
        notes: dangerNote || undefined,
      },
      {
        onSuccess: () => {
          enqueueSnackbar(
            `Competition ${dangerAction === "cancel" ? "cancelled" : "postponed"}`,
            { variant: "success" },
          );
          onClose();
        },
        onError: (err) =>
          enqueueSnackbar(err?.response?.data?.message || "Action failed", {
            variant: "error",
          }),
      },
    );
  }

  if (!competition) return null;

  // Determine which judgeUsers/volunteerUsers are not yet assigned
  const assignedJudgeIds = new Set(judges.map((j) => j.userId || j.user?.id));
  const availableJudges = judgeUsers.filter((u) => !assignedJudgeIds.has(u.id));
  const assignedVolIds = new Set(volunteers.map((v) => v.userId || v.user?.id));
  const availableVols = volunteerUsers.filter((u) => !assignedVolIds.has(u.id));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: "#fff", fontWeight: 700, pb: 0 }}>
        {competition.name || competition.title}
        <Typography
          variant="caption"
          sx={{ color: "#71717a", display: "block" }}
        >
          Manage judges, volunteers and controls
        </Typography>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          px: 3,
          "& .MuiTab-root": {
            color: "#71717a",
            textTransform: "none",
            fontWeight: 500,
          },
          "& .Mui-selected": { color: "#fff" },
          "& .MuiTabs-indicator": { backgroundColor: "#a855f7" },
        }}
      >
        <Tab label="Judges" />
        <Tab label="Volunteers" />
        <Tab label="Controls" />
      </Tabs>
      <Divider sx={{ borderColor: "#27272a" }} />

      <DialogContent sx={{ pt: 2 }}>
        {/* ── JUDGES TAB ── */}
        {tab === 0 && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                select
                label="Add judge"
                value={judgeUserId}
                onChange={(e) => setJudgeUserId(e.target.value)}
                size="small"
                fullWidth
                sx={inputSx}
              >
                <MenuItem value="">Select a judge…</MenuItem>
                {availableJudges.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleAssignJudge}
                disabled={!judgeUserId || assigningJudge}
                startIcon={
                  assigningJudge ? (
                    <CircularProgress size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )
                }
                sx={{
                  backgroundColor: "#a855f7",
                  "&:hover": { backgroundColor: "#9333ea" },
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Add
              </Button>
            </Box>
            {judgesLoading ? (
              <LoadingState message="Loading judges…" size="small" />
            ) : judges.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#52525b", py: 2 }}>
                No judges assigned yet
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {judges.map((j) => {
                  const name = j.user?.name || j.userName || j.name || "—";
                  const email = j.user?.email || j.userEmail || j.email || "";
                  const isRemoving = removingJudgeId === j.id;
                  return (
                    <Box
                      key={j.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#1f1f23",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#7c3aed",
                          fontSize: 13,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#fff", fontWeight: 500 }}
                        >
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#71717a" }}>
                          {email}
                        </Typography>
                      </Box>
                      {j.isHeadJudge && (
                        <Chip
                          label="Head"
                          size="small"
                          sx={{
                            backgroundColor: "#a855f720",
                            color: "#c084fc",
                            fontSize: 10,
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveJudge(j.id)}
                        disabled={isRemoving}
                        sx={{
                          color: "#f87171",
                          "&:hover": { backgroundColor: "#ef444420" },
                        }}
                      >
                        {isRemoving ? (
                          <CircularProgress size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* ── VOLUNTEERS TAB ── */}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                select
                label="Add volunteer"
                value={volunteerUserId}
                onChange={(e) => setVolunteerUserId(e.target.value)}
                size="small"
                fullWidth
                sx={inputSx}
              >
                <MenuItem value="">Select a volunteer…</MenuItem>
                {availableVols.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleAssignVolunteer}
                disabled={!volunteerUserId || assigningVol}
                startIcon={
                  assigningVol ? (
                    <CircularProgress size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )
                }
                sx={{
                  backgroundColor: "#a855f7",
                  "&:hover": { backgroundColor: "#9333ea" },
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Add
              </Button>
            </Box>
            {volunteersLoading ? (
              <LoadingState message="Loading volunteers…" size="small" />
            ) : volunteers.length === 0 ? (
              <Typography variant="body2" sx={{ color: "#52525b", py: 2 }}>
                No volunteers assigned yet
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {volunteers.map((v) => {
                  const name = v.user?.name || v.userName || v.name || "—";
                  const email = v.user?.email || v.userEmail || v.email || "";
                  const isRemoving = removingVolId === v.id;
                  return (
                    <Box
                      key={v.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#1f1f23",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: "#0369a1",
                          fontSize: 13,
                        }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "#fff", fontWeight: 500 }}
                        >
                          {name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#71717a" }}>
                          {email}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveVolunteer(v.id)}
                        disabled={isRemoving}
                        sx={{
                          color: "#f87171",
                          "&:hover": { backgroundColor: "#ef444420" },
                        }}
                      >
                        {isRemoving ? (
                          <CircularProgress size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* ── CONTROLS TAB ── */}
        {tab === 2 && (
          <Box>
            <Alert
              severity="warning"
              icon={<AlertTriangle size={16} />}
              sx={{
                backgroundColor: "#92400e22",
                color: "#fbbf24",
                border: "1px solid #92400e",
                mb: 3,
                "& .MuiAlert-icon": { color: "#fbbf24" },
              }}
            >
              These actions are irreversible. Proceed with caution.
            </Alert>

            <Typography
              variant="subtitle2"
              sx={{ color: "#a1a1aa", mb: 1.5, fontWeight: 600 }}
            >
              Cancel or Postpone Competition
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                label="Action"
                value={dangerAction}
                onChange={(e) => setDangerAction(e.target.value)}
                size="small"
                fullWidth
                sx={inputSx}
              >
                <MenuItem value="">Select action…</MenuItem>
                <MenuItem value="cancel">Cancel competition</MenuItem>
                <MenuItem value="postpone">Postpone competition</MenuItem>
              </TextField>

              {dangerAction === "postpone" && (
                <TextField
                  label="New Date"
                  type="datetime-local"
                  value={dangerDate}
                  onChange={(e) => setDangerDate(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                />
              )}

              <TextField
                label="Notes (optional)"
                multiline
                rows={2}
                value={dangerNote}
                onChange={(e) => setDangerNote(e.target.value)}
                size="small"
                fullWidth
                sx={inputSx}
              />

              <Button
                variant="contained"
                onClick={handleDangerAction}
                disabled={!dangerAction || dangerPending}
                startIcon={
                  dangerPending ? (
                    <CircularProgress size={14} />
                  ) : dangerAction === "cancel" ? (
                    <XCircle size={14} />
                  ) : (
                    <Clock size={14} />
                  )
                }
                sx={{
                  backgroundColor: "#dc2626",
                  "&:hover": { backgroundColor: "#b91c1c" },
                  textTransform: "none",
                  fontWeight: 600,
                  alignSelf: "flex-start",
                }}
              >
                {dangerAction === "postpone"
                  ? "Postpone"
                  : "Cancel Competition"}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ color: "#71717a", textTransform: "none" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────── main page ──

export default function CompetitionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [manageTarget, setManageTarget] = useState(null);

  const { data: competitions = [], isLoading, refetch } = useCompetitions();

  const filtered = competitions.filter((c) => {
    const name = (c.name || c.title || "").toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}
        >
          Competitions
        </Typography>
        <Typography variant="body2" sx={{ color: "#71717a" }}>
          Manage competition settings, judges, volunteers and controls
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Search competitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 260, ...inputSx }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 180, ...inputSx }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <MenuItem key={key} value={key}>
              {cfg.label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading competitions…" />
      ) : filtered.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 3,
          }}
        >
          <Trophy size={40} color="#3f3f46" style={{ marginBottom: 12 }} />
          <Typography sx={{ color: "#71717a" }}>
            No competitions found
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 3,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Competition</TableCell>
                <TableCell sx={headSx}>Status</TableCell>
                <TableCell sx={headSx}>Type</TableCell>
                <TableCell sx={headSx}>Registrations</TableCell>
                <TableCell sx={headSx}>Controls</TableCell>
                <TableCell sx={{ ...headSx, textAlign: "right" }}>
                  Manage
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((comp) => {
                const statusCfg =
                  STATUS_CONFIG[comp.status] || STATUS_CONFIG.DRAFT;
                return (
                  <TableRow
                    key={comp.id}
                    sx={{ "&:hover": { backgroundColor: "#1f1f23" } }}
                  >
                    {/* Name */}
                    <TableCell sx={cellSx}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#fff", fontWeight: 600 }}
                      >
                        {comp.name || comp.title}
                      </Typography>
                      {comp.description && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#52525b",
                            display: "block",
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {comp.description}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={cellSx}>
                      <Chip
                        label={statusCfg.label}
                        size="small"
                        sx={{
                          backgroundColor: statusCfg.bgColor,
                          color: statusCfg.color,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </TableCell>

                    {/* Type */}
                    <TableCell sx={cellSx}>
                      {comp.type && (
                        <Chip
                          label={comp.type}
                          size="small"
                          sx={{
                            backgroundColor:
                              comp.type === "TEAM" ? "#7c3aed22" : "#0369a122",
                            color: comp.type === "TEAM" ? "#a78bfa" : "#38bdf8",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Registrations open indicator */}
                    <TableCell sx={cellSx}>
                      <Chip
                        label={comp.registrationsOpen ? "Open" : "Closed"}
                        size="small"
                        icon={
                          comp.registrationsOpen ? (
                            <Unlock size={12} />
                          ) : (
                            <Lock size={12} />
                          )
                        }
                        sx={{
                          backgroundColor: comp.registrationsOpen
                            ? "#16a34a22"
                            : "#3f3f4622",
                          color: comp.registrationsOpen ? "#4ade80" : "#71717a",
                          fontSize: 11,
                          "& .MuiChip-icon": {
                            color: comp.registrationsOpen
                              ? "#4ade80"
                              : "#71717a",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Inline toggle controls */}
                    <TableCell sx={cellSx}>
                      <CompetitionToggles
                        competition={comp}
                        onRefresh={refetch}
                      />
                    </TableCell>

                    {/* Manage button */}
                    <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setManageTarget(comp)}
                        startIcon={<Users size={14} />}
                        sx={{
                          borderColor: "#3f3f46",
                          color: "#a1a1aa",
                          "&:hover": {
                            borderColor: "#a855f7",
                            color: "#a855f7",
                          },
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Manage dialog */}
      <ManageDialog
        competition={manageTarget}
        open={!!manageTarget}
        onClose={() => setManageTarget(null)}
      />
    </Box>
  );
}
