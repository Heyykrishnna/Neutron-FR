"use client";

import { useState, useMemo, useEffect } from "react";
import { Box, Typography, Dialog, Button } from "@mui/material";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useMyApprovalRequests } from "@/src/hooks/api/useApprovals";
import { LoadingState } from "@/src/components/LoadingState";

/* ── Local types ── */

interface ApprovalRequest {
  id: string;
  title?: string;
  description?: string;
  status: string;
  type: string;
  createdAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  requestData?: Record<string, any>;
}

/* ── Constants ── */

const TYPE_LABELS = {
  SCORE_LOCK: "Score Lock",
  EVENT_UPDATE: "Event Update",
  COMPETITION_EDIT: "Competition Update",
  PROMO_CODE_ADD: "Promo Code",
  FORM_EDIT: "Form Update",
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
  FORM_EDIT: {
    bg: "rgba(99,102,241,0.1)",
    text: "#a5b4fc",
    border: "rgba(99,102,241,0.2)",
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

const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const fmtDateTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const toAbsoluteUrl = (base: string, path: string) => {
  if (!base || !path) return null;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const buildImageCandidates = (mediaPath: string | null | undefined) => {
  if (!mediaPath || typeof mediaPath !== "string") return [];

  const candidates: string[] = [];
  const add = (value: string | null | undefined) => {
    if (!value) return;
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  };

  const normalizedPath = mediaPath.startsWith("/")
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

const extractMediaPath = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    if (typeof (value as Record<string, unknown>).path === "string") return (value as Record<string, unknown>).path as string;
    if (typeof (value as Record<string, unknown>).url === "string") return (value as Record<string, unknown>).url as string;
  }
  return null;
};

/* ── Sub-components ── */

function Pill({ bg, text, border, children }: { bg: string; text: string; border: string; children: React.ReactNode }) {
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

function TypePill({ type }: { type: string }) {
  const c = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  };
  return <Pill {...c}>{TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type}</Pill>;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.PENDING;
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

function EmptyRow({ message }: { message: string }) {
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

function RequestMediaPreview({ label, path }: { label: string; path: string | null | undefined }) {
  const candidates = useMemo(() => buildImageCandidates(path), [path]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [path]);

  const src = candidates[candidateIndex] || null;
  if (!src) return null;

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'Syne', sans-serif",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
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

export default function MyRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<ApprovalRequest | null>(null);

  const filters: { status?: string; type?: string } = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (typeFilter !== "all") filters.type = typeFilter;

  const { data: requestsRaw, isLoading } = useMyApprovalRequests(filters);
  const { enqueueSnackbar } = useSnackbar();

  const allRequests = useMemo(
    () => (requestsRaw as ApprovalRequest[] | undefined) ?? [],
    [requestsRaw],
  );

  const filteredRequests = useMemo(() => {
    if (!search) return allRequests;
    const q = search.toLowerCase();
    return allRequests.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q),
    );
  }, [allRequests, search]);

  const stats = useMemo(
    () => ({
      pending: allRequests.filter((a) => a.status === "PENDING").length,
      approved: allRequests.filter((a) => a.status === "APPROVED").length,
      rejected: allRequests.filter((a) => a.status === "REJECTED").length,
    }),
    [allRequests],
  );

  const openDetail = (request: ApprovalRequest) => {
    setDetailRequest(request);
    setDetailDialogOpen(true);
  };

  const detailMedia = useMemo(() => {
    const requestData = detailRequest?.requestData || {};
    const proposed = requestData?.proposed || {};
    const before = requestData?.before || {};

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
  }, [detailRequest]);

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
            My Requests
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
          Track your submitted requests and approval status
        </Typography>
      </Box>

      {isLoading ? (
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
                value: stats.pending,
                color: "#fbbf24",
                id: "PENDING",
              },
              {
                label: "Approved",
                value: stats.approved,
                color: "#4ade80",
                id: "APPROVED",
              },
              {
                label: "Rejected",
                value: stats.rejected,
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, description…"
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.75)",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Types</option>
              <option value="SCORE_LOCK">Score Lock</option>
              <option value="EVENT_UPDATE">Event Update</option>
              <option value="COMPETITION_EDIT">Competition Update</option>
              <option value="PROMO_CODE_ADD">Promo Code</option>
              <option value="FORM_EDIT">Form Update</option>
            </select>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.18)",
                fontFamily: "'DM Mono', monospace",
                ml: "auto",
              }}
            >
              {filteredRequests.length} result
              {filteredRequests.length !== 1 ? "s" : ""}
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
                gridTemplateColumns: "minmax(220px,1fr) 140px 110px 110px",
                px: 3,
                py: 1.5,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {["Request", "Type", "Status", ""].map((h, i) => (
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
              {filteredRequests.length === 0 ? (
                <EmptyRow message="No requests found" />
              ) : (
                filteredRequests.map((req) => (
                  <Box key={req.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(220px,1fr) 140px 110px 110px",
                        alignItems: "center",
                        px: 3,
                        py: 2,
                        transition: "background 0.12s",
                        "&:hover": {
                          background: "rgba(255,255,255,0.02)",
                        },
                      }}
                    >
                      <Box sx={{ cursor: "pointer", minWidth: 0, pr: 1 }}>
                        <Typography
                          onClick={() => openDetail(req)}
                          sx={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.85)",
                            fontFamily: "'Syne', sans-serif",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            "&:hover": { color: "#f4f4f5" },
                          }}
                        >
                          {req.title || "Untitled"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "'Syne', sans-serif",
                            mt: 0.25,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fmtDate(req.createdAt)}
                        </Typography>
                      </Box>
                      <TypePill type={req.type} />
                      <StatusBadge status={req.status} />
                      <Box sx={{ textAlign: "right" }}>
                        <Button
                          onClick={() => openDetail(req)}
                          sx={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            fontFamily: "'Syne', sans-serif",
                            letterSpacing: "0.05em",
                            color: "rgba(255,255,255,0.4)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "6px",
                            "&:hover": {
                              color: "#f4f4f5",
                              borderColor: "rgba(255,255,255,0.2)",
                              background: "rgba(255,255,255,0.03)",
                            },
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                    <RowDivider />
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "#111",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        {detailRequest && (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#f4f4f5",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {detailRequest.title || "Untitled"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <TypePill type={detailRequest.type} />
                  <StatusBadge status={detailRequest.status} />
                </Box>
              </Box>
              <X
                size={18}
                color="rgba(255,255,255,0.3)"
                onClick={() => setDetailDialogOpen(false)}
                style={{ cursor: "pointer" }}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                pt: 2,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Syne', sans-serif",
                  mb: 0.5,
                }}
              >
                Description
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "'Syne', sans-serif",
                  lineHeight: 1.6,
                }}
              >
                {detailRequest.description || "—"}
              </Typography>
            </Box>

            {(detailMedia.posterPath || detailMedia.bannerPath) && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <RequestMediaPreview
                  label="Poster"
                  path={detailMedia.posterPath}
                />
                <RequestMediaPreview
                  label="Banner"
                  path={detailMedia.bannerPath}
                />
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Syne', sans-serif",
                    mb: 0.5,
                  }}
                >
                  Submitted
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {fmtDateTime(detailRequest.createdAt)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Syne', sans-serif",
                    mb: 0.5,
                  }}
                >
                  Decision
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {detailRequest.reviewedAt
                    ? fmtDateTime(detailRequest.reviewedAt)
                    : "Pending"}
                </Typography>
              </Box>
            </Box>

            {detailRequest.status === "REJECTED" &&
              detailRequest.rejectionReason && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#f87171",
                      fontFamily: "'Syne', sans-serif",
                      mb: 0.75,
                    }}
                  >
                    Rejection Reason
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "#f87171",
                      fontFamily: "'Syne', sans-serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {detailRequest.rejectionReason}
                  </Typography>
                </Box>
              )}

            <Button
              onClick={() => setDetailDialogOpen(false)}
              fullWidth
              sx={{
                mt: 3,
                py: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 500,
                borderRadius: "8px",
                "&:hover": {
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              Close
            </Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
