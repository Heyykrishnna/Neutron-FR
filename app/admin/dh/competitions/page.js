"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Dialog,
  CircularProgress,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Search,
  Plus,
  Send,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  XCircle,
  Clock,
  Pencil,
  MoreVertical,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCompetitions,
  useDeleteCompetition,
  useCompetitionJudges,
  useCompetitionVolunteers,
  useToggleRegistrations,
  useFreezeChanges,
  useToggleReadOnlyMode,
  useCancelOrPostpone,
  useUpdateCompetition,
  useAssignJudge,
  useRemoveJudge,
  useAssignVolunteer,
  useRemoveVolunteer,
  useCompetitionClubs,
  useAssignClubToCompetition,
  useRemoveClubFromCompetition,
} from "@/src/hooks/api/useCompetitions";
import { useUsers } from "@/src/hooks/api/useUsers";
import { useClubs } from "@/src/hooks/api/useClubs";
import { LoadingState } from "@/src/components/LoadingState";
import CompetitionFormModal from "@/src/components/forms/CompetitionFormModal";
import PromoCodeApprovalModal from "@/src/components/forms/PromoCodeApprovalModal";

// ── Status / type config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    bg: "rgba(161,161,170,0.1)",
    text: "#a1a1aa",
    border: "rgba(161,161,170,0.2)",
  },
  OPEN: {
    label: "Open",
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  CLOSED: {
    label: "Closed",
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  ARCHIVED: {
    label: "Archived",
    bg: "rgba(59,130,246,0.1)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
  POSTPONED: {
    label: "Postponed",
    bg: "rgba(249,115,22,0.1)",
    text: "#fb923c",
    border: "rgba(249,115,22,0.2)",
  },
};

const EVENT_TYPE_CONFIG = {
  COMPETITION: {
    bg: "rgba(168,85,247,0.1)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.2)",
  },
  WORKSHOP: {
    bg: "rgba(59,130,246,0.1)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  EVENT: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
};

// ── Shared primitive components ───────────────────────────────────────────────

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

function StatusPill({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <Pill bg={c.bg} text={c.text} border={c.border}>
      {c.label}
    </Pill>
  );
}

function EventTypePill({ type }) {
  const c = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.COMPETITION;
  return (
    <Pill bg={c.bg} text={c.text} border={c.border}>
      {type || "—"}
    </Pill>
  );
}

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
);

const btnBase = {
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "7px 14px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 5,
};

function GhostBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
      }}
    >
      {children}
    </button>
  );
}

function PurpleBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: disabled ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.35)",
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "8px 18px",
        fontSize: 13,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(168,85,247,1)";
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(168,85,247,0.85)";
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#f87171",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(239,68,68,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
      }}
    >
      {children}
    </button>
  );
}

function SmallActionBtn({ onClick, children, color, hoverBg, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        padding: "5px 10px",
        fontSize: 11,
        background: "transparent",
        border: `1px solid ${color}30`,
        color,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function NativeSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        color: "rgba(255,255,255,0.65)",
        fontSize: 13,
        fontFamily: "'Syne', sans-serif",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </select>
  );
}

