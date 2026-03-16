"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
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
  InputAdornment,
} from "@mui/material";
import { CheckCircle, XCircle, Search, ClipboardList } from "lucide-react";
import { useSnackbar } from "notistack";
import {
  usePendingRegistrations,
  useApproveRegistration,
  useRejectRegistration,
} from "@/src/hooks/api/useRegistrations";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";
import { LoadingState } from "@/src/components/LoadingState";

const cellSx = { color: "#d4d4d8", borderColor: "#27272a" };
const headSx = { color: "#a1a1aa", borderColor: "#27272a", fontWeight: 600 };

const subtleButtonSx = {
  textTransform: "none",
  fontFamily: "'Syne', sans-serif",
  fontWeight: 600,
  fontSize: 12,
  borderRadius: "8px",
  px: 1.8,
  py: 0.7,
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.75)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(2px)",
  transition: "all 0.18s",
  "&:hover": {
    background: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.2)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
  },
};

const approveButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  borderRadius: "8px",
  px: 1.8,
  py: 0.7,
  border: "1px solid rgba(74,222,128,0.3)",
  background:
    "linear-gradient(135deg, rgba(22,163,74,0.9) 0%, rgba(21,128,61,0.95) 100%)",
  color: "#fff",
  boxShadow: "0 4px 16px rgba(22,163,74,0.2)",
  transition: "all 0.18s",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.95) 0%, rgba(22,163,74,1) 100%)",
    boxShadow: "0 6px 20px rgba(22,163,74,0.28)",
  },
};

const rejectButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  fontFamily: "'Syne', sans-serif",
  fontSize: 12,
  borderRadius: "8px",
  px: 1.8,
  py: 0.7,
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fca5a5",
  background: "rgba(239,68,68,0.1)",
  boxShadow: "0 4px 16px rgba(239,68,68,0.12)",
  transition: "all 0.18s",
  "&:hover": {
    borderColor: "rgba(239,68,68,0.58)",
    backgroundColor: "rgba(239,68,68,0.18)",
    boxShadow: "0 6px 20px rgba(239,68,68,0.2)",
  },
};

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export default function RegistrationsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // Filters
  const [competitionId, setCompetitionId] = useState("");
  const [search, setSearch] = useState("");

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    registration: null,
    registrationId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  // In-flight tracking
  const [approvingId, setApprovingId] = useState(null);

  // Data
  const { data: competitions = [], isLoading: competitionsLoading } =
    useCompetitions();
  const { data: registrations = [], isLoading } = usePendingRegistrations(
    competitionId ? { competitionId } : {},
  );

  const { mutateAsync: approve } = useApproveRegistration();
  const { mutate: reject, isPending: isRejecting } = useRejectRegistration();

  // Client-side search filter
  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const name = (r.user?.name || r.userName || "").toLowerCase();
      const email = (r.user?.email || r.userEmail || "").toLowerCase();
      const team = (r.team?.name || r.teamName || "").toLowerCase();
      return name.includes(q) || email.includes(q) || team.includes(q);
    });
  }, [registrations, search]);

  const getRegistrationId = (row) => {
    const candidate = row?.registrationId || row?.id || row?.registration?.id;
    return isUuid(candidate) ? candidate : null;
  };

  async function handleApprove(registrationId) {
    setApprovingId(registrationId);
    try {
      await approve(registrationId);
      enqueueSnackbar("Registration approved", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to approve",
        { variant: "error" },
      );
    } finally {
      setApprovingId(null);
    }
  }

  function openRejectDialog(registration, registrationId) {
    setRejectDialog({ open: true, registration, registrationId });
    setRejectReason("");
  }

  function handleReject() {
    if (!rejectDialog.registrationId) {
      enqueueSnackbar("Invalid registration ID", { variant: "error" });
      return;
    }

    reject(
      { registrationId: rejectDialog.registrationId, reason: rejectReason },
      {
        onSuccess: () => {
          enqueueSnackbar("Registration rejected", { variant: "success" });
          setRejectDialog({
            open: false,
            registration: null,
            registrationId: null,
          });
        },
        onError: (err) => {
          enqueueSnackbar(
            err?.response?.data?.message || err?.message || "Failed to reject",
            { variant: "error" },
          );
        },
      },
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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
            <ClipboardList size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Registrations
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
          Review and approve or reject pending competition registrations
        </Typography>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          select
          label="Competition"
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          size="small"
          sx={{ minWidth: 240, ...inputSx }}
        >
          <MenuItem value="">All Competitions</MenuItem>
          {competitions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name || c.title}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          placeholder="Search by name, email or team…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 280, ...inputSx }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#71717a" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          {!isLoading && (
            <Chip
              label={`${filtered.length} pending`}
              size="small"
              sx={{
                backgroundColor: "#f59e0b20",
                color: "#f59e0b",
                fontWeight: 600,
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Loading registrations…" />
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
          <Typography sx={{ color: "#71717a" }}>
            No pending registrations
            {competitionId ? " for this competition" : ""}
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Participant</TableCell>
                <TableCell sx={headSx}>Competition</TableCell>
                <TableCell sx={headSx}>Team</TableCell>
                <TableCell sx={headSx}>Type</TableCell>
                <TableCell sx={headSx}>Submitted</TableCell>
                <TableCell sx={{ ...headSx, textAlign: "right" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row, index) => {
                const name = row.user?.name || row.userName || "Unknown";
                const email = row.user?.email || row.userEmail || "";
                const competitionName =
                  row.competition?.name ||
                  row.competition?.title ||
                  row.competitionName ||
                  "—";
                const teamName = row.team?.name || row.teamName || null;
                const type = row.competition?.type || row.type || null;
                const registrationId = getRegistrationId(row);
                const isApproving = approvingId === registrationId;

                return (
                  <TableRow
                    key={registrationId || `pending-row-${index}`}
                    sx={{
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.02)" },
                    }}
                  >
                    {/* Participant */}
                    <TableCell sx={cellSx}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: "#3f3f46",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "#fff", fontWeight: 500 }}
                          >
                            {name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#71717a" }}
                          >
                            {email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Competition */}
                    <TableCell sx={cellSx}>
                      <Typography variant="body2">{competitionName}</Typography>
                    </TableCell>

                    {/* Team */}
                    <TableCell sx={cellSx}>
                      {teamName ? (
                        <Box>
                          <Typography variant="body2" sx={{ color: "#fff" }}>
                            {teamName}
                          </Typography>
                          {row.team?.members?.length && (
                            <Typography
                              variant="caption"
                              sx={{ color: "#71717a" }}
                            >
                              {row.team.members.length} members
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: "#52525b" }}>
                          Solo
                        </Typography>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell sx={cellSx}>
                      {type && (
                        <Chip
                          label={type}
                          size="small"
                          sx={{
                            backgroundColor:
                              type === "TEAM" ? "#7c3aed22" : "#0369a122",
                            color: type === "TEAM" ? "#a78bfa" : "#38bdf8",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Submitted */}
                    <TableCell sx={cellSx}>
                      <Typography variant="body2" sx={{ color: "#a1a1aa" }}>
                        {formatDate(row.createdAt || row.submittedAt)}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Approve">
                          <span>
                            <Button
                              size="small"
                              onClick={() => handleApprove(registrationId)}
                              disabled={isApproving || !registrationId}
                              startIcon={
                                isApproving ? (
                                  <CircularProgress
                                    size={14}
                                    sx={{ color: "rgba(255,255,255,0.9)" }}
                                  />
                                ) : (
                                  <CheckCircle size={14} />
                                )
                              }
                              sx={approveButtonSx}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <Button
                            size="small"
                            onClick={() =>
                              openRejectDialog(row, registrationId)
                            }
                            disabled={!registrationId}
                            startIcon={<XCircle size={14} />}
                            sx={rejectButtonSx}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() =>
          setRejectDialog({
            open: false,
            registration: null,
            registrationId: null,
          })
        }
        PaperProps={{
          sx: {
            background: "#0e0e0e",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
            minWidth: 420,
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
          }}
        >
          Reject Registration
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important" }}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.65)",
              mb: 2,
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
            }}
          >
            Provide a reason for rejecting{" "}
            <strong style={{ color: "#fff" }}>
              {rejectDialog.registration?.user?.name ||
                rejectDialog.registration?.userName ||
                "this participant"}
            </strong>
            &apos;s registration.
          </Typography>
          <TextField
            label="Reason (required)"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            sx={inputSx}
          />
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
            onClick={() =>
              setRejectDialog({
                open: false,
                registration: null,
                registrationId: null,
              })
            }
            sx={subtleButtonSx}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!rejectReason.trim() || isRejecting}
            endIcon={
              isRejecting ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <XCircle size={14} />
              )
            }
            sx={{
              ...rejectButtonSx,
              color: "#fff",
              border: "1px solid rgba(239,68,68,0.55)",
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.92) 0%, rgba(220,38,38,0.96) 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(248,113,113,0.95) 0%, rgba(239,68,68,1) 100%)",
                borderColor: "rgba(248,113,113,0.75)",
                boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
              },
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Shared dark-theme input styles
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
  "& .MuiMenuItem-root": { color: "#fff" },
};
