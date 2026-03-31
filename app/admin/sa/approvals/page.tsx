"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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
import { useReviewProposals } from "@/src/hooks/api/useReviews";
import { useIssues, useResolveIssue } from "@/src/hooks/api/useIssues";
import { useCompetition } from "@/src/hooks/api/useCompetitions";
import { useCompetitionForms } from "@/src/hooks/api/useCompetitionForms";
import { Box, Dialog, Typography } from "@mui/material";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  Gavel,
  AlertCircle,
  Trophy,
  Star,
  Wrench,
  FileText,
  Loader2,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { LoadingState } from "@/src/components/LoadingState";
import { queryKeys } from "@/src/lib/queryKeys";

/* ── Constants ── */

const TYPE_LABELS: any = {
  SCORE_LOCK: "Score Lock",
  EVENT_UPDATE: "Event Update",
  COMPETITION_EDIT: "Competition Update",
  PROMO_CODE_ADD: "Promo Code",
};

const TYPE_COLORS: any = {
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
  COMPETITION_EDIT: {
    bg: "rgba(168,85,247,0.1)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.2)",
  },
  PROMO_CODE_ADD: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
};

const STATUS_COLORS: any = {
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
  OPEN: {
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  RESOLVED: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
};

const fmtDate = (d: any) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

const fmtDateTime = (d: any) =>
  d
    ? new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";

const COMPETITION_FIELD_LABELS: any = {
  title: "Title",
  shortDescription: "Short Description",
  category: "Category",
  eventType: "Event Type",
  type: "Participation Type",
  status: "Status",
  registrationFee: "Registration Fee",
  registrationDeadline: "Registration Deadline",
  startTime: "Start Time",
  endTime: "End Time",
  venueName: "Venue Name",
  venueRoom: "Room",
  venueFloor: "Floor",
  minTeamSize: "Min Team Size",
  maxTeamSize: "Max Team Size",
  maxRegistrations: "Max Registrations",
  maxTeamsPerCollege: "Max Teams / College",
  registrationsOpen: "Registrations Open",
  requiresApproval: "Requires Approval",
  autoApproveTeams: "Auto-Approve Teams",
  attendanceRequired: "Attendance Required",
  perPerson: "Fee Per Person",
  isPaid: "Paid Event",
};

const COMPETITION_OVERVIEW_FIELDS = [
  "title",
  "eventType",
  "type",
  "status",
  "registrationFee",
  "registrationDeadline",
  "startTime",
  "endTime",
  "venueName",
  "venueRoom",
  "venueFloor",
  "minTeamSize",
  "maxTeamSize",
  "maxRegistrations",
  "maxTeamsPerCollege",
  "registrationsOpen",
  "requiresApproval",
  "autoApproveTeams",
  "attendanceRequired",
  "perPerson",
  "isPaid",
  "category",
  "shortDescription",
];

const toCompetitionRequestActionLabel = (action: any) => {
  if (action === "CREATE_COMPETITION") return "Create Competition";
  if (action === "DELETE_COMPETITION") return "Delete Competition";
  if (action) {
    return action
      .toLowerCase()
      .split("_")
      .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Update Competition";
};

const formatCompetitionFieldValue = (key: any, value: any) => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (key === "registrationFee") {
    const amount = Number(value);
    return Number.isFinite(amount) ? `₹${amount}` : String(value);
  }

  if (
    key === "registrationDeadline" ||
    key === "startTime" ||
    key === "endTime"
  ) {
    return fmtDateTime(value);
  }

  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value
      .map((item) => {
        if (item === null || item === undefined) return "";
        if (typeof item === "object") {
          return (
            item?.label || item?.name || item?.code || JSON.stringify(item)
          );
        }
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const getCompetitionRequestPreview = (approval: any) => {
  const requestData = approval?.requestData;
  if (!requestData) return null;

  const action = requestData?.action;
  const type = approval?.type;
  const isCompetitionLike =
    type === "COMPETITION_EDIT" ||
    (typeof action === "string" && action.includes("COMPETITION")) ||
    requestData?.relatedEntityType === "competition";

  if (!isCompetitionLike) return null;

  const before = requestData?.before || null;
  const proposed = requestData?.proposed || requestData?.after || null;

  if (!before && !proposed) return null;

  return {
    actionLabel: toCompetitionRequestActionLabel(action),
    before,
    proposed,
  };
};

const getChangedCompetitionFieldRows = (before: any, proposed: any) => {
  if (!before || !proposed) return [];

  const keys = Array.from(
    new Set([
      ...Object.keys(before || {}),
      ...Object.keys(proposed || {}),
      ...COMPETITION_OVERVIEW_FIELDS,
    ]),
  );

  return keys
    .filter(
      (key: any) =>
        JSON.stringify(before?.[key]) !== JSON.stringify(proposed?.[key]),
    )
    .map((key: any) => ({
      key,
      label: COMPETITION_FIELD_LABELS[key] || key,
      before: formatCompetitionFieldValue(key, before?.[key]),
      proposed: formatCompetitionFieldValue(key, proposed?.[key]),
    }));
};

const toFormRequestActionLabel = (action: any) => {
  if (action === "CREATE_FORM") return "Create Form";
  if (action === "UPDATE_FORM") return "Update Form";
  if (action === "DELETE_FORM") return "Delete Form";
  if (!action) return "Form Update";
  return action
    .toLowerCase()
    .split("_")
    .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getFormRequestPreview = (approval: any) => {
  const requestData = approval?.requestData;
  if (!requestData) return null;

  const isFormRequest =
    approval?.type === "EVENT_UPDATE" &&
    (requestData?.category === "FORM" ||
      ["CREATE_FORM", "UPDATE_FORM", "DELETE_FORM"].includes(
        requestData?.action,
      ));

  if (!isFormRequest) return null;

  return {
    actionLabel: toFormRequestActionLabel(requestData?.action),
    competitionId:
      requestData?.competitionId ||
      requestData?.proposed?.competitionId ||
      null,
    formId: requestData?.formId || null,
    proposed: requestData?.proposed || null,
  };
};

const toAbsoluteUrl = (base: any, path: any) => {
  if (!base || !path) return null;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const buildMediaCandidates = (mediaPath: any) => {
  if (!mediaPath || typeof mediaPath !== "string") return [];

  const candidates: any[] = [];
  const add = (value: any) => {
    if (!value) return;
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  };

  const normalizedPath: string = mediaPath.startsWith("/")
    ? mediaPath
    : `/${mediaPath}`;

  if (/^https?:\/\//i.test(mediaPath)) {
    add(mediaPath);
  }

  add(normalizedPath);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (apiBase) {
    add(toAbsoluteUrl(apiBase, normalizedPath));

    const baseWithoutApiPrefix = apiBase.replace(/\/api\/v\d+\/?$/i, "");
    add(toAbsoluteUrl(baseWithoutApiPrefix, normalizedPath));
  }

  if (typeof window !== "undefined") {
    add(toAbsoluteUrl(window.location.origin, normalizedPath));
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    add(`${protocol}//${host}:8080${normalizedPath}`);
    add(`${protocol}//${host}:3001${normalizedPath}`);
  }

  return candidates;
};

const extractMediaPath = (value: any) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.path === "string") return value.path;
    if (typeof value.url === "string") return value.url;
  }
  return null;
};

/* ── Sub-components ── */

function Pill({ bg, text, border, children }: any) {
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.35,
        borderRadius: "6px",
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

function TypePill({ type }: any) {
  const c = TYPE_COLORS[type] || {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  };
  return <Pill {...c}>{TYPE_LABELS[type] || type}</Pill>;
}

function StatusPill({ status }: any) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return <Pill {...c}>{status}</Pill>;
}

function StatusBadge({ status }: any) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const Icon =
    status === "APPROVED" || status === "RESOLVED"
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

function TableHeader({ cols }: any) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: cols,
        px: 3,
        py: 1.5,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {cols.split(" ").map((_: any, { i, arr }: any) => null)}
    </Box>
  );
}

function EmptyRow({ message }: any) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <AlertCircle size={16} color="rgba(255,255,255,0.15)" />
      <Typography
        sx={{
          mt: 1,
          fontSize: 12,
          color: "rgba(255,255,255,0.22)",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

function RequestMediaPreview({ label, path }: any) {
  const candidates = useMemo(() => buildMediaCandidates(path), [path]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [path]);

  const src = candidates[candidateIndex] || null;
  if (!src) return null;

  return (
    <Box>
      <Label>{label}</Label>
      <Box
        sx={{
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#0c0c0c",
        }}
      >
        <img
          src={src}
          alt={`${label} preview`}
          style={{
            display: "block",
            width: "100%",
            maxHeight: 180,
            objectFit: "cover",
          }}
          onError={() => {
            setCandidateIndex((current) =>
              current < candidates.length - 1 ? current + 1 : current,
            );
          }}
        />
      </Box>
    </Box>
  );
}

/* ── Main page ── */

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("approvals");

  /* approvals */
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [approvalSearch, setApprovalSearch] = useState("");

  const approvalFilters: any = {};
  if (statusFilter !== "all") approvalFilters.status = statusFilter;
  if (typeFilter !== "all") approvalFilters.type = typeFilter;

  const { data: approvalsRes, isLoading: isApprovalsLoading } =
    useApprovals(approvalFilters) as any;
  const { data: stats } = useApprovalStats();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailApproval, setDetailApproval] = useState<any>(null);
  const [processingApprovalId, setProcessingApprovalId] = useState(null);
  const [handledApprovalIds, setHandledApprovalIds] = useState(() => new Set());

  const requestedPublishStatus =
    detailApproval?.requestData?.proposed?.status ||
    detailApproval?.requestData?.after?.status ||
    detailApproval?.requestData?.status ||
    null;

  const competitionRequestPreview = useMemo(
    () => getCompetitionRequestPreview(detailApproval),
    [detailApproval],
  ) as any;

  const formRequestPreview = useMemo(
    () => getFormRequestPreview(detailApproval),
    [detailApproval],
  ) as any;

  const competitionRequestMedia = useMemo(() => {
    const requestData = detailApproval?.requestData || {};
    const proposed =
      competitionRequestPreview?.proposed || requestData?.proposed || {};
    const before =
      competitionRequestPreview?.before || requestData?.before || {};

    return {
      posterPath:
        extractMediaPath(proposed.posterPath) ||
        extractMediaPath(requestData.posterPath) ||
        extractMediaPath(before.posterPath),
      bannerPath:
        extractMediaPath(proposed.bannerPath) ||
        extractMediaPath(requestData.bannerPath) ||
        extractMediaPath(before.bannerPath),
    };
  }, [detailApproval, competitionRequestPreview]);

  const changedCompetitionRows = useMemo(
    () =>
      getChangedCompetitionFieldRows(
        competitionRequestPreview?.before,
        competitionRequestPreview?.proposed,
      ),
    [competitionRequestPreview],
  );

  const publishPreviewCompetitionId =
    detailDialogOpen && detailApproval
      ? detailApproval?.relatedEntityId ||
      detailApproval?.requestData?.competitionId ||
      detailApproval?.requestData?.before?.id ||
      detailApproval?.requestData?.proposed?.id ||
      null
      : null;

  const isCompetitionPublishRequest = useMemo(() => {
    if (!detailApproval) return false;

    const type = detailApproval.type;
    const relatedEntityType =
      detailApproval.relatedEntityType ||
      detailApproval.requestData?.category ||
      "";
    const title = (detailApproval.title || "").toLowerCase();
    const description = (detailApproval.description || "").toLowerCase();

    const looksLikePublishCopy =
      title.includes("publish") || description.includes("publish");
    const targetsCompetition =
      `${relatedEntityType}`.toLowerCase() === "competition";
    const isCompetitionApprovalType =
      type === "EVENT_UPDATE" || type === "COMPETITION_EDIT";

    return (
      isCompetitionApprovalType &&
      targetsCompetition &&
      (requestedPublishStatus === "OPEN" || looksLikePublishCopy)
    );
  }, [detailApproval, requestedPublishStatus]);

  const {
    data: publishPreviewCompetition,
    isLoading: publishPreviewCompetitionLoading,
  } = useCompetition(
    isCompetitionPublishRequest ? publishPreviewCompetitionId : null,
  );

  const { data: allCompetitionForms = [] } = useCompetitionForms(
    detailDialogOpen && isCompetitionPublishRequest,
  );

  const linkedFormsForPublishPreview = useMemo(() => {
    if (!isCompetitionPublishRequest || !publishPreviewCompetitionId) return [];

    return allCompetitionForms
      .filter((form) => form?.competitionId === publishPreviewCompetitionId)
      .sort((left, right) => {
        const leftTime = left?.createdAt
          ? new Date(left.createdAt).getTime()
          : 0;
        const rightTime = right?.createdAt
          ? new Date(right.createdAt).getTime()
          : 0;
        return rightTime - leftTime;
      });
  }, [
    isCompetitionPublishRequest,
    publishPreviewCompetitionId,
    allCompetitionForms,
  ]);

  const allApprovals = useMemo(
    () => approvalsRes?.data?.approvals || [],
    [approvalsRes],
  );
  const filteredApprovals = useMemo(() => {
    if (!approvalSearch) return allApprovals;
    const q = approvalSearch.toLowerCase();
    return allApprovals.filter(
      (a: any) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.requestedBy?.name || "").toLowerCase().includes(q) ||
        (a.requestedBy?.email || "").toLowerCase().includes(q),
    );
  }, [allApprovals, approvalSearch]);

  const pendingCount =
    stats?.pendingCount ??
    allApprovals.filter((a: any) => a.status === "PENDING").length;

  /* score locks */
  const { data: lockRequests = [], isLoading: isLockLoading } =
    usePendingLockRequests();
  const reviewLockMutation = useReviewLockRequest();
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [selectedLock, setSelectedLock] = useState<any>(null);
  const [lockNotes, setLockNotes] = useState("");

  /* reviews */
  const [reviewStatus, setReviewStatus] = useState("PENDING");
  const { data: reviewsData, isLoading: isReviewsLoading } = useReviewProposals(
    { status: reviewStatus },
  );
  const proposals = useMemo(() => reviewsData?.proposals || [], [reviewsData]);

  /* issues */
  const [showResolved, setShowResolved] = useState(false);
  const [issueSearch, setIssueSearch] = useState("");
  const { data: issues = [], isLoading: isIssuesLoading } = useIssues(
    showResolved ? {} : { resolved: false },
  );
  const resolveMutation = useResolveIssue();
  const filteredIssues = useMemo(() => {
    if (!issueSearch) return issues;
    const q = issueSearch.toLowerCase();
    return issues.filter(
      (i) =>
        (i.message || "").toLowerCase().includes(q) ||
        (i.creator?.name || "").toLowerCase().includes(q) ||
        (i.creator?.email || "").toLowerCase().includes(q),
    );
  }, [issues, issueSearch]);
  const openIssues = issues.filter((i) => !i.resolved).length;

  const { enqueueSnackbar } = useSnackbar();

  const markApprovalHandled = (approvalId: any) => {
    setHandledApprovalIds((previous) => {
      if (previous.has(approvalId)) return previous;
      const next = new Set(previous);
      next.add(approvalId);
      return next;
    });
  };

  const isAlreadyProcessedError = (error: any) =>
    error?.response?.data?.error === "APPROVAL_ALREADY_PROCESSED";

  /* handlers */
  const handleApprove = async (approval: any) => {
    if (!approval?.id || handledApprovalIds.has(approval.id)) {
      return;
    }

    try {
      setProcessingApprovalId(approval.id);
      await approveMutation.mutateAsync({ approvalId: approval.id });
      markApprovalHandled(approval.id);
      enqueueSnackbar("Request approved", { variant: "success" });
      if (detailDialogOpen) setDetailDialogOpen(false);
    } catch (err: any) {
      if (isAlreadyProcessedError(err)) {
        markApprovalHandled(approval.id);
        enqueueSnackbar(
          "This request was already processed. Refreshing list…",
          {
            variant: "info",
          },
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
        if (detailDialogOpen) setDetailDialogOpen(false);
        return;
      }

      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        {
          variant: "error",
        },
      );
    } finally {
      setProcessingApprovalId(null);
    }
  };

  const openReject = (approval: any) => {
    setSelectedApproval(approval);
    setRejectReason("");
    setRejectDialogOpen(true);
    if (detailDialogOpen) setDetailDialogOpen(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    if (!selectedApproval?.id || handledApprovalIds.has(selectedApproval.id)) {
      return;
    }

    try {
      setProcessingApprovalId(selectedApproval.id);
      await rejectMutation.mutateAsync({
        approvalId: selectedApproval.id,
        reason: rejectReason,
      });
      markApprovalHandled(selectedApproval.id);
      enqueueSnackbar("Request rejected", { variant: "success" });
      setRejectDialogOpen(false);
      setSelectedApproval(null);
      setRejectReason("");
    } catch (err: any) {
      if (isAlreadyProcessedError(err)) {
        markApprovalHandled(selectedApproval.id);
        enqueueSnackbar(
          "This request was already processed. Refreshing list…",
          {
            variant: "info",
          },
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
        setRejectDialogOpen(false);
        setSelectedApproval(null);
        setRejectReason("");
        return;
      }

      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        {
          variant: "error",
        },
      );
    } finally {
      setProcessingApprovalId(null);
    }
  };

  const openLock = (req: any) => {
    setSelectedLock(req);
    setLockNotes("");
    setLockDialogOpen(true);
  };

  const handleLockReview = async (status: any) => {
    try {
      await reviewLockMutation.mutateAsync({
        requestId: selectedLock.id,
        status,
        reviewNotes: lockNotes.trim() || undefined,
      });
      enqueueSnackbar(
        status === "APPROVED" ? "Score lock approved" : "Score lock rejected",
        {
          variant: status === "APPROVED" ? "success" : "info",
        },
      );
      setLockDialogOpen(false);
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        { variant: "error" },
      );
    }
  };

  const handleResolve = async (issueId: any) => {
    try {
      await resolveMutation.mutateAsync({ issueId });
      enqueueSnackbar("Issue resolved", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        { variant: "error" },
      );
    }
  };

  const TABS = [
    { id: "approvals", label: "Approvals", badge: pendingCount || null },
    { id: "locks", label: "Score Locks", badge: lockRequests.length || null },
    {
      id: "reviews",
      label: "Reviews",
      badge: proposals.filter((p) => p.status === "PENDING").length || null,
    },
    { id: "issues", label: "Issues", badge: openIssues || null },
  ];

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
            Requests
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
          Approvals, score locks, competition reviews, and support issues
        </Typography>
      </Box>

      {/* Tab bar */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          mb: 3,
          p: 0.5,
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
          width: "fit-content",
        }}
      >
        {TABS.map((t) => (
          <Box
            key={t.id}
            onClick={() => setTab(t.id)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 0.75,
              borderRadius: "9px",
              cursor: "pointer",
              transition: "all 0.15s",
              background:
                tab === t.id ? "rgba(255,255,255,0.08)" : "transparent",
              color: tab === t.id ? "#f4f4f5" : "rgba(255,255,255,0.35)",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                fontWeight: tab === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </Typography>
            {t.badge > 0 && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.1,
                  borderRadius: "5px",
                  background:
                    tab === t.id
                      ? "rgba(251,191,36,0.2)"
                      : "rgba(255,255,255,0.06)",
                  border:
                    tab === t.id
                      ? "1px solid rgba(251,191,36,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: tab === t.id ? "#fbbf24" : "rgba(255,255,255,0.3)",
                    lineHeight: 1.4,
                  }}
                >
                  {t.badge}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* ── Tab: Approvals ── */}
      {tab === "approvals" && (
        <Box>
          {isApprovalsLoading ? (
            <LoadingState />
          ) : (
            <>
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
                  {
                    label: "Pending",
                    value: pendingCount,
                    color: "#fbbf24",
                    id: "PENDING",
                  },
                  {
                    label: "Approved",
                    value: allApprovals.filter((a: any) => a.status === "APPROVED")
                      .length,
                    color: "#4ade80",
                    id: "APPROVED",
                  },
                  {
                    label: "Rejected",
                    value: allApprovals.filter((a: any) => a.status === "REJECTED")
                      .length,
                    color: "#f87171",
                    id: "REJECTED",
                  },
                ].map((s) => (
                  <Box
                    key={s.label}
                    onClick={() =>
                      setStatusFilter(statusFilter === s.id ? "all" : s.id)
                    }
                    sx={{
                      p: 2.5,
                      borderRadius: "12px",
                      background: "#0c0c0c",
                      border:
                        statusFilter === s.id
                          ? `1px solid ${s.color}40`
                          : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                      "&:hover": { borderColor: `${s.color}25` },
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
                <Box
                  sx={{
                    position: "relative",
                    flex: "1 1 200px",
                    minWidth: 180,
                  }}
                >
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
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    placeholder="Search title, description, requestor…"
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
                  <option value="COMPETITION_EDIT">Competition Update</option>
                </NativeSelect>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.18)",
                    fontFamily: "'DM Mono', monospace",
                    ml: "auto",
                  }}
                >
                  {filteredApprovals.length} result
                  {filteredApprovals.length !== 1 ? "s" : ""}
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
                data-lenis-prevent
              >
                <Box
                  data-lenis-prevent
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(220px,1fr) 140px 160px 110px 110px 120px",
                    px: 3,
                    py: 1.5,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {[
                    "Request",
                    "Type",
                    "Requested By",
                    "Date",
                    "Status",
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
                data-lenis-prevent
                sx={{ maxHeight: "min(60vh,600px)", overflowY: "auto" }}>
                  <RowDivider />
                  {filteredApprovals.length === 0 ? (
                    <EmptyRow message="No approvals found" />
                  ) : (
                    filteredApprovals.map((a:any , idx : any) => (
                      <Box key={a.id}>
                        {(() => {
                          const isLocallyHandled = handledApprovalIds.has(a.id);
                          const isPending =
                            a.status === "PENDING" && !isLocallyHandled;
                          const isProcessing = processingApprovalId === a.id;

                          return (
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns:
                                  "minmax(220px,1fr) 140px 160px 110px 110px 120px",
                                alignItems: "center",
                                px: 3,
                                py: 2,
                                transition: "background 0.12s",
                                "&:hover": {
                                  background: "rgba(255,255,255,0.02)",
                                },
                              }}
                            >
                              <Box
                                sx={{ cursor: "pointer", minWidth: 0, pr: 1 }}
                                onClick={() => {
                                  setDetailApproval(a);
                                  setDetailDialogOpen(true);
                                }}
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
                                  {a.title}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.25)",
                                    fontFamily: "'DM Mono', monospace",
                                  }}
                                >
                                  {TYPE_LABELS[a.type] || a.type}
                                </Typography>
                              </Box>
                              <Box sx={{ overflow: "hidden" }}>
                                <TypePill type={a.type} />
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
                                  {a.requestedBy?.name || "—"}
                                </Typography>
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.28)",
                                  fontFamily: "'DM Mono', monospace",
                                }}
                              >
                                {fmtDate(a.createdAt)}
                              </Typography>
                              <Box>
                                <StatusBadge
                                  status={
                                    isLocallyHandled ? "APPROVED" : a.status
                                  }
                                />
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <PrimaryBtn
                                  onClick={() => {
                                    setDetailApproval(a);
                                    setDetailDialogOpen(true);
                                  }}
                                  disabled={isProcessing}
                                >
                                  <FileText size={12} />
                                  {isPending ? "Review" : "View"}
                                </PrimaryBtn>
                              </Box>
                            </Box>
                          );
                        })()}
                        {idx < filteredApprovals.length - 1 && <RowDivider />}
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}

      {/* ── Tab: Score Locks ── */}
      {tab === "locks" && (
        <Box>
          {isLockLoading ? (
            <LoadingState />
          ) : (
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
                    "minmax(200px,1fr) 160px 140px 110px 160px",
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
              <Box 
              data-lenis-prevent
              sx={{ maxHeight: "min(60vh,600px)", overflowY: "auto" }}>
                <RowDivider />
                {lockRequests.length === 0 ? (
                  <EmptyRow message="No pending score lock requests" />
                ) : (
                  lockRequests.map(( req:any, idx:any) => (
                    <Box key={req.id}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(200px,1fr) 160px 140px 110px 160px",
                          alignItems: "center",
                          px: 3,
                          py: 2,
                          transition: "background 0.12s",
                          "&:hover": { background: "rgba(255,255,255,0.02)" },
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
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
                              {req.competition?.title || "—"}
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
                              {req.round?.name || "Round"}
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
                            {req.requestedByUser?.name || "—"}
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
                            {req.requestedByUser?.email || ""}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.28)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {fmtDate(req.createdAt)}
                        </Typography>
                        <Box>
                          <StatusBadge status={req.status || "PENDING"} />
                        </Box>
                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          <PrimaryBtn onClick={() => openLock(req)}>
                            <Gavel size={12} />
                            Review
                          </PrimaryBtn>
                        </Box>
                      </Box>
                      {idx < lockRequests.length - 1 && <RowDivider />}
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ── Tab: Reviews ── */}
      {tab === "reviews" && (
        <Box>
          {/* Status filter */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 2 }}>
            {["PENDING", "APPROVED", "REJECTED"].map((s) => (
              <Box
                key={s}
                onClick={() => setReviewStatus(s)}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  cursor: "pointer",
                  border:
                    reviewStatus === s
                      ? `1px solid ${STATUS_COLORS[s].border}`
                      : "1px solid rgba(255,255,255,0.07)",
                  background:
                    reviewStatus === s ? STATUS_COLORS[s].bg : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    fontFamily: "'Syne', sans-serif",
                    color:
                      reviewStatus === s
                        ? STATUS_COLORS[s].text
                        : "rgba(255,255,255,0.35)",
                    fontWeight: reviewStatus === s ? 600 : 400,
                  }}
                >
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </Typography>
              </Box>
            ))}
          </Box>

          {isReviewsLoading ? (
            <LoadingState />
          ) : (
            <Box
              sx={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
                background: "#0c0c0c",
              }}
            >
              {proposals.length === 0 ? (
                <EmptyRow message="No proposals found" />
              ) : (
                proposals.map((p, idx) => (
                  <Box key={p.id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 3,
                        py: 2.5,
                        transition: "background 0.12s",
                        "&:hover": { background: "rgba(255,255,255,0.02)" },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 0.5,
                          }}
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
                            {p.competitionTitle || "—"}
                          </Typography>
                          <StatusPill status={p.status} />
                        </Box>
                        {p.summary && (
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.35)",
                              fontFamily: "'DM Mono', monospace",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.summary}
                          </Typography>
                        )}
                      </Box>
                      <Link
                        href={`/admin/sa/reviews/${p.id}`}
                        style={{ textDecoration: "none", flexShrink: 0 }}
                      >
                        <PrimaryBtn>
                          <FileText size={12} />
                          Review
                        </PrimaryBtn>
                      </Link>
                    </Box>
                    {idx < proposals.length - 1 && <RowDivider />}
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ── Tab: Issues ── */}
      {tab === "issues" && (
        <Box>
          {/* Stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" },
              gap: 2,
              mb: 3,
            }}
          >
            {[
              {
                label: "Open",
                value: issues.filter((i) => !i.resolved).length,
                color: "#fbbf24",
              },
              {
                label: "Resolved",
                value: issues.filter((i) => i.resolved).length,
                color: "#4ade80",
              },
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
              mb: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Search size={14} color="rgba(255,255,255,0.35)" />
              <input
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                placeholder="Search by message, creator name, or email"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              />
            </Box>
            <GhostBtn
              onClick={() => setShowResolved((v) => !v)}
              style={{ whiteSpace: "nowrap" }}
            >
              {showResolved ? "Hide Resolved" : "Show Resolved"}
            </GhostBtn>
          </Box>

          {isIssuesLoading ? (
            <LoadingState />
          ) : (
            <Box
              sx={{
                borderRadius: "12px",
                background: "#0c0c0c",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              {filteredIssues.length === 0 ? (
                <EmptyRow message="No issues found" />
              ) : (
                filteredIssues.map((issue, idx) => {
                  const status = issue.resolved ? "RESOLVED" : "OPEN";
                  return (
                    <Box
                      key={issue.id}
                      sx={{
                        p: 2.5,
                        borderBottom:
                          idx < filteredIssues.length - 1
                            ? "1px solid rgba(255,255,255,0.06)"
                            : "none",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          mb: 1.25,
                        }}
                      >
                        <StatusPill status={status} />
                        {!issue.resolved && (
                          <GreenBtn
                            onClick={() => handleResolve(issue.id)}
                            loading={resolveMutation.isPending}
                          >
                            <CheckCircle2 size={12} />
                            Resolve
                          </GreenBtn>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.82)",
                          fontSize: 13,
                          fontFamily: "'Syne', sans-serif",
                          mb: 1.25,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {issue.message}
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(3,1fr)",
                          },
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          Creator: {issue.creator?.name || "Unknown"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          Email: {issue.creator?.email || "—"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "'DM Mono', monospace",
                            textAlign: { xs: "left", md: "right" },
                          }}
                        >
                          Created: {fmtDateTime(issue.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ── Dialogs ── */}

      {/* Reject approval */}
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
          onChange={(e: any) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection…"
        />
        <BtnRow>
          <GhostBtn onClick={() => setRejectDialogOpen(false)}>Cancel</GhostBtn>
          <DangerBtn
            onClick={handleReject}
            disabled={!rejectReason.trim()}
            loading={rejectMutation.isPending}
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
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
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

            {isCompetitionPublishRequest && (
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "10px",
                  border: "1px solid rgba(74,222,128,0.2)",
                  background: "rgba(74,222,128,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Label>Competition Publish Preview</Label>

                {publishPreviewCompetitionLoading ? (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    Loading competition details…
                  </Typography>
                ) : publishPreviewCompetition ? (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.25,
                      }}
                    >
                      <PreviewItem
                        label="Title"
                        value={publishPreviewCompetition.title || "—"}
                      />
                      <PreviewItem
                        label="Status"
                        value={publishPreviewCompetition.status || "—"}
                      />
                      <PreviewItem
                        label="Event Type"
                        value={publishPreviewCompetition.eventType || "—"}
                      />
                      <PreviewItem
                        label="Competition Type"
                        value={publishPreviewCompetition.type || "—"}
                      />
                      <PreviewItem
                        label="Registration Fee"
                        value={`₹${publishPreviewCompetition.registrationFee ?? 0}`}
                      />
                      <PreviewItem
                        label="Registration Deadline"
                        value={fmtDateTime(
                          publishPreviewCompetition.registrationDeadline,
                        )}
                      />
                      <PreviewItem
                        label="Start Time"
                        value={fmtDateTime(publishPreviewCompetition.startTime)}
                      />
                      <PreviewItem
                        label="End Time"
                        value={fmtDateTime(publishPreviewCompetition.endTime)}
                      />
                    </Box>

                    <Box>
                      <Label>
                        Linked Forms ({linkedFormsForPublishPreview.length})
                      </Label>
                      {linkedFormsForPublishPreview.length === 0 ? (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.45)",
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          No linked form found.
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            mt: 0.75,
                          }}
                        >
                          {linkedFormsForPublishPreview.map((form) => (
                            <Box
                              key={form.id}
                              sx={{
                                p: 1,
                                borderRadius: "8px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "#e4e4e7",
                                  fontFamily: "'Syne', sans-serif",
                                  fontWeight: 500,
                                }}
                              >
                                {form.title || "Untitled Form"}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.35)",
                                  fontFamily: "'DM Mono', monospace",
                                  mt: 0.25,
                                }}
                              >
                                Status: {form.status || "—"} · Opens:{" "}
                                {fmtDateTime(form.opensAt)} · Closes:{" "}
                                {fmtDateTime(form.closesAt)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    Unable to load linked competition details.
                  </Typography>
                )}
              </Box>
            )}

            {detailApproval.requestData && (
              <Box>
                <Label>Request Data</Label>
                {competitionRequestPreview ? (
                  <Box
                  data-lenis-prevent
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <PreviewItem
                      label="Action"
                      value={competitionRequestPreview.actionLabel}
                    />

                    {competitionRequestPreview.proposed && (
                      <>
                        <Label>Proposed Competition Overview</Label>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
                          }}
                        >
                          {COMPETITION_OVERVIEW_FIELDS.map((fieldKey) => (
                            <PreviewItem
                              key={fieldKey}
                              label={
                                COMPETITION_FIELD_LABELS[fieldKey] || fieldKey
                              }
                              value={formatCompetitionFieldValue(
                                fieldKey,
                                competitionRequestPreview.proposed?.[fieldKey],
                              )}
                            />
                          ))}
                        </Box>
                      </>
                    )}

                    {(competitionRequestMedia.posterPath ||
                      competitionRequestMedia.bannerPath) && (
                        <>
                          <Label>Media Preview</Label>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                              gap: 1.5,
                            }}
                          >
                            <RequestMediaPreview
                              label="Poster"
                              path={competitionRequestMedia.posterPath}
                            />
                            <RequestMediaPreview
                              label="Banner"
                              path={competitionRequestMedia.bannerPath}
                            />
                          </Box>
                        </>
                      )}

                    {changedCompetitionRows.length > 0 && (
                      <>
                        <Label>Changed Fields</Label>
                        <Box
                        data-lenis-prevent
                          sx={{
                            maxHeight: 220,
                            overflow: "auto",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                          }}
                        >
                          {changedCompetitionRows.map((row, index) => (
                            <Box key={row.key}>
                              <Box sx={{ p: 1.25 }}>
                                <Typography
                                  sx={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.8)",
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 600,
                                    mb: 0.75,
                                  }}
                                >
                                  {row.label}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 1,
                                  }}
                                >
                                  <Box>
                                    <Label>Before</Label>
                                    <Typography
                                      sx={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.45)",
                                        fontFamily: "'DM Mono', monospace",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {row.before}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Label>Proposed</Label>
                                    <Typography
                                      sx={{
                                        fontSize: 11,
                                        color: "#c084fc",
                                        fontFamily: "'DM Mono', monospace",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {row.proposed}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                              {index < changedCompetitionRows.length - 1 && (
                                <RowDivider />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>
                ) : formRequestPreview ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <PreviewItem
                      label="Action"
                      value={formRequestPreview.actionLabel}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                      }}
                    >
                      <PreviewItem
                        label="Competition ID"
                        value={formRequestPreview.competitionId || "—"}
                      />
                      <PreviewItem
                        label="Form ID"
                        value={formRequestPreview.formId || "—"}
                      />
                    </Box>

                    {formRequestPreview.proposed ? (
                      <>
                        <Label>Proposed Form Overview</Label>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 1.5,
                          }}
                        >
                          <PreviewItem
                            label="Status"
                            value={formatCompetitionFieldValue(
                              "status",
                              formRequestPreview.proposed?.status,
                            )}
                          />
                          <PreviewItem
                            label="Opens At"
                            value={formatCompetitionFieldValue(
                              "startTime",
                              formRequestPreview.proposed?.opensAt,
                            )}
                          />
                          <PreviewItem
                            label="Closes At"
                            value={formatCompetitionFieldValue(
                              "endTime",
                              formRequestPreview.proposed?.closesAt,
                            )}
                          />
                        </Box>

                        <Label>
                          Form Fields (
                          {formRequestPreview.proposed?.fields?.length || 0})
                        </Label>
                        {Array.isArray(formRequestPreview.proposed?.fields) &&
                          formRequestPreview.proposed.fields.length > 0 ? (
                          <Box
                          data-lenis-prevent
                            sx={{
                              maxHeight: 240,
                              overflow: "auto",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "8px",
                            }}
                          >
                            {formRequestPreview.proposed.fields.map(
                              (field:any, index:any) => (
                                <Box
                                  key={`${field?.label || "field"}-${index}`}
                                >
                                  <Box sx={{ p: 1.25 }}>
                                    <Typography
                                      sx={{
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.85)",
                                        fontFamily: "'Syne', sans-serif",
                                        fontWeight: 600,
                                        mb: 0.75,
                                      }}
                                    >
                                      {field?.label || `Field ${index + 1}`}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr 1fr",
                                        gap: 1,
                                      }}
                                    >
                                      <PreviewItem
                                        label="Type"
                                        value={field?.fieldType || "—"}
                                      />
                                      <PreviewItem
                                        label="Scope"
                                        value={field?.scope || "—"}
                                      />
                                      <PreviewItem
                                        label="Required"
                                        value={field?.isRequired ? "Yes" : "No"}
                                      />
                                    </Box>
                                  </Box>
                                  {index <
                                    formRequestPreview.proposed.fields.length -
                                    1 && <RowDivider />}
                                </Box>
                              ),
                            )}
                          </Box>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.45)",
                              fontFamily: "'DM Mono', monospace",
                            }}
                          >
                            No form field changes in this request.
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.45)",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        No proposed form payload attached to this request.
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box
                  data-lenis-prevent
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
                )}
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
            <BtnRow>
              <GhostBtn onClick={() => setDetailDialogOpen(false)}>
                Close
              </GhostBtn>
              {detailApproval.status === "PENDING" &&
                !handledApprovalIds.has(detailApproval.id) && (
                  <>
                    <DangerBtn
                      onClick={() => openReject(detailApproval)}
                      disabled={processingApprovalId === detailApproval.id}
                    >
                      Reject
                    </DangerBtn>
                    <GreenBtn
                      onClick={() => handleApprove(detailApproval)}
                      loading={
                        processingApprovalId === detailApproval.id &&
                        approveMutation.isPending
                      }
                      disabled={processingApprovalId === detailApproval.id}
                    >
                      <CheckCheck size={12} />
                      Approve
                    </GreenBtn>
                  </>
                )}
            </BtnRow>
          </Box>
        )}
      </DarkDialog>

      {/* Score lock review */}
      <DarkDialog
        open={lockDialogOpen}
        onClose={() => setLockDialogOpen(false)}
        title="Review Score Lock"
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedLock
            ? `${selectedLock.competition?.title || "Competition"} · ${selectedLock.round?.name || "Round"}`
            : ""}
        </Typography>
        <DarkTextarea
          rows={3}
          value={lockNotes}
          onChange={(e: any) => setLockNotes(e.target.value)}
          placeholder="Optional review notes…"
        />
        <BtnRow>
          <GhostBtn onClick={() => setLockDialogOpen(false)}>Cancel</GhostBtn>
          <DangerBtn
            onClick={() => handleLockReview("REJECTED")}
            loading={reviewLockMutation.isPending}
          >
            {reviewLockMutation.isPending ? "Submitting…" : "Reject"}
          </DangerBtn>
          <GreenBtn
            onClick={() => handleLockReview("APPROVED")}
            loading={reviewLockMutation.isPending}
          >
            <CheckCheck size={12} />
            {reviewLockMutation.isPending ? "Submitting…" : "Approve"}
          </GreenBtn>
        </BtnRow>
      </DarkDialog>
    </Box>
  );
}

