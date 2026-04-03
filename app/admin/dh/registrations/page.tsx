"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import {
  CheckCircle,
  XCircle,
  Search,
  ClipboardList,
  Eye,
  Loader2,
  Link2,
} from "lucide-react";
import { useSnackbar } from "notistack";
import {
  usePendingRegistrations,
  useApproveRegistration,
  useRejectRegistration,
} from "@/src/hooks/api/useRegistrations";
import { useResendRegistrationPaymentLink } from "@/src/hooks/api/usePayments";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";
import { LoadingState } from "@/src/components/LoadingState";

const cellSx = { color: "#d4d4d8", borderColor: "#27272a" };
const headSx = { color: "#a1a1aa", borderColor: "#27272a", fontWeight: 600 };

type Field = {
  fieldType?: string;
  fileUrl?: string;
  label?: string;
  displayValue: string;
};
const renderFieldAnswer = (field: Field) => {
  if (field?.fieldType === "IMAGE" && field?.fileUrl) {
    return (
      <Box sx={{ mt: 0.2 }}>
        <Box
          component="img"
          src={field.fileUrl}
          alt={field.label || "Submitted image"}
          sx={{
            width: 180,
            maxWidth: "100%",
            height: 120,
            objectFit: "cover",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.03)",
          }}
        />
        <a
          href={field.fileUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#a78bfa",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            display: "inline-block",
            marginTop: 6,
            textDecoration: "none",
          }}
        >
          Open full image
        </a>
      </Box>
    );
  }

  return field?.displayValue || "—";
};

