"use client";

import { useState, useMemo } from "react";
import {
  useApprovals,
  useApprovalStats,
  useApproveRequest,
  useRejectRequest,
} from "@/src/hooks/api/useApprovals";
import {
  usePendingLockRequests,
  useReviewLockRequest,
} from "@/src/hooks/api/useJudging";
import { Box, Dialog, Typography } from "@mui/material";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  X,
  Gavel,
  AlertCircle,
  Trophy,
  Star,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { LoadingState } from "@/src/components/LoadingState";

const TYPE_LABELS = {
  SCORE_LOCK: "Score Lock",
  EVENT_UPDATE: "Event Update",
};

const TYPE_COLORS = {
  SCORE_LOCK: {
    bg: "rgba(59,130,246,0.1)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  EVENT_UPDATE: {
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
};

const STATUS_COLORS = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  APPROVED: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
};

function TypePill({ type }) {
  const c = TYPE_COLORS[type] || {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  };
  return (
    <Box
      component="span"
      sx={{
        px: 1.5,
        py: 0.4,
        borderRadius: "6px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        display: "inline-block",
        lineHeight: 1.6,
      }}
    >
      {TYPE_LABELS[type] || type}
    </Box>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const Icon =
    status === "APPROVED"
      ? CheckCircle2
      : status === "REJECTED"
        ? XCircle
        : Clock;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Icon size={13} color={c.text} />
      <Typography
        sx={{ fontSize: 12, color: c.text, fontFamily: "'DM Mono', monospace" }}
      >
        {status}
      </Typography>
    </Box>
  );
}

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
);