/* ── Primitives ── */

function Label({ children }: any) {
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

function PreviewItem({ label, value }: any) {
  return (
    <Box>
      <Label>{label}</Label>
      <Typography
        sx={{
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1.5,
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

function DarkDialog({ open, onClose, title, children }: any) {
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

function NativeSelect({ value, onChange, children }: any) {
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

function DarkTextarea({ rows = 3, value, onChange, placeholder }: any) {
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

function DangerNote({ children }: any) {
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

function BtnRow({ children }: any) {
  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 3 }}>
      {children}
    </Box>
  );
}

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

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "7px 14px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 5,
};

function GhostBtn({ onClick, children, loading, disabled, style }: any) {
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
        ...style,
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

function PrimaryBtn({ onClick, children, loading, disabled }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.75)",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.11)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      }}
    >
      {loading && <BtnSpinner />}
      {children}
    </button>
  );
}

function GreenBtn({ onClick, children, loading, disabled }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(74,222,128,0.08)",
        border: "1px solid rgba(74,222,128,0.2)",
        color: "#4ade80",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(74,222,128,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(74,222,128,0.08)";
      }}
    >
      {loading && <BtnSpinner color="#4ade80" />}
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children, loading, disabled }: any) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.18)",
        color: "#f87171",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(239,68,68,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.08)";
      }}
    >
      {loading && <BtnSpinner color="#f87171" />}
      {children}
    </button>
  );
}