const isUuid = (value: any) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export default function RegistrationsPage() {
  const { enqueueSnackbar } = useSnackbar();

  // Filters
  const [competitionId, setCompetitionId] = useState("");
  const [search, setSearch] = useState("");
  const [createdWindow, setCreatedWindow] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<any>({
    open: false,
    registration: null,
    registrationId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  // In-flight tracking
  const [approvingId, setApprovingId] = useState(null);
  const [approvingTeamKey, setApprovingTeamKey] = useState(null);
  const [resendingRegistrationId, setResendingRegistrationId] = useState<
    string | null
  >(null);
  const [formDialog, setFormDialog] = useState<any>({
    open: false,
    row: null,
  });

  // Data
  const { data: competitions = [], isLoading: competitionsLoading } =
    useCompetitions();
  const { data: registrations = [], isLoading } = usePendingRegistrations(
    competitionId
      ? { competitionId, status: "PENDING,REJECTED,APPROVED" }
      : { status: "PENDING,REJECTED,APPROVED" },
  );

  const { mutateAsync: approve } = useApproveRegistration();
  const { mutate: reject, isPending: isRejecting } = useRejectRegistration();
  const { mutateAsync: resendPaymentLink } = useResendRegistrationPaymentLink();

  function getPaymentStatus(row: any) {
    const value = row?.paymentStatus || row?.registration?.paymentStatus;
    if (!value) {
      return row?.competition?.isPaid ? "PENDING" : "NOT_REQUIRED";
    }
    return String(value).toUpperCase();
  }

  function isRegistrationPaid(row: any) {
    return getPaymentStatus(row) === "PAID";
  }

  function isPaymentRequired(row: any) {
    return Boolean(row?.competition?.isPaid || row?.isPaid);
  }

  // Client-side search filter
  const filtered = useMemo(() => {
    const now = Date.now();
    const minCreatedAt =
      createdWindow === "24h"
        ? now - 24 * 60 * 60 * 1000
        : createdWindow === "7d"
          ? now - 7 * 24 * 60 * 60 * 1000
          : createdWindow === "30d"
            ? now - 30 * 24 * 60 * 60 * 1000
            : null;

    return registrations.filter((r) => {
      if (paymentFilter !== "all") {
        const registrationStatus = String(
          r?.status || r?.registration?.status || "PENDING",
        ).toUpperCase();
        const isPaid = isRegistrationPaid(r);
        if (paymentFilter === "paid" && !isPaid) {
          return false;
        }
        if (
          paymentFilter === "unpaid" &&
          (!isPaymentRequired(r) || isPaid || registrationStatus !== "APPROVED")
        ) {
          return false;
        }
      }

      if (minCreatedAt) {
        const createdAt =
          r.createdAt || r.registration?.createdAt || r.submittedAt || null;
        if (!createdAt || new Date(createdAt).getTime() < minCreatedAt) {
          return false;
        }
      }

      if (!search) return true;
      const q = search.toLowerCase();
      const name = (r.user?.name || r.userName || "").toLowerCase();
      const email = (r.user?.email || r.userEmail || "").toLowerCase();
      const team = (r.team?.name || r.teamName || "").toLowerCase();
      return name.includes(q) || email.includes(q) || team.includes(q);
    });
  }, [registrations, search, createdWindow, paymentFilter]);

  const groupedByTeam = useMemo(() => {
    const groups = new Map();
    const getCreatedAtMs = (row: any) => {
      const createdAt =
        row?.createdAt || row?.registration?.createdAt || row?.submittedAt;
      const time = createdAt ? new Date(createdAt).getTime() : Number.NaN;
      return Number.isFinite(time) ? time : 0;
    };

    filtered.forEach((row: any, index) => {
      const teamId = row.team?.id || row.teamId || null;
      const teamName = row.team?.name || row.teamName || "Solo Registration";
      const competitionName =
        row.competition?.name ||
        row.competition?.title ||
        row.competitionName ||
        "—";
      const type =
        row.competition?.type || row.type || (teamId ? "TEAM" : "SOLO");

      const soloFallbackKey = getRegistrationId(row) || `solo-${index}`;
      const groupKey = teamId ? `team:${teamId}` : `solo:${soloFallbackKey}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          teamId,
          teamName,
          competitionName,
          type,
          members: [],
          latestCreatedAtMs: 0,
        });
      }

      const group = groups.get(groupKey);
      group.members.push(row);
      group.latestCreatedAtMs = Math.max(
        group.latestCreatedAtMs,
        getCreatedAtMs(row),
      );
    });

    const normalized = Array.from(groups.values());

    normalized.forEach((group) => {
      group.members.sort((a: any, b: any) => {
        const aIsLeader =
          group.teamId &&
          (a.team?.leaderId || a.teamLeaderId) &&
          (a.team?.leaderId || a.teamLeaderId) === (a.user?.id || a.userId);
        const bIsLeader =
          group.teamId &&
          (b.team?.leaderId || b.teamLeaderId) &&
          (b.team?.leaderId || b.teamLeaderId) === (b.user?.id || b.userId);

        if (aIsLeader && !bIsLeader) return -1;
        if (!aIsLeader && bIsLeader) return 1;

        const aName = (a.user?.name || a.userName || "").toLowerCase();
        const bName = (b.user?.name || b.userName || "").toLowerCase();
        return aName.localeCompare(bName);
      });
    });

    normalized.sort((a, b) => {
      if (b.latestCreatedAtMs !== a.latestCreatedAtMs) {
        return b.latestCreatedAtMs - a.latestCreatedAtMs;
      }
      return (a.teamName || "").localeCompare(b.teamName || "");
    });

    return normalized;
  }, [filtered]);

  function getRegistrationId(row: any) {
    const candidate = row?.registrationId || row?.id || row?.registration?.id;
    return isUuid(candidate) ? candidate : null;
  }

  async function handleApprove(registrationId: any) {
    setApprovingId(registrationId);
    try {
      const response = await approve(registrationId);
      const paymentSession =
        response?.data?.paymentSession || response?.paymentSession;
      enqueueSnackbar(
        paymentSession
          ? "Registration approved and payment link sent"
          : "Registration approved",
        { variant: "success" },
      );
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to approve",
        { variant: "error" },
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function handleResendPaymentLink(registrationId: string) {
    setResendingRegistrationId(registrationId);
    try {
      await resendPaymentLink(registrationId);
      enqueueSnackbar("Payment link resent successfully", {
        variant: "success",
      });
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to resend payment link",
        { variant: "error" },
      );
    } finally {
      setResendingRegistrationId(null);
    }
  }

  async function handleApproveTeam(group: any) {
    setApprovingTeamKey(group.key);
    try {
      // Approve all members in the team
      const approvalPromises = group.members
        .map((member: any) => getRegistrationId(member))
        .filter(Boolean)
        .map((registrationId: any) => approve(registrationId));

      await Promise.all(approvalPromises);
      enqueueSnackbar(`All ${group.members.length} registrations approved`, {
        variant: "success",
      });
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve team",
        { variant: "error" },
      );
    } finally {
      setApprovingTeamKey(null);
    }
  }

  function openRejectDialog(registration: any, registrationId: any) {
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
        onError: (err: any) => {
          enqueueSnackbar(
            err?.response?.data?.message || err?.message || "Failed to reject",
            { variant: "error" },
          );
        },
      },
    );
  }

  function formatDate(dateStr: any) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function openFormDialog(row: any) {
    setFormDialog({ open: true, row });
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
          Review competition registrations (pending, rejected, approved)
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
          select
          label="Created"
          value={createdWindow}
          onChange={(e) => setCreatedWindow(e.target.value)}
          size="small"
          sx={{ minWidth: 170, ...inputSx }}
        >
          <MenuItem value="all">Any time</MenuItem>
          <MenuItem value="24h">Last 24 hours</MenuItem>
          <MenuItem value="7d">Last 7 days</MenuItem>
          <MenuItem value="30d">Last 30 days</MenuItem>
        </TextField>

        <TextField
          select
          label="Payment"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 170, ...inputSx }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unpaid">Approved / Unpaid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
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
              label={`${filtered.length} registration${filtered.length !== 1 ? "s" : ""}`}
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
            No registrations found
            {competitionId ? " for this competition" : ""}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {groupedByTeam.map((group) => (
            <Paper
              key={group.key}
              sx={{
                background: "#0c0c0c",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.4,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography
                    sx={{ color: "#fff", fontSize: 14, fontWeight: 600 }}
                  >
                    {group.teamName}
                  </Typography>
                  <Typography sx={{ color: "#71717a", fontSize: 12 }}>
                    {group.competitionName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={group.type}
                    size="small"
                    sx={{
                      backgroundColor:
                        group.type === "TEAM" ? "#7c3aed22" : "#0369a122",
                      color: group.type === "TEAM" ? "#a78bfa" : "#38bdf8",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                  <Chip
                    label={`${group.members.length} member${group.members.length > 1 ? "s" : ""}`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.72)",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                  {group.members.some(
                    (m: any) =>
                      (m.status || m.registrationStatus) === "PENDING" &&
                      getRegistrationId(m),
                  ) && (
                    <GreenBtn
                      onClick={() => handleApproveTeam(group)}
                      loading={approvingTeamKey === group.key}
                      disabled={approvingTeamKey !== null}
                      sx={{
                        ml: 1,
                      }}
                    >
                      <CheckCircle size={14} /> Approve All
                    </GreenBtn>
                  )}
                </Box>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headSx}>Participant</TableCell>
                      <TableCell sx={headSx}>Form</TableCell>
                      <TableCell sx={headSx}>Payment</TableCell>
                      <TableCell sx={headSx}>Submitted</TableCell>
                      <TableCell sx={{ ...headSx, textAlign: "right" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.members.map((row: any, memberIndex: any) => {
                      const name = row.user?.name || row.userName || "Unknown";
                      const email = row.user?.email || row.userEmail || "";
                      const registrationId = getRegistrationId(row);
                      const registrationStatus = String(
                        row?.status || row?.registration?.status || "PENDING",
                      ).toUpperCase();
                      const isPendingRegistration =
                        registrationStatus === "PENDING";
                      const paymentStatus = getPaymentStatus(row);
                      const requiresPayment = isPaymentRequired(row);
                      const isPaidRegistration = paymentStatus === "PAID";
                      const canResendPaymentLink = Boolean(
                        registrationId &&
                        registrationStatus === "APPROVED" &&
                        requiresPayment &&
                        !isPaidRegistration,
                      );
                      const isApproving = approvingId === registrationId;
                      const readiness = row.readiness || null;
                      const readinessReady = readiness?.ready !== false;
                      const readinessReasons = Array.isArray(
                        readiness?.missingRequirements,
                      )
                        ? readiness.missingRequirements
                        : [];
                      const canApprove = Boolean(
                        isPendingRegistration &&
                        readinessReady &&
                        !isApproving &&
                        registrationId,
                      );
                      const approvalTooltip = readinessReady
                        ? "Approve"
                        : readinessReasons[0] ||
                          readiness?.reason ||
                          "Registration is not ready for approval";
                      const formDetails = row.formDetails || {};
                      const hasSubmittedForm = Boolean(
                        formDetails.hasSubmittedForm,
                      );
                      const requiredCount = Number(
                        formDetails.requiredCount || 0,
                      );
                      const requiredAnsweredCount = Number(
                        formDetails.requiredAnsweredCount || 0,
                      );
                      const answeredCount = Number(
                        formDetails.answeredCount || 0,
                      );
                      const submittedText = requiredCount
                        ? `${requiredAnsweredCount}/${requiredCount} required`
                        : `${answeredCount} answered`;

                      return (
                        <TableRow
                          key={
                            registrationId ||
                            `${group.key}-member-${memberIndex}`
                          }
                          sx={{
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.02)",
                            },
                          }}
                        >
                          <TableCell sx={cellSx}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                src="/images/bg.jpeg"
                                alt={name}
                                sx={{
                                  width: 36,
                                  height: 36,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#fff", fontWeight: 500 }}
                                >
                                  {name}
                                </Typography>
                                <Chip
                                  label={registrationStatus}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    height: 20,
                                    backgroundColor:
                                      registrationStatus === "REJECTED"
                                        ? "rgba(239,68,68,0.14)"
                                        : registrationStatus === "APPROVED"
                                          ? "rgba(34,197,94,0.16)"
                                          : "rgba(245,158,11,0.2)",
                                    color:
                                      registrationStatus === "REJECTED"
                                        ? "#fca5a5"
                                        : registrationStatus === "APPROVED"
                                          ? "#4ade80"
                                          : "#f59e0b",
                                    fontWeight: 700,
                                    fontSize: 10,
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#71717a" }}
                                >
                                  {email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={cellSx}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Chip
                                label={
                                  hasSubmittedForm ? "Filled" : "Not filled"
                                }
                                size="small"
                                sx={{
                                  backgroundColor: hasSubmittedForm
                                    ? "rgba(34,197,94,0.16)"
                                    : "rgba(239,68,68,0.14)",
                                  color: hasSubmittedForm
                                    ? "#4ade80"
                                    : "#fca5a5",
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "#a1a1aa" }}
                              >
                                {submittedText}
                              </Typography>
                              {!readinessReady ? (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#fca5a5" }}
                                >
                                  {approvalTooltip}
                                </Typography>
                              ) : null}
                            </Box>
                          </TableCell>

                          <TableCell sx={cellSx}>
                            <Chip
                              label={
                                !requiresPayment
                                  ? "Not required"
                                  : paymentStatus
                              }
                              size="small"
                              sx={{
                                height: 22,
                                backgroundColor: !requiresPayment
                                  ? "rgba(113,113,122,0.2)"
                                  : paymentStatus === "PAID"
                                    ? "rgba(34,197,94,0.16)"
                                    : paymentStatus === "FAILED" ||
                                        paymentStatus === "EXPIRED"
                                      ? "rgba(239,68,68,0.14)"
                                      : "rgba(245,158,11,0.2)",
                                color: !requiresPayment
                                  ? "#a1a1aa"
                                  : paymentStatus === "PAID"
                                    ? "#4ade80"
                                    : paymentStatus === "FAILED" ||
                                        paymentStatus === "EXPIRED"
                                      ? "#fca5a5"
                                      : "#f59e0b",
                                fontWeight: 700,
                                fontSize: 10,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={cellSx}>
                            <Typography
                              variant="body2"
                              sx={{ color: "#a1a1aa" }}
                            >
                              {formatDate(row.createdAt || row.submittedAt)}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <PrimaryBtn onClick={() => openFormDialog(row)}>
                                <Eye size={14} />
                                View form
                              </PrimaryBtn>
                              <Tooltip title={approvalTooltip}>
                                <div>
                                  <GreenBtn
                                    onClick={() =>
                                      handleApprove(registrationId)
                                    }
                                    disabled={!canApprove}
                                    loading={isApproving}
                                  >
                                    <CheckCircle size={14} />
                                    Approve
                                  </GreenBtn>
                                </div>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <DangerBtn
                                  onClick={() =>
                                    openRejectDialog(row, registrationId)
                                  }
                                  disabled={
                                    !registrationId || !isPendingRegistration
                                  }
                                >
                                  <XCircle size={14} />
                                  Reject
                                </DangerBtn>
                              </Tooltip>
                              {canResendPaymentLink ? (
                                <Tooltip title="Resend payment link">
                                  <PrimaryBtn
                                    onClick={() =>
                                      handleResendPaymentLink(registrationId)
                                    }
                                    loading={
                                      resendingRegistrationId === registrationId
                                    }
                                    disabled={
                                      resendingRegistrationId !== null &&
                                      resendingRegistrationId !== registrationId
                                    }
                                  >
                                    <Link2 size={14} />
                                    Resend Link
                                  </PrimaryBtn>
                                </Tooltip>
                              ) : null}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog
        open={formDialog.open}
        onClose={() => setFormDialog({ open: false, row: null })}
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
          }}
        >
          Form Details
        </DialogTitle>
        <DialogContent sx={{ pt: "18px !important" }}>
          <Typography
            sx={{ color: "#fff", fontSize: 14, fontWeight: 600, mb: 0.4 }}
          >
            {formDialog.row?.user?.name ||
              formDialog.row?.userName ||
              "Participant"}
          </Typography>
          <Typography sx={{ color: "#71717a", fontSize: 12, mb: 2 }}>
            {formDialog.row?.user?.email || formDialog.row?.userEmail || ""}
          </Typography>

          {formDialog.row?.formDetails?.fields?.length ? (
            <Box sx={{ display: "grid", gap: 1.2 }}>
              {formDialog.row.formDetails.fields.map((field: any) => (
                <Box
                  key={field.fieldId}
                  sx={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    p: 1.2,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      mb: 0.6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{ color: "#fff", fontSize: 12, fontWeight: 600 }}
                    >
                      {field.label}
                    </Typography>
                    <Chip
                      label={field.hasValue ? "Filled" : "Not filled"}
                      size="small"
                      sx={{
                        backgroundColor: field.hasValue
                          ? "rgba(34,197,94,0.16)"
                          : "rgba(239,68,68,0.14)",
                        color: field.hasValue ? "#4ade80" : "#fca5a5",
                        fontWeight: 600,
                        fontSize: 10,
                      }}
                    />
                  </Box>
                  <Typography sx={{ color: "#a1a1aa", fontSize: 12, mb: 0.3 }}>
                    Scope: {field.scope}
                    {field.isRequired ? " • Required" : " • Optional"}
                  </Typography>
                  <Box
                    sx={{
                      color: field.hasValue
                        ? "rgba(255,255,255,0.9)"
                        : "#52525b",
                      fontSize: 12,
                      wordBreak: "break-word",
                    }}
                  >
                    {renderFieldAnswer(field)}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: "#71717a", fontSize: 13 }}>
              No form fields were configured for this registration.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            gap: 1,
          }}
        >
          <GhostBtn onClick={() => setFormDialog({ open: false, row: null })}>
            Close
          </GhostBtn>
        </DialogActions>
      </Dialog>

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
          <GhostBtn
            onClick={() =>
              setRejectDialog({
                open: false,
                registration: null,
                registrationId: null,
              })
            }
          >
            Cancel
          </GhostBtn>
          <DangerBtn
            onClick={handleReject}
            disabled={!rejectReason.trim() || isRejecting}
            loading={isRejecting}
          >
            <XCircle size={14} />
            Reject
          </DangerBtn>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Button Components (from Users page)
// ───────────────────────────────────────────────────────────────────────────────

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "9px 18px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

function BtnSpinner({ color = "currentColor" }) {
  return (
    <>
      <style>{`@keyframes _btnSpin { to { transform: rotate(360deg); } }`}</style>
      <Loader2
        size={13}
        color={color}
        style={{ animation: "_btnSpin 0.7s linear infinite", flexShrink: 0 }}
      />
    </>
  );
}

function GhostBtn({ onClick, children, loading, disabled }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
      }}
    >
      {loading && <BtnSpinner />}
      {children}
    </button>
  );
}

function PrimaryBtn({ onClick, children, disabled, loading }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#f4f4f5",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      }}
    >
      {loading && <BtnSpinner />}
      {children}
    </button>
  );
}

function GreenBtn({ onClick, children, disabled, loading }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(74,222,128,0.1)",
        border: "1px solid rgba(74,222,128,0.2)",
        color: "#4ade80",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(74,222,128,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(74,222,128,0.1)";
      }}
    >
      {loading && <BtnSpinner color="#4ade80" />}
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children, disabled, loading }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#f87171",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
      }}
    >
      {loading && <BtnSpinner color="#f87171" />}
      {children}
    </button>
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