function Label({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 9.5,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.2)",
        fontFamily: "'Syne', sans-serif",
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

// ── InlineToggle ──────────────────────────────────────────────────────────────

function InlineToggle({ label, checked, onChange, disabled }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 32,
          height: 18,
          borderRadius: 9,
          border: "none",
          background: checked
            ? "rgba(168,85,247,0.7)"
            : "rgba(255,255,255,0.1)",
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background 0.2s",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
      <Typography
        sx={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ── CompetitionToggles (inline row controls) ──────────────────────────────────

function CompetitionToggles({ competition }) {
  const { enqueueSnackbar } = useSnackbar();
  const { mutate: toggleReg, isPending: togglingReg } =
    useToggleRegistrations();
  const { mutate: freeze, isPending: freezing } = useFreezeChanges();
  const { mutate: toggleReadonly, isPending: togglingRO } =
    useToggleReadOnlyMode();

  function handleToggleRegistrations(nextValue) {
    toggleReg(
      { competitionId: competition.id, registrationsOpen: nextValue },
      {
        onSuccess: () =>
          enqueueSnackbar("Registrations updated", { variant: "success" }),
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to update registrations",
            { variant: "error" },
          ),
      },
    );
  }

  function handleToggleFrozen(nextValue) {
    freeze(
      { competitionId: competition.id, frozen: nextValue },
      {
        onSuccess: () =>
          enqueueSnackbar("Changes freeze updated", { variant: "success" }),
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to update freeze state",
            { variant: "error" },
          ),
      },
    );
  }

  function handleToggleReadOnly(nextValue) {
    toggleReadonly(
      { competitionId: competition.id, readOnly: nextValue },
      {
        onSuccess: () =>
          enqueueSnackbar("Read-only mode updated", { variant: "success" }),
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to update read-only mode",
            { variant: "error" },
          ),
      },
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      <InlineToggle
        label="Reg. Open"
        checked={!!competition.registrationsOpen}
        onChange={handleToggleRegistrations}
        disabled={togglingReg}
      />
      <InlineToggle
        label="Frozen"
        checked={!!competition.changesFrozen}
        onChange={handleToggleFrozen}
        disabled={freezing}
      />
      <InlineToggle
        label="Read-only"
        checked={!!competition.readOnlyMode}
        onChange={handleToggleReadOnly}
        disabled={togglingRO}
      />
    </Box>
  );
}

// ── ManageDialog ──────────────────────────────────────────────────────────────

function ManageDialog({ competition, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState("judges");

  const [judgeUserId, setJudgeUserId] = useState("");
  const { data: judges = [], isLoading: judgesLoading } = useCompetitionJudges(
    open ? competition?.id : null,
  );
  const { data: judgeUsers = [] } = useUsers({ role: "JUDGE", limit: 200 });
  const { mutate: assignJudge, isPending: assigningJudge } = useAssignJudge();
  const { mutate: removeJudge } = useRemoveJudge();
  const [removingJudgeId, setRemovingJudgeId] = useState(null);

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

  const [dangerAction, setDangerAction] = useState("");
  const [dangerDate, setDangerDate] = useState("");
  const { mutate: cancelOrPostpone, isPending: dangerPending } =
    useCancelOrPostpone();

  const [selectedClubId, setSelectedClubId] = useState("");
  const { data: competitionClubs = [], isLoading: compClubsLoading } =
    useCompetitionClubs(open ? competition?.id : null);
  const { data: allClubs = [] } = useClubs();
  const { mutate: assignClub, isPending: assigningClub } =
    useAssignClubToCompetition();
  const { mutate: removeClub } = useRemoveClubFromCompetition();
  const [removingClubId, setRemovingClubId] = useState(null);

  if (!competition) return null;

  const assignedJudgeIds = new Set(judges.map((j) => j.userId || j.user?.id));
  const availableJudges = judgeUsers.filter((u) => !assignedJudgeIds.has(u.id));
  const assignedVolIds = new Set(volunteers.map((v) => v.userId || v.user?.id));
  const availableVols = volunteerUsers.filter((u) => !assignedVolIds.has(u.id));

  const assignedClubIds = new Set(competitionClubs.map((c) => c.clubId || c.id));
  const availableClubs = allClubs.filter((c) => !assignedClubIds.has(c.id));

  const tabList = [
    { key: "judges", label: "Judges" },
    { key: "volunteers", label: "Volunteers" },
    { key: "controls", label: "Controls" },
    { key: "clubs", label: "Clubs" },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        },
      }}
    >
      {/* Dialog header */}
      <Box
        sx={{
          px: 3,
          pt: 2.5,
          pb: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#f4f4f5",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {competition.title || competition.name}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'DM Mono', monospace",
            mt: 0.25,
          }}
        >
          Manage judges, volunteers, controls and clubs
        </Typography>

        {/* Tab switcher */}
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            mt: 2,
            p: 0.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            width: "fit-content",
          }}
        >
          {tabList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "6px 14px",
                background:
                  tab === t.key ? "rgba(255,255,255,0.08)" : "transparent",
                border:
                  tab === t.key
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid transparent",
                borderRadius: "6px",
                color:
                  tab === t.key
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.3)",
                fontSize: 12,
                fontFamily: "'Syne', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2.5, minHeight: 240 }}>
        {/* Judges tab */}
        {tab === "judges" && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <select
                value={judgeUserId}
                onChange={(e) => setJudgeUserId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                }}
              >
                <option value="">Select a judge…</option>
                {availableJudges.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    style={{ background: "#0e0e0e" }}
                  >
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
              <SmallActionBtn
                onClick={() => {
                  if (!judgeUserId) return;
                  assignJudge(
                    { competitionId: competition.id, judgeUserId },
                    {
                      onSuccess: () => {
                        enqueueSnackbar("Judge assigned", {
                          variant: "success",
                        });
                        setJudgeUserId("");
                      },
                      onError: (err) =>
                        enqueueSnackbar(
                          err?.response?.data?.message || "Failed",
                          { variant: "error" },
                        ),
                    },
                  );
                }}
                color="#a855f7"
                hoverBg="rgba(168,85,247,0.1)"
                disabled={!judgeUserId || assigningJudge}
              >
                {assigningJudge ? (
                  <CircularProgress size={11} sx={{ color: "#a855f7" }} />
                ) : (
                  <UserPlus size={11} />
                )}
                Add
              </SmallActionBtn>
            </Box>
            {judgesLoading ? (
              <LoadingState message="Loading…" size="small" />
            ) : judges.length === 0 ? (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.15)",
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  py: 2,
                }}
              >
                No judges assigned yet
              </Typography>
            ) : (
              judges.map((j) => {
                const name = j.user?.name || j.userName || j.name || "—";
                const email = j.user?.email || j.userEmail || j.email || "";
                return (
                  <Box
                    key={j.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.25,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        background: "rgba(168,85,247,0.35)",
                        fontSize: 11,
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#e4e4e7",
                          fontFamily: "'Syne', sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {email}
                      </Typography>
                    </Box>
                    {j.isHeadJudge && (
                      <Pill
                        bg="rgba(168,85,247,0.1)"
                        text="#c084fc"
                        border="rgba(168,85,247,0.2)"
                      >
                        Head
                      </Pill>
                    )}
                    <button
                      type="button"
                      disabled={removingJudgeId === j.id}
                      onClick={() => {
                        setRemovingJudgeId(j.id);
                        removeJudge(
                          {
                            judgeAssignmentId: j.id,
                            competitionId: competition.id,
                          },
                          {
                            onSuccess: () =>
                              enqueueSnackbar("Judge removed", {
                                variant: "success",
                              }),
                            onError: (e) =>
                              enqueueSnackbar(
                                e?.response?.data?.message || "Failed",
                                { variant: "error" },
                              ),
                            onSettled: () => setRemovingJudgeId(null),
                          },
                        );
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#f87171",
                        padding: 4,
                        lineHeight: 0,
                      }}
                    >
                      {removingJudgeId === j.id ? (
                        <CircularProgress size={11} sx={{ color: "#f87171" }} />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {/* Volunteers tab */}
        {tab === "volunteers" && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <select
                value={volunteerUserId}
                onChange={(e) => setVolunteerUserId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                }}
              >
                <option value="">Select a volunteer…</option>
                {availableVols.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    style={{ background: "#0e0e0e" }}
                  >
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
              <SmallActionBtn
                onClick={() => {
                  if (!volunteerUserId) return;
                  assignVolunteer(
                    {
                      competitionId: competition.id,
                      volunteerUserId,
                    },
                    {
                      onSuccess: () => {
                        enqueueSnackbar("Volunteer assigned", {
                          variant: "success",
                        });
                        setVolunteerUserId("");
                      },
                      onError: (err) =>
                        enqueueSnackbar(
                          err?.response?.data?.message || "Failed",
                          { variant: "error" },
                        ),
                    },
                  );
                }}
                color="#60a5fa"
                hoverBg="rgba(59,130,246,0.1)"
                disabled={!volunteerUserId || assigningVol}
              >
                {assigningVol ? (
                  <CircularProgress size={11} sx={{ color: "#60a5fa" }} />
                ) : (
                  <UserPlus size={11} />
                )}
                Add
              </SmallActionBtn>
            </Box>
            {volunteersLoading ? (
              <LoadingState message="Loading…" size="small" />
            ) : volunteers.length === 0 ? (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.15)",
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  py: 2,
                }}
              >
                No volunteers assigned yet
              </Typography>
            ) : (
              volunteers.map((v) => {
                const name = v.user?.name || v.userName || v.name || "—";
                const email = v.user?.email || v.userEmail || v.email || "";
                return (
                  <Box
                    key={v.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.25,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        background: "rgba(59,130,246,0.35)",
                        fontSize: 11,
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#e4e4e7",
                          fontFamily: "'Syne', sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {email}
                      </Typography>
                    </Box>
                    <button
                      type="button"
                      disabled={removingVolId === v.id}
                      onClick={() => {
                        setRemovingVolId(v.id);
                        removeVolunteer(
                          {
                            volunteerAssignmentId: v.id,
                            competitionId: competition.id,
                          },
                          {
                            onSuccess: () =>
                              enqueueSnackbar("Volunteer removed", {
                                variant: "success",
                              }),
                            onError: (e) =>
                              enqueueSnackbar(
                                e?.response?.data?.message || "Failed",
                                { variant: "error" },
                              ),
                            onSettled: () => setRemovingVolId(null),
                          },
                        );
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#f87171",
                        padding: 4,
                        lineHeight: 0,
                      }}
                    >
                      {removingVolId === v.id ? (
                        <CircularProgress size={11} sx={{ color: "#f87171" }} />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {/* Controls tab */}
        {tab === "controls" && (
          <Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                background: "rgba(234,179,8,0.06)",
                border: "1px solid rgba(234,179,8,0.15)",
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#fbbf24",
                  fontFamily: "'Syne', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AlertTriangle size={13} /> These actions are irreversible.
                Proceed with caution.
              </Typography>
            </Box>

            <Label>Cancel or Postpone</Label>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              <select
                value={dangerAction}
                onChange={(e) => {
                  setDangerAction(e.target.value);
                  if (e.target.value !== "postpone") {
                    setDangerDate("");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                }}
              >
                <option value="">Select action…</option>
                <option value="cancel">Cancel competition</option>
                <option value="postpone">Postpone competition</option>
              </select>

              {dangerAction === "postpone" && (
                <input
                  type="datetime-local"
                  value={dangerDate}
                  onChange={(e) => setDangerDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                    outline: "none",
                    colorScheme: "dark",
                    boxSizing: "border-box",
                  }}
                />
              )}

              <DangerBtn
                onClick={() => {
                  const mappedStatus =
                    dangerAction === "cancel"
                      ? "CANCELLED"
                      : dangerAction === "postpone"
                        ? "POSTPONED"
                        : "";

                  if (!mappedStatus) return;

                  cancelOrPostpone(
                    {
                      competitionId: competition.id,
                      status: mappedStatus,
                      autoNotify: true,
                      newDate:
                        dangerAction === "postpone" ? dangerDate : undefined,
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
                        enqueueSnackbar(
                          err?.response?.data?.message || "Action failed",
                          { variant: "error" },
                        ),
                    },
                  );
                }}
                disabled={
                  !dangerAction ||
                  dangerPending ||
                  (dangerAction === "postpone" && !dangerDate)
                }
              >
                {dangerPending ? (
                  <CircularProgress size={11} sx={{ color: "#f87171" }} />
                ) : dangerAction === "cancel" ? (
                  <XCircle size={13} />
                ) : (
                  <Clock size={13} />
                )}
                {dangerAction === "postpone"
                  ? "Postpone"
                  : "Cancel Competition"}
              </DangerBtn>
            </Box>
          </Box>
        )}

        {/* Clubs tab */}
        {tab === "clubs" && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  outline: "none",
                }}
              >
                <option value="">Select a club…</option>
                {availableClubs.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: "#0e0e0e" }}>
                    {c.name}
                  </option>
                ))}
              </select>
              <SmallActionBtn
                onClick={() => {
                  if (!selectedClubId) return;
                  assignClub(
                    { competitionId: competition.id, clubId: selectedClubId },
                    {
                      onSuccess: () => {
                        enqueueSnackbar("Club assigned", { variant: "success" });
                        setSelectedClubId("");
                      },
                      onError: (err) =>
                        enqueueSnackbar(
                          err?.response?.data?.message || "Failed",
                          { variant: "error" },
                        ),
                    },
                  );
                }}
                color="#2dd4bf"
                hoverBg="rgba(45,212,191,0.1)"
                disabled={!selectedClubId || assigningClub}
              >
                {assigningClub ? (
                  <CircularProgress size={11} sx={{ color: "#2dd4bf" }} />
                ) : (
                  <Building2 size={11} />
                )}
                Add
              </SmallActionBtn>
            </Box>
            {compClubsLoading ? (
              <LoadingState message="Loading…" size="small" />
            ) : competitionClubs.length === 0 ? (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.15)",
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  py: 2,
                }}
              >
                No clubs assigned yet
              </Typography>
            ) : (
              competitionClubs.map((c) => {
                const name = c.club?.name || c.name || "—";
                const clubId = c.clubId || c.id;
                return (
                  <Box
                    key={clubId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.25,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "8px",
                        background: "rgba(45,212,191,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={13} color="#2dd4bf" />
                    </Box>
                    <Typography
                      sx={{
                        flex: 1,
                        fontSize: 13,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </Typography>
                    <button
                      type="button"
                      disabled={removingClubId === clubId}
                      onClick={() => {
                        setRemovingClubId(clubId);
                        removeClub(
                          { competitionId: competition.id, clubId },
                          {
                            onSuccess: () =>
                              enqueueSnackbar("Club removed", {
                                variant: "success",
                              }),
                            onError: (e) =>
                              enqueueSnackbar(
                                e?.response?.data?.message || "Failed",
                                { variant: "error" },
                              ),
                            onSettled: () => setRemovingClubId(null),
                          },
                        );
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#f87171",
                        padding: 4,
                        lineHeight: 0,
                      }}
                    >
                      {removingClubId === clubId ? (
                        <CircularProgress size={11} sx={{ color: "#f87171" }} />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ px: 3, pb: 2.5, display: "flex", justifyContent: "flex-end" }}>
        <GhostBtn onClick={onClose}>Close</GhostBtn>
      </Box>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CompetitionsPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [manageTarget, setManageTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [promoCodeTarget, setPromoCodeTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuComp, setMenuComp] = useState(null);

  const { mutate: updateCompetition, isPending: publishingCompetition } =
    useUpdateCompetition();
  const { mutate: deleteCompetition, isPending: deletingCompetition } =
    useDeleteCompetition();
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: competitions = [], isLoading } = useCompetitions();

  function handleTogglePublishCompetition(comp) {
    const isCurrentlyOpen = comp.status === "OPEN";
    const isDH = user?.role === "DH";
    setPublishingId(comp.id);

    const payload = isCurrentlyOpen
      ? {
          competitionId: comp.id,
          status: "DRAFT",
          registrationsOpen: false,
        }
      : {
          competitionId: comp.id,
          status: "OPEN",
          registrationsOpen: true,
        };

    updateCompetition(payload, {
      onSuccess: (response) => {
        if (isDH && response?.pendingApproval) {
          enqueueSnackbar(
            response?.message ||
              "Change submitted to proposal queue for review.",
            { variant: "info" },
          );
          return;
        }

        enqueueSnackbar(
          isCurrentlyOpen ? "Competition unpublished" : "Competition published",
          {
            variant: "success",
          },
        );
      },
      onError: (err) =>
        enqueueSnackbar(
          err?.response?.data?.message ||
            (isCurrentlyOpen
              ? "Failed to unpublish competition"
              : "Failed to publish competition"),
          { variant: "error" },
        ),
      onSettled: () => setPublishingId(null),
    });
  }

  function handleDeleteCompetition(comp) {
    setDeleteTarget(comp);
  }

  function confirmDeleteCompetition() {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    deleteCompetition(deleteTarget.id, {
      onSuccess: (response) => {
        if (response?.pendingApproval) {
          enqueueSnackbar(
            response?.message ||
              "Competition deletion submitted for SA approval.",
            { variant: "info" },
          );
        } else {
          enqueueSnackbar("Competition deleted", { variant: "success" });
        }
        setDeleteTarget(null);
      },
      onError: (err) =>
        enqueueSnackbar(
          err?.response?.data?.message || "Failed to delete competition",
          { variant: "error" },
        ),
      onSettled: () => {
        setDeletingId(null);
      },
    });
  }

  const filtered = useMemo(() => {
    return competitions.filter((c) => {
      const title = (c.title || c.name || "").toLowerCase();
      const matchSearch = !search || title.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchType =
        eventTypeFilter === "all" || c.eventType === eventTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [competitions, search, statusFilter, eventTypeFilter]);

  const totalCount = competitions.length;
  const openCount = competitions.filter((c) => c.status === "OPEN").length;
  const draftCount = competitions.filter((c) => c.status === "DRAFT").length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              Competitions
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <PurpleBtn onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              New Competition
            </PurpleBtn>
          </Box>
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.03em",
            ml: 0.5,
          }}
        >
          Manage competitions, judges, volunteers and registration controls
        </Typography>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: "Total", value: totalCount, color: "rgba(255,255,255,0.7)" },
          { label: "Open", value: openCount, color: "#4ade80" },
          { label: "Draft", value: draftCount, color: "#a1a1aa" },
        ].map((s) => (
          <Box
            key={s.label}
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
              {s.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 700,
                color: s.color,
                fontFamily: "'Syne', sans-serif",
                lineHeight: 1,
              }}
            >
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: "12px",
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Box
            sx={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <Search size={13} color="rgba(255,255,255,0.25)" />
          </Box>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search competitions…"
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.75)",
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>
        <NativeSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={eventTypeFilter} onChange={setEventTypeFilter}>
          <option value="all">All Types</option>
          <option value="COMPETITION">Competition</option>
          <option value="WORKSHOP">Workshop</option>
          <option value="EVENT">Event</option>
        </NativeSelect>
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontFamily: "'DM Mono', monospace",
            ml: "auto",
          }}
        >
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading competitions…" />
      ) : (
        <Box
          sx={{
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflowX: "auto",
            overflowY: "hidden",
            background: "#0c0c0c",
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255,255,255,0.03)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(168,85,247,0.35)",
              borderRadius: 999,
            },
          }}
        >
          {/* Columns header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px,1fr) 120px 100px 110px 160px 52px",
              minWidth: 780,
              px: 3,
              py: 1.5,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {[
              "Competition",
              "Event Type",
              "Status",
              "Reg.",
              "Controls",
              "",
            ].map((h, i) => (
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
          <Box
            sx={{
              maxHeight: "min(62vh, 620px)",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <RowDivider />

            {filtered.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.18)",
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  No competitions found
                </Typography>
              </Box>
            ) : (
              filtered.map((comp, idx) => (
                <Box key={comp.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(220px,1fr) 120px 100px 110px 160px 52px",
                      minWidth: 780,
                      alignItems: "center",
                      px: 3,
                      py: 2,
                      transition: "background 0.12s",
                      "&:hover": { background: "rgba(255,255,255,0.018)" },
                    }}
                  >
                    {/* Title + description */}
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
                        {comp.title || comp.name}
                      </Typography>
                      {(comp.shortDescription || comp.description) && (
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
                          {comp.shortDescription || comp.description}
                        </Typography>
                      )}
                    </Box>

                    {/* Event Type */}
                    <Box>
                      <EventTypePill type={comp.eventType} />
                    </Box>

                    {/* Status */}
                    <Box>
                      <StatusPill status={comp.status} />
                    </Box>

                    {/* Registrations */}
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        {comp.registrationsOpen ? (
                          <Unlock size={12} color="#4ade80" />
                        ) : (
                          <Lock size={12} color="rgba(255,255,255,0.25)" />
                        )}
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: comp.registrationsOpen
                              ? "#4ade80"
                              : "rgba(255,255,255,0.25)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {comp.registrationsOpen ? "Open" : "Closed"}
                        </Typography>
                      </Box>
                      {comp.type && (
                        <Typography
                          sx={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.2)",
                            fontFamily: "'DM Mono', monospace",
                            mt: 0.5,
                          }}
                        >
                          {comp.type}
                        </Typography>
                      )}
                    </Box>

                    {/* Inline toggles */}
                    <Box>
                      <CompetitionToggles competition={comp} />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setMenuComp(comp);
                        }}
                        sx={{
                          color: "rgba(255,255,255,0.3)",
                          borderRadius: "8px",
                          "&:hover": {
                            color: "rgba(255,255,255,0.7)",
                            background: "rgba(255,255,255,0.06)",
                          },
                        }}
                      >
                        <MoreVertical size={15} />
                      </IconButton>
                    </Box>
                  </Box>
                  {idx < filtered.length - 1 && <RowDivider />}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}

      {/* Row action menu */}
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => { setMenuAnchor(null); setMenuComp(null); }}
        PaperProps={{
          sx: {
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            minWidth: 180,
            py: 0.5,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleTogglePublishCompetition(menuComp);
            setMenuAnchor(null);
            setMenuComp(null);
          }}
          sx={{
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            color: menuComp?.status === "OPEN" ? "#fbbf24" : "#4ade80",
            gap: 1.5,
            px: 2,
            py: 1,
            "&:hover": { background: "rgba(255,255,255,0.04)" },
          }}
        >
          <Send size={13} />
          {menuComp?.status === "OPEN"
            ? "Unpublish"
            : user?.role === "DH"
              ? "Request Publish"
              : "Publish"}
        </MenuItem>
        <MenuItem
          onClick={() => { setEditTarget(menuComp); setMenuAnchor(null); setMenuComp(null); }}
          sx={{
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            color: "#c084fc",
            gap: 1.5,
            px: 2,
            py: 1,
            "&:hover": { background: "rgba(255,255,255,0.04)" },
          }}
        >
          <Pencil size={13} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => { setManageTarget(menuComp); setMenuAnchor(null); setMenuComp(null); }}
          sx={{
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            color: "rgba(255,255,255,0.6)",
            gap: 1.5,
            px: 2,
            py: 1,
            "&:hover": { background: "rgba(255,255,255,0.04)" },
          }}
        >
          <Users size={13} />
          Manage
        </MenuItem>
        <MenuItem
          onClick={() => { setPromoCodeTarget(menuComp); setMenuAnchor(null); setMenuComp(null); }}
          sx={{
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            color: "#4ade80",
            gap: 1.5,
            px: 2,
            py: 1,
            "&:hover": { background: "rgba(255,255,255,0.04)" },
          }}
        >
          <Send size={13} />
          Promo Codes
        </MenuItem>
        <Box sx={{ height: "1px", background: "rgba(255,255,255,0.05)", mx: 1, my: 0.5 }} />
        <MenuItem
          onClick={() => { handleDeleteCompetition(menuComp); setMenuAnchor(null); setMenuComp(null); }}
          sx={{
            fontSize: 13,
            fontFamily: "'Syne', sans-serif",
            color: "#f87171",
            gap: 1.5,
            px: 2,
            py: 1,
            "&:hover": { background: "rgba(239,68,68,0.07)" },
          }}
        >
          <Trash2 size={13} />
          Delete
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <ManageDialog
        competition={manageTarget}
        open={!!manageTarget}
        onClose={() => setManageTarget(null)}
      />
      <PromoCodeApprovalModal
        competition={promoCodeTarget}
        open={!!promoCodeTarget}
        onClose={() => setPromoCodeTarget(null)}
        registrationFee={promoCodeTarget?.registrationFee || 0}
      />
      <CompetitionFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        competition={null}
      />
      <CompetitionFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        competition={editTarget}
      />

      <Dialog
        open={!!deleteTarget}
        onClose={() =>
          deletingCompetition || deletingId ? null : setDeleteTarget(null)
        }
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          },
        }}
      >
        <Box
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            px: 3,
            py: 2.25,
          }}
        >
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Delete Competition
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                color: "#f87171",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              This action cannot be undone.
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "'DM Mono', monospace",
              mb: 2.5,
            }}
          >
            {deleteTarget
              ? `Delete \"${deleteTarget.title || deleteTarget.name || "this competition"}\"?`
              : "Delete this competition?"}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <GhostBtn
              onClick={() => setDeleteTarget(null)}
              disabled={deletingCompetition || !!deletingId}
            >
              Cancel
            </GhostBtn>
            <DangerBtn
              onClick={confirmDeleteCompetition}
              disabled={deletingCompetition || !!deletingId}
            >
              {deletingCompetition || deletingId ? (
                <CircularProgress size={11} sx={{ color: "#f87171" }} />
              ) : (
                <Trash2 size={13} />
              )}
              Delete
            </DangerBtn>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
