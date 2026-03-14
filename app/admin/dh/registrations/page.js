"use client";

import { useState } from "react";
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

export default function RegistrationsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // Filters
  const [competitionId, setCompetitionId] = useState("");
  const [search, setSearch] = useState("");

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    registration: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  // In-flight tracking
  const [approvingId, setApprovingId] = useState(null);

  // Data
  const { data: competitions = [], isLoading: competitionsLoading } =
    useCompetitions();
  const {
    data: registrations = [],
    isLoading,
    refetch,
  } = usePendingRegistrations(competitionId ? { competitionId } : {});

  const { mutateAsync: approve } = useApproveRegistration();
  const { mutate: reject, isPending: isRejecting } = useRejectRegistration();

  // Client-side search filter
  const filtered = registrations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (r.user?.name || r.userName || "").toLowerCase();
    const email = (r.user?.email || r.userEmail || "").toLowerCase();
    const team = (r.team?.name || r.teamName || "").toLowerCase();
    return name.includes(q) || email.includes(q) || team.includes(q);
  });

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

  function openRejectDialog(registration) {
    setRejectDialog({ open: true, registration });
    setRejectReason("");
  }

  function handleReject() {
    reject(
      { registrationId: rejectDialog.registration.id, reason: rejectReason },
      {
        onSuccess: () => {
          enqueueSnackbar("Registration rejected", { variant: "success" });
          setRejectDialog({ open: false, registration: null });
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
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}
        >
          Registrations
        </Typography>
        <Typography variant="body2" sx={{ color: "#71717a" }}>
          Review and approve or reject pending competition registrations
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
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 3,
          }}
        >
          <ClipboardList
            size={40}
            color="#3f3f46"
            style={{ marginBottom: 12 }}
          />
          <Typography sx={{ color: "#71717a" }}>
            No pending registrations
            {competitionId ? " for this competition" : ""}
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
              {filtered.map((row) => {
                const name = row.user?.name || row.userName || "Unknown";
                const email = row.user?.email || row.userEmail || "";
                const competitionName =
                  row.competition?.name ||
                  row.competition?.title ||
                  row.competitionName ||
                  "—";
                const teamName = row.team?.name || row.teamName || null;
                const type = row.competition?.type || row.type || null;
                const isApproving = approvingId === row.id;

                return (
                  <TableRow
                    key={row.id}
                    sx={{ "&:hover": { backgroundColor: "#1f1f23" } }}
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
                              variant="contained"
                              onClick={() => handleApprove(row.id)}
                              disabled={isApproving}
                              startIcon={
                                isApproving ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <CheckCircle size={14} />
                                )
                              }
                              sx={{
                                backgroundColor: "#16a34a",
                                "&:hover": { backgroundColor: "#15803d" },
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            >
                              Approve
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openRejectDialog(row)}
                            startIcon={<XCircle size={14} />}
                            sx={{
                              borderColor: "#ef4444",
                              color: "#ef4444",
                              "&:hover": {
                                borderColor: "#dc2626",
                                backgroundColor: "rgba(239,68,68,0.08)",
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
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
        onClose={() => setRejectDialog({ open: false, registration: null })}
        PaperProps={{
          sx: {
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            minWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff", fontWeight: 700 }}>
          Reject Registration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#a1a1aa", mb: 2 }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectDialog({ open: false, registration: null })}
            sx={{ color: "#71717a", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReject}
            disabled={!rejectReason.trim() || isRejecting}
            startIcon={
              isRejecting ? (
                <CircularProgress size={14} />
              ) : (
                <XCircle size={14} />
              )
            }
            sx={{
              backgroundColor: "#ef4444",
              "&:hover": { backgroundColor: "#dc2626" },
              textTransform: "none",
              fontWeight: 600,
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
    color: "#fff",
    "& fieldset": { borderColor: "#3f3f46" },
    "&:hover fieldset": { borderColor: "#71717a" },
    "&.Mui-focused fieldset": { borderColor: "#a855f7" },
  },
  "& .MuiInputLabel-root": { color: "#71717a" },
  "& .MuiSelect-icon": { color: "#71717a" },
  "& .MuiMenuItem-root": { color: "#fff" },
};
