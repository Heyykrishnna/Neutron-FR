"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AlertCircle, CheckCircle2, Search, Wrench } from "lucide-react";
import { useSnackbar } from "notistack";
import { useIssues, useResolveIssue } from "@/src/hooks/api/useIssues";
import { LoadingState } from "@/src/components/LoadingState";

const STATUS_COLORS = {
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

export default function IssuesResolutionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const { data: issues = [], isLoading } = useIssues(
    showResolved ? {} : { resolved: false },
  );
  const resolveMutation = useResolveIssue();
  const { enqueueSnackbar } = useSnackbar();

  const filtered = useMemo(() => {
    if (!searchQuery) return issues;
    const q = searchQuery.toLowerCase();
    return issues.filter(
      (item) =>
        (item.message || "").toLowerCase().includes(q) ||
        (item.creator?.name || "").toLowerCase().includes(q) ||
        (item.creator?.email || "").toLowerCase().includes(q),
    );
  }, [issues, searchQuery]);

  const openCount = issues.filter((i) => !i.resolved).length;
  const resolvedCount = issues.filter((i) => i.resolved).length;

  const fmtDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleResolve = async (issueId) => {
    try {
      await resolveMutation.mutateAsync({ issueId });
      enqueueSnackbar("Issue marked as resolved", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to resolve issue",
        { variant: "error" },
      );
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
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
            <Wrench size={15} color="rgba(255,255,255,0.7)" />
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
            Issues
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
          DH / SA resolution queue for volunteer-reported issues
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: "Open", value: openCount, color: "#fbbf24" },
          { label: "Resolved", value: resolvedCount, color: "#4ade80" },
        ].map((item) => (
          <Box
            key={item.label}
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
              {item.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 28,
                fontWeight: 700,
                color: item.color,
                fontFamily: "'Syne', sans-serif",
                lineHeight: 1,
              }}
            >
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        <button
          type="button"
          onClick={() => setShowResolved((v) => !v)}
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: showResolved
              ? "rgba(168,85,247,0.14)"
              : "rgba(255,255,255,0.02)",
            color: showResolved ? "#c084fc" : "rgba(255,255,255,0.55)",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {showResolved ? "Hide Resolved" : "Show Resolved"}
        </button>
      </Box>

      <Box
        sx={{
          borderRadius: "12px",
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <Box sx={{ py: 7, textAlign: "center" }}>
            <AlertCircle size={18} color="rgba(255,255,255,0.25)" />
            <Typography
              sx={{
                mt: 1,
                fontSize: 12,
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              No issues found
            </Typography>
          </Box>
        ) : (
          filtered.map((issue, index) => {
            const status = issue.resolved ? "RESOLVED" : "OPEN";
            const c = STATUS_COLORS[status];

            return (
              <Box
                key={issue.id}
                sx={{
                  p: 2.25,
                  borderBottom:
                    index < filtered.length - 1
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
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.35,
                      borderRadius: "6px",
                      background: c.bg,
                      color: c.text,
                      border: `1px solid ${c.border}`,
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {status}
                  </Box>

                  {!issue.resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolve(issue.id)}
                      disabled={resolveMutation.isPending}
                      style={{
                        border: "1px solid rgba(34,197,94,0.35)",
                        background: "rgba(34,197,94,0.12)",
                        color: "#4ade80",
                        borderRadius: 8,
                        padding: "7px 11px",
                        cursor: resolveMutation.isPending
                          ? "not-allowed"
                          : "pointer",
                        fontSize: 12,
                        fontFamily: "'Syne', sans-serif",
                        opacity: resolveMutation.isPending ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={13} />
                      Resolve
                    </button>
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
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
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
                    Email: {issue.creator?.email || "-"}
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
    </Box>
  );
}