export default function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (typeFilter !== "all") filters.type = typeFilter;

  const { data: approvalsRes, isLoading } = useApprovals(filters);
  const { data: stats } = useApprovalStats();
  const { data: lockRequests = [], isLoading: isLockRequestsLoading } =
    usePendingLockRequests();

  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const reviewLockRequestMutation = useReviewLockRequest();
  const { enqueueSnackbar } = useSnackbar();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailApproval, setDetailApproval] = useState(null);
  const [lockReviewDialogOpen, setLockReviewDialogOpen] = useState(false);
  const [selectedLockRequest, setSelectedLockRequest] = useState(null);
  const [lockReviewNotes, setLockReviewNotes] = useState("");

  const allApprovals = useMemo(
    () => approvalsRes?.data?.approvals || [],
    [approvalsRes],
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return allApprovals;
    const q = searchQuery.toLowerCase();
    return allApprovals.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.requestedBy?.name || "").toLowerCase().includes(q) ||
        (a.requestedBy?.email || "").toLowerCase().includes(q),
    );
  }, [allApprovals, searchQuery]);

  const pendingCount =
    stats?.pendingCount ??
    allApprovals.filter((a) => a.status === "PENDING").length;
  const approvedCount = allApprovals.filter(
    (a) => a.status === "APPROVED",
  ).length;
  const rejectedCount = allApprovals.filter(
    (a) => a.status === "REJECTED",
  ).length;

  const handleApprove = async (approval) => {
    try {
      await approveMutation.mutateAsync({ approvalId: approval.id });
      enqueueSnackbar("Request approved", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to approve",
        { variant: "error" },
      );
    }
  };

  const openReject = (approval) => {
    setSelectedApproval(approval);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({
        approvalId: selectedApproval.id,
        reason: rejectReason,
      });
      enqueueSnackbar("Request rejected", { variant: "success" });
      setRejectDialogOpen(false);
      setSelectedApproval(null);
      setRejectReason("");
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed to reject",
        { variant: "error" },
      );
    }
  };

  const openDetail = (approval) => {
    setDetailApproval(approval);
    setDetailDialogOpen(true);
  };

  const openLockReview = (request) => {
    setSelectedLockRequest(request);
    setLockReviewNotes("");
    setLockReviewDialogOpen(true);
  };

  const handleReviewLockRequest = async (status) => {
    if (!selectedLockRequest?.id) return;

    try {
      await reviewLockRequestMutation.mutateAsync({
        requestId: selectedLockRequest.id,
        status,
        reviewNotes: lockReviewNotes.trim() || undefined,
      });

      enqueueSnackbar(
        status === "APPROVED"
          ? "Score lock approved"
          : "Score lock request rejected",
        { variant: status === "APPROVED" ? "success" : "info" },
      );

      setLockReviewDialogOpen(false);
      setSelectedLockRequest(null);
      setLockReviewNotes("");
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to review score lock request",
        { variant: "error" },
      );
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (isLoading) return <LoadingState />;

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
            <ShieldCheck size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Approvals
          </Typography>
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
          Review and act on pending score locks and event update requests
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
          { label: "Pending", value: pendingCount, color: "#fbbf24" },
          { label: "Approved", value: approvedCount, color: "#4ade80" },
          { label: "Rejected", value: rejectedCount, color: "#f87171" },
        ].map((s) => (
          <Box
            key={s.label}
            onClick={() =>
              setStatusFilter(
                statusFilter === s.label.toUpperCase()
                  ? "all"
                  : s.label.toUpperCase(),
              )
            }
            sx={{
              p: 2.5,
              borderRadius: "12px",
              background: "#0c0c0c",
              border:
                statusFilter === s.label.toUpperCase()
                  ? `1px solid ${s.color}40`
                  : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              transition: "border-color 0.15s",
              "&:hover": { borderColor: `${s.color}30` },
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
        <Box sx={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or requestor…"
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
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </NativeSelect>
        <NativeSelect value={typeFilter} onChange={setTypeFilter}>
          <option value="all">All Types</option>
          <option value="SCORE_LOCK">Score Lock</option>
          <option value="EVENT_UPDATE">Event Update</option>
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
      <Box
        sx={{
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          background: "#0c0c0c",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "minmax(200px,1fr) 130px 160px 100px 110px 160px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["Request", "Type", "Requested By", "Date", "Status", ""].map(
            (h, i) => (
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
            ),
          )}
        </Box>
        <RowDivider />

        {filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              No approvals found
            </Typography>
          </Box>
        ) : (
          filtered.map((approval, idx) => (
            <Box key={approval.id}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(200px,1fr) 130px 160px 100px 110px 160px",
                  alignItems: "center",
                  px: 3,
                  py: 2,
                  transition: "background 0.12s",
                  "&:hover": { background: "rgba(255,255,255,0.02)" },
                }}
              >
                {/* Title + description */}
                <Box
                  sx={{ cursor: "pointer", minWidth: 0 }}
                  onClick={() => openDetail(approval)}
                >
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
                    {approval.title}
                  </Typography>
                  {approval.description && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.28)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {approval.description}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <TypePill type={approval.type} />
                </Box>

                {/* Requestor */}
                <Box sx={{ minWidth: 0, pr: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#e4e4e7",
                      fontFamily: "'Syne', sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {approval.requestedBy?.name || "—"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: "'DM Mono', monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {approval.requestedBy?.email || ""}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.28)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {fmtDate(approval.createdAt)}
                </Typography>

                <Box>
                  <StatusBadge status={approval.status} />
                </Box>

                {/* Actions */}
                <Box
                  sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                >
                  {approval.status === "PENDING" ? (
                    <>
                      <ActionBtn
                        onClick={() => handleApprove(approval)}
                        color="#4ade80"
                        hoverBg="rgba(74,222,128,0.1)"
                        disabled={approveMutation.isPending}
                        icon={<CheckCheck size={13} />}
                      >
                        Approve
                      </ActionBtn>
                      <ActionBtn
                        onClick={() => openReject(approval)}
                        color="#f87171"
                        hoverBg="rgba(239,68,68,0.1)"
                        icon={<X size={13} />}
                      >
                        Reject
                      </ActionBtn>
                    </>
                  ) : (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.15)",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {approval.reviewedAt ? fmtDate(approval.reviewedAt) : "—"}
                    </Typography>
                  )}
                </Box>
              </Box>
              {idx < filtered.length - 1 && <RowDivider />}
            </Box>
          ))
        )}
      </Box>

      {/* Score lock approvals */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}
          >
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
              <Gavel size={15} color="rgba(255,255,255,0.7)" />
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              Score Approvals
            </Typography>
            {lockRequests.length > 0 && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: "6px",
                  background: "rgba(251,191,36,0.12)",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <Typography
                  sx={{
                    color: "#fbbf24",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {lockRequests.length}
                </Typography>
              </Box>
            )}
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
            Review score-lock requests from head judges
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
            background: "#0c0c0c",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(200px,1fr) 160px 140px 100px 200px",
              px: 3,
              py: 1.5,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {["Round", "Requested By", "Submitted", "Status", ""].map(
              (h, i) => (
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
              ),
            )}
          </Box>
          <RowDivider />

          {isLockRequestsLoading ? (
            <Box sx={{ py: 4 }}>
              <LoadingState message="Loading score lock requests..." />
            </Box>
          ) : lockRequests.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.22)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No pending score lock requests
              </Typography>
            </Box>
          ) : (
            lockRequests.map((request, idx) => (
              <Box key={request.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(200px,1fr) 160px 140px 100px 200px",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.02)" },
                  }}
                >
                  <Box sx={{ minWidth: 0, pr: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Trophy size={13} color="#52525b" />
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
                        {request.competition?.title || "—"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <Star size={12} color="#71717a" />
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.35)",
                          fontFamily: "'DM Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {request.round?.name || "Round"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ minWidth: 0, pr: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#e4e4e7",
                        fontFamily: "'Syne', sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.requestedByUser?.name || "—"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.requestedByUser?.email || ""}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.28)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {request.createdAt ? fmtDate(request.createdAt) : "—"}
                  </Typography>

                  <StatusBadge status={request.status || "PENDING"} />

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <ActionBtn
                      onClick={() => openLockReview(request)}
                      color="#a78bfa"
                      hoverBg="rgba(168,85,247,0.12)"
                      disabled={reviewLockRequestMutation.isPending}
                      icon={<Gavel size={13} />}
                    >
                      Review
                    </ActionBtn>
                  </Box>
                </Box>
                {idx < lockRequests.length - 1 && <RowDivider />}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Reject dialog */}
      <DarkDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Request"
      >
        <DangerNote>
          The requestor will be notified that their request was rejected.
        </DangerNote>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedApproval?.title}
        </Typography>
        <DarkTextarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection…"
        />
        <BtnRow>
          <GhostBtn onClick={() => setRejectDialogOpen(false)}>Cancel</GhostBtn>
          <DangerBtn
            onClick={handleReject}
            disabled={rejectMutation.isPending || !rejectReason.trim()}
          >
            {rejectMutation.isPending ? "Rejecting…" : "Reject"}
          </DangerBtn>
        </BtnRow>
      </DarkDialog>

      {/* Detail dialog */}
      <DarkDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title={detailApproval?.title || "Request Details"}
      >
        {detailApproval && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <TypePill type={detailApproval.type} />
              <StatusBadge status={detailApproval.status} />
            </Box>

            {detailApproval.description && (
              <Box>
                <Label>Description</Label>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  {detailApproval.description}
                </Typography>
              </Box>
            )}

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <Box>
                <Label>Requested By</Label>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#e4e4e7",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {detailApproval.requestedBy?.name || "—"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.28)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {detailApproval.requestedBy?.email || ""}
                </Typography>
              </Box>
              <Box>
                <Label>Submitted</Label>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {fmtDate(detailApproval.createdAt)}
                </Typography>
              </Box>
            </Box>

            {detailApproval.requestData && (
              <Box>
                <Label>Request Data</Label>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.55)",
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(detailApproval.requestData, null, 2)}
                  </pre>
                </Box>
              </Box>
            )}

            {detailApproval.rejectionReason && (
              <Box>
                <Label>Rejection Reason</Label>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.12)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#f87171",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {detailApproval.rejectionReason}
                  </Typography>
                </Box>
              </Box>
            )}

            {detailApproval.status === "PENDING" && (
              <BtnRow>
                <GhostBtn onClick={() => setDetailDialogOpen(false)}>
                  Close
                </GhostBtn>
                <ActionBtn
                  onClick={async () => {
                    await handleApprove(detailApproval);
                    setDetailDialogOpen(false);
                  }}
                  color="#4ade80"
                  hoverBg="rgba(74,222,128,0.1)"
                  disabled={approveMutation.isPending}
                  icon={<CheckCheck size={13} />}
                >
                  Approve
                </ActionBtn>
                <DangerBtn
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openReject(detailApproval);
                  }}
                >
                  Reject
                </DangerBtn>
              </BtnRow>
            )}
            {detailApproval.status !== "PENDING" && (
              <BtnRow>
                <GhostBtn onClick={() => setDetailDialogOpen(false)}>
                  Close
                </GhostBtn>
              </BtnRow>
            )}
          </Box>
        )}
      </DarkDialog>

      <DarkDialog
        open={lockReviewDialogOpen}
        onClose={() => setLockReviewDialogOpen(false)}
        title="Review Score Lock Request"
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedLockRequest
            ? `${selectedLockRequest.competition?.title || "Competition"} • ${selectedLockRequest.round?.name || "Round"}`
            : ""}
        </Typography>

        <DarkTextarea
          rows={3}
          value={lockReviewNotes}
          onChange={(e) => setLockReviewNotes(e.target.value)}
          placeholder="Optional review notes…"
        />

        <BtnRow>
          <GhostBtn onClick={() => setLockReviewDialogOpen(false)}>
            Cancel
          </GhostBtn>
          <DangerBtn
            onClick={() => handleReviewLockRequest("REJECTED")}
            disabled={reviewLockRequestMutation.isPending}
          >
            {reviewLockRequestMutation.isPending ? "Submitting…" : "Reject"}
          </DangerBtn>
          <ActionBtn
            onClick={() => handleReviewLockRequest("APPROVED")}
            color="#4ade80"
            hoverBg="rgba(74,222,128,0.1)"
            disabled={reviewLockRequestMutation.isPending}
            icon={<CheckCheck size={13} />}
          >
            {reviewLockRequestMutation.isPending ? "Submitting…" : "Approve"}
          </ActionBtn>
        </BtnRow>
      </DarkDialog>
    </Box>
  );
}

/* ── Primitives ── */

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

function DarkDialog({ open, onClose, title, children }) {
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
          p: 0,
        },
      }}
    >
      <Box
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          px: 3,
          py: 2.5,
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
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 3, py: 3 }}>{children}</Box>
    </Dialog>
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

function DarkTextarea({ rows = 3, value, onChange, placeholder }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
        fontFamily: "'Syne', sans-serif",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

function DangerNote({ children }) {
  return (
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
        {children}
      </Typography>
    </Box>
  );
}

function BtnRow({ children }) {
  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 3 }}>
      {children}
    </Box>
  );
}

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
};

function GhostBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        e.currentTarget.style.color = "rgba(255,255,255,0.7)";
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

function DangerBtn({ onClick, children, disabled }) {
  return (
    <button
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
          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({ onClick, children, color, hoverBg, disabled, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 12px",
        background: "transparent",
        border: `1px solid ${color}30`,
        color,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = hoverBg;
          e.currentTarget.style.borderColor = `${color}60`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = `${color}30`;
      }}
    >
      {icon}
      {children}
    </button>
  );
}
