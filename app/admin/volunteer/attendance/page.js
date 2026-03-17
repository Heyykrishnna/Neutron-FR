"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMarkCompetitionAttendance,
  useMarkFestAttendance,
  useVolunteerAttendanceProfile,
} from "@/src/hooks/api/useAttendance";
import { useSearchParticipantsWithComp } from "@/src/hooks/api/useAttendance";

const sy = { fontFamily: "'Syne', sans-serif" };

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.75)" },
    "& input": {
      color: "rgba(255,255,255,0.9)",
      fontFamily: "'Syne', sans-serif",
      fontSize: 13,
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.38)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    "&.Mui-focused": { color: "rgba(192,132,252,0.95)" },
  },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.45)" },
  "& .MuiMenuItem-root": { fontFamily: "'Syne', sans-serif" },
};

// FEST_OPTION sentinel value
const FEST_OPTION = "__fest__";

function ParticipantRow({
  participant,
  selectedComp,
  isFestMode,
  onMarkComp,
  onMarkFest,
  markedIds,
  markingId,
}) {
  const userId = participant.userId || participant.id;
  const name = participant.name || participant.user?.name || "Unknown";
  const email = participant.email || participant.user?.email || "";
  const college =
    participant.collegeName || participant.user?.collegeName || "";
  const regStatus = participant.registrationStatus || participant.status;

  const isMarked = markedIds.has(userId);
  const isMarking = markingId === userId;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.4,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        "&:last-child": { borderBottom: "none" },
        opacity: isMarked ? 0.55 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 12,
          bgcolor: "rgba(168,85,247,0.2)",
          color: "#c084fc",
          flexShrink: 0,
        }}
      >
        {name[0]?.toUpperCase() || "?"}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", ...sy }}
          noWrap
        >
          {name}
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: "rgba(255,255,255,0.35)", ...sy }}
          noWrap
        >
          {email}
          {college ? ` · ${college}` : ""}
        </Typography>
        {regStatus && !isFestMode && (
          <Chip
            label={regStatus}
            size="small"
            sx={{
              mt: 0.25,
              fontSize: 9,
              height: 16,
              background:
                regStatus === "APPROVED"
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(255,255,255,0.05)",
              color: regStatus === "APPROVED" ? "#4ade80" : "#a1a1aa",
              ...sy,
            }}
          />
        )}
      </Box>

      {isMarked ? (
        <Chip
          label="Marked"
          size="small"
          icon={<CheckCircle2 size={11} color="#4ade80" />}
          sx={{
            background: "rgba(34,197,94,0.12)",
            color: "#4ade80",
            border: "1px solid rgba(34,197,94,0.2)",
            fontSize: 11,
            flexShrink: 0,
            ...sy,
          }}
        />
      ) : (
        <Button
          size="small"
          variant="contained"
          disabled={isMarking}
          onClick={() => (isFestMode ? onMarkFest(userId) : onMarkComp(userId))}
          sx={{
            textTransform: "none",
            fontSize: 11,
            flexShrink: 0,
            ...sy,
            backgroundColor: isFestMode ? "#16a34a" : "#7c3aed",
            "&:hover": {
              backgroundColor: isFestMode ? "#15803d" : "#6d28d9",
            },
            "&.Mui-disabled": { backgroundColor: "#27272a", color: "#52525b" },
            minWidth: 72,
          }}
        >
          {isMarking ? (
            <CircularProgress size={12} sx={{ color: "#fff" }} />
          ) : (
            "Mark"
          )}
        </Button>
      )}
    </Box>
  );
}

export default function VolunteerAttendancePage() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profile, isLoading: profileLoading } =
    useVolunteerAttendanceProfile();

  const isGateVolunteer = !!profile?.isRegistrationDeskVolunteer;
  const assignedComps = profile?.assignedCompetitions || [];
  const attendanceComps = assignedComps.filter(
    (ac) => ac.competition?.attendanceRequired,
  );

  // Build mode options: gate/fest first (if applicable), then competitions
  const modeOptions = [
    ...(isGateVolunteer
      ? [{ value: FEST_OPTION, label: "Gate / Fest Attendance" }]
      : []),
    ...attendanceComps.map((ac) => ({
      value: ac.competition?.id,
      label: ac.competition?.title || "Unnamed Competition",
    })),
  ];

  const [selectedMode, setSelectedMode] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [markedIds, setMarkedIds] = useState(new Set());
  const [markingId, setMarkingId] = useState(null);

  const debounceRef = useRef(null);
  const handleQueryChange = useCallback((val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 380);
  }, []);

  // Auto-select first mode once profile loads
  useEffect(() => {
    if (!selectedMode && modeOptions.length > 0) {
      setSelectedMode(modeOptions[0].value);
    }
  }, [modeOptions.length]);

  const isFestMode = selectedMode === FEST_OPTION;
  const competitionId = isFestMode ? null : selectedMode || null;

  const {
    data: participants = [],
    isLoading: searching,
    isFetching,
  } = useSearchParticipantsWithComp(debouncedQuery, competitionId);

  const { mutateAsync: markCompAttendance } = useMarkCompetitionAttendance();
  const { mutateAsync: markFestAttendance } = useMarkFestAttendance();

  const canAccess = isGateVolunteer || attendanceComps.length > 0;

  async function handleMarkComp(userId) {
    if (!competitionId) return;
    setMarkingId(userId);
    try {
      await markCompAttendance({ competitionId, userId });
      setMarkedIds((prev) => new Set(prev).add(userId));
      enqueueSnackbar("Attendance marked", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to mark",
        { variant: "error" },
      );
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkFest(userId) {
    setMarkingId(userId);
    try {
      await markFestAttendance({ userId });
      setMarkedIds((prev) => new Set(prev).add(userId));
      enqueueSnackbar("Fest attendance marked", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to mark",
        { variant: "error" },
      );
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800 }}>
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
            <UserCheck size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", ...sy }}
          >
            Mark Attendance
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)", ml: 0.5, ...sy }}
        >
          Search participants and check them in
        </Typography>
      </Box>

      {profileLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#a855f7" }} size={26} />
        </Box>
      ) : !canAccess ? (
        <Paper
          sx={{
            p: 4,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <Lock
            size={28}
            color="rgba(255,255,255,0.15)"
            style={{ marginBottom: 12 }}
          />
          <Typography
            sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)", ...sy }}
          >
            Access restricted
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              mt: 0.5,
              ...sy,
            }}
          >
            You need gate assignment or a competition with attendance enabled
          </Typography>
        </Paper>
      ) : (
        <Paper
          sx={{
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Controls */}
          <Box
            sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Stack spacing={1.5}>
              {/* Mode selector */}
              <TextField
                select
                label="Mode"
                value={selectedMode}
                onChange={(e) => {
                  setSelectedMode(e.target.value);
                  setQuery("");
                  setDebouncedQuery("");
                  setMarkedIds(new Set());
                }}
                size="small"
                fullWidth
                sx={inputSx}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                      },
                    },
                  },
                }}
              >
                {modeOptions.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    sx={{ color: "#e4e4e7", fontSize: 13, ...sy }}
                  >
                    {opt.value === FEST_OPTION ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <ShieldCheck size={13} color="#4ade80" />
                        {opt.label}
                      </Box>
                    ) : (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Trophy size={13} color="#c084fc" />
                        {opt.label}
                      </Box>
                    )}
                  </MenuItem>
                ))}
              </TextField>

              {/* Search */}
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
                  "&:focus-within": { borderColor: "rgba(168,85,247,0.6)" },
                }}
              >
                {isFetching ? (
                  <CircularProgress
                    size={14}
                    sx={{ color: "#71717a", flexShrink: 0 }}
                  />
                ) : (
                  <Search size={14} color="rgba(255,255,255,0.3)" />
                )}
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={
                    isFestMode
                      ? "Search participant by name, email, or phone…"
                      : "Search registered participant…"
                  }
                  disabled={!selectedMode}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 13,
                    fontFamily: "'Syne', sans-serif",
                  }}
                />
              </Box>
            </Stack>

            {isFestMode && (
              <Alert
                severity="info"
                icon={<ShieldCheck size={14} />}
                sx={{
                  mt: 1.5,
                  background: "rgba(34,197,94,0.06)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.15)",
                  fontSize: 12,
                  ...sy,
                  "& .MuiAlert-icon": { color: "#4ade80" },
                }}
              >
                Gate mode — marking overall fest check-in for all attendees
              </Alert>
            )}
          </Box>

          {/* Results */}
          <Box sx={{ minHeight: 120 }}>
            {!selectedMode ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", ...sy }}
                >
                  Select a mode above to get started
                </Typography>
              </Box>
            ) : debouncedQuery.length < 2 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Users
                  size={24}
                  color="rgba(255,255,255,0.1)"
                  style={{ marginBottom: 8 }}
                />
                <Typography
                  sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", ...sy }}
                >
                  Type at least 2 characters to search
                </Typography>
              </Box>
            ) : searching ? (
              <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={22} sx={{ color: "#a855f7" }} />
              </Box>
            ) : participants.length === 0 ? (
              <Box sx={{ py: 5, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", ...sy }}
                >
                  No participants found for &ldquo;{debouncedQuery}&rdquo;
                </Typography>
              </Box>
            ) : (
              participants.map((p) => (
                <ParticipantRow
                  key={p.userId || p.id}
                  participant={p}
                  selectedComp={competitionId}
                  isFestMode={isFestMode}
                  onMarkComp={handleMarkComp}
                  onMarkFest={handleMarkFest}
                  markedIds={markedIds}
                  markingId={markingId}
                />
              ))
            )}
          </Box>

          {participants.length > 0 && debouncedQuery.length >= 2 && (
            <Box
              sx={{
                px: 2.5,
                py: 1.25,
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{ fontSize: 11, color: "rgba(255,255,255,0.22)", ...sy }}
              >
                {participants.length} result
                {participants.length !== 1 ? "s" : ""}
              </Typography>
              {markedIds.size > 0 && (
                <Chip
                  label={`${markedIds.size} marked this session`}
                  size="small"
                  icon={<CheckCircle2 size={10} color="#4ade80" />}
                  sx={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#4ade80",
                    fontSize: 10,
                    ...sy,
                  }}
                />
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
