"use client";

import { useState, useMemo } from "react";
import {
  useAuditLogs,
  useAnomalies,
  useAuditStats,
  useResolveAnomaly,
  exportAuditLogsCsv,
} from "@/src/hooks/api/useAudit";
import { Box, Dialog, Typography } from "@mui/material";
import {
  ClipboardList,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Clock,
  Filter,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { LoadingState } from "@/src/components/LoadingState";

/* ── Action enum ── */
const ACTION_OPTIONS = [
  "USER_LOGIN",
  "USER_LOGOUT",
  "USER_REGISTER",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET",
  "SESSION_REVOKED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_SUSPENDED",
  "USER_UNSUSPENDED",
  "USER_REVOKED",
  "USER_ROLE_CHANGED",
  "USER_INVITED",
  "COMPETITION_CREATED",
  "COMPETITION_UPDATED",
  "COMPETITION_DELETED",
  "COMPETITION_PUBLISHED",
  "COMPETITION_STATUS_CHANGED",
  "TEAM_CREATED",
  "TEAM_UPDATED",
  "TEAM_DELETED",
  "TEAM_MEMBER_ADDED",
  "TEAM_MEMBER_REMOVED",
  "TEAM_APPROVED",
  "TEAM_REJECTED",
  "REGISTRATION_CREATED",
  "REGISTRATION_APPROVED",
  "REGISTRATION_REJECTED",
  "REGISTRATION_CANCELLED",
  "SCORE_CREATED",
  "SCORE_UPDATED",
  "SCORE_DELETED",
  "ROUND_LOCKED",
  "ROUND_UNLOCKED",
  "DEPARTMENT_CREATED",
  "DEPARTMENT_UPDATED",
  "DEPARTMENT_DELETED",
  "DEPARTMENT_MEMBER_ADDED",
  "DEPARTMENT_MEMBER_REMOVED",
  "SYSTEM_CONFIG_CHANGED",
  "BULK_OPERATION",
  "DATA_EXPORT",
  "DATA_IMPORT",
];

const ENTITY_OPTIONS = [
  "user",
  "competition",
  "team",
  "registration",
  "score",
  "department",
  "system",
];

/* ── Action colours ── */
const ACTION_COLOR = (action: any) => {
  if (!action) return "rgba(255,255,255,0.35)";
  if (
    action.startsWith("USER_LOGIN") ||
    action.startsWith("USER_LOGOUT") ||
    action.startsWith("SESSION")
  )
    return "#60a5fa";
  if (
    action.includes("DELETE") ||
    action.includes("REVOKED") ||
    action.includes("REJECTED") ||
    action.includes("CANCELLED")
  )
    return "#f87171";
  if (
    action.includes("CREAT") ||
    action.includes("INVITED") ||
    action.includes("APPROVED") ||
    action.includes("ADDED")
  )
    return "#4ade80";
  if (
    action.includes("UPDATE") ||
    action.includes("CHANGED") ||
    action.includes("LOCKED") ||
    action.includes("UNLOCKED")
  )
    return "#fbbf24";
  if (
    action.startsWith("BULK") ||
    action.startsWith("DATA") ||
    action.startsWith("SYSTEM")
  )
    return "#c084fc";
  return "rgba(255,255,255,0.5)";
};

const SEVERITY_COLORS: any = {
  LOW: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  MEDIUM: {
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  HIGH: {
    bg: "rgba(249,115,22,0.1)",
    text: "#fb923c",
    border: "rgba(249,115,22,0.2)",
  },
  CRITICAL: {
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
};

const ROLE_COLORS: any = {
  SA: {
    bg: "rgba(239,68,68,0.1)",
    text: "#f87171",
    border: "rgba(239,68,68,0.2)",
  },
  DH: {
    bg: "rgba(168,85,247,0.1)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.2)",
  },
  VH: {
    bg: "rgba(59,130,246,0.1)",
    text: "#60a5fa",
    border: "rgba(59,130,246,0.2)",
  },
  VOL: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
};

function ActionPill({ action }: any) {
  const color = ACTION_COLOR(action);
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
        letterSpacing: "0.03em",
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "inline-block",
        lineHeight: 1.6,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {(action || "—").replace(/_/g, " ")}
    </Box>
  );
}

function RolePill({ role }: { role: string }) {
  const c = ROLE_COLORS[role] || {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  };
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
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        display: "inline-block",
        lineHeight: 1.6,
      }}
    >
      {role || "—"}
    </Box>
  );
}

function SeverityPill({ severity }: any) {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.LOW;
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
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        display: "inline-block",
        lineHeight: 1.6,
      }}
    >
      {severity}
    </Box>
  );
}

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
);

/* ══════════════════════════════════════════ */
/*  Page                                      */
/* ══════════════════════════════════════════ */
export default function AuditPage() {
  const [tab, setTab] = useState("logs"); // "logs" | "anomalies"

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400 }}>
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
              letterSpacing: "0.01em",
            }}
          >
            Audit Logs
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
          Full activity trail and anomaly detection for all system operations
        </Typography>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          mb: 3,
          p: 0.5,
          background: "#0c0c0c",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px",
          width: "fit-content",
        }}
      >
        {[
          {
            key: "logs",
            label: "Activity Logs",
            icon: <ClipboardList size={13} />,
          },
          {
            key: "anomalies",
            label: "Anomalies",
            icon: <AlertTriangle size={13} />,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              background:
                tab === t.key ? "rgba(255,255,255,0.08)" : "transparent",
              border:
                tab === t.key
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "1px solid transparent",
              borderRadius: "8px",
              color:
                tab === t.key
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.3)",
              fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </Box>

      {tab === "logs" && <LogsTab />}
      {tab === "anomalies" && <AnomaliesTab />}
    </Box>
  );
}

/* ══════════════════════════════════════════ */
/*  Logs Tab                                  */
/* ══════════════════════════════════════════ */
function LogsTab() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [detailLog, setDetailLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const filters = useMemo(() => {
    const f: any = { page, limit: 50 };
    if (search) f.search = search;
    if (action) f.action = action;
    if (entityType) f.entityType = entityType;
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    return f;
  }, [search, action, entityType, startDate, endDate, page]);

  const { data, isLoading } = useAuditLogs(filters);
  const { data: stats } = useAuditStats({});

  const logs = data?.logs || [];
  const pagination: any = data?.pagination || null;

  const resetPage = () => setPage(1);

  const fmtTs = (d: any) =>
    new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openDetail = (log: any) => {
    setDetailLog(log);
    setDetailDialogOpen(true);
  };

  const handleExport = () => {
    const f: any = {};
    if (search) f.search = search;
    if (action) f.action = action;
    if (entityType) f.entityType = entityType;
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    exportAuditLogsCsv(f);
  };

  return (
    <Box>
      {/* Stats strip */}
      {stats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            label="Total Logs"
            value={stats.totalLogs}
            color="rgba(255,255,255,0.7)"
          />
          <StatCard
            label="Top Action"
            value={(stats.actionBreakdown?.[0]?.action || "—").replace(
              /_/g,
              " ",
            )}
            color="#60a5fa"
            small
          />
          <StatCard
            label="Entity Types"
            value={stats.entityBreakdown?.length ?? 0}
            color="#c084fc"
          />
          <StatCard
            label="Anomalies"
            value={(stats.anomalyStats || []).reduce(
              ( s:any, a : any) => s + Number(a.count),
              0,
            )}
            color="#fbbf24"
          />
        </Box>
      )}

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
          flexWrap: "wrap",
          alignItems: "center",
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Search user, email, description…"
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
        <NativeSelect
          value={action}
          onChange={(v: any) => {
            setAction(v);
            resetPage();
          }}
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={entityType}
          onChange={(v: any) => {
            setEntityType(v);
            resetPage();
          }}
        >
          <option value="">All Entities</option>
          {ENTITY_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </NativeSelect>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            resetPage();
          }}
          style={{
            padding: "8px 10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            colorScheme: "dark",
          }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            resetPage();
          }}
          style={{
            padding: "8px 10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            outline: "none",
            colorScheme: "dark",
          }}
        />
        <button
          onClick={handleExport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
          }}
        >
          <Download size={13} /> Export CSV
        </button>
        {pagination && (
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.18)",
              fontFamily: "'DM Mono', monospace",
              ml: "auto",
            }}
          >
            {pagination.total.toLocaleString()} total
          </Typography>
        )}
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
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
                  "155px minmax(140px,1fr) 60px minmax(140px,1.2fr) 110px 100px",
                px: 3,
                py: 1.5,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {["Timestamp", "User", "Role", "Action", "Entity", "IP"].map(
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
              sx={{
                maxHeight: "min(62vh, 620px)",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <RowDivider />

              {logs.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 13,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    No logs found
                  </Typography>
                </Box>
              ) : (
                logs.map((log, idx) => (
                  <Box key={log.id}>
                    <Box
                      onClick={() => openDetail(log)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "155px minmax(140px,1fr) 60px minmax(140px,1.2fr) 110px 100px",
                        alignItems: "center",
                        px: 3,
                        py: 1.75,
                        cursor: "pointer",
                        transition: "background 0.1s",
                        "&:hover": { background: "rgba(255,255,255,0.02)" },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtTs(log.createdAt)}
                      </Typography>

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
                          {log.userName || "System"}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.2)",
                            fontFamily: "'DM Mono', monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.userEmail || "—"}
                        </Typography>
                      </Box>

                      <Box>
                        <RolePill role={log.userRole} />
                      </Box>

                      <Box sx={{ pr: 1 }}>
                        <ActionPill action={log.action} />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.3)",
                          fontFamily: "'DM Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.entityType || "—"}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.2)",
                          fontFamily: "'DM Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.ipAddress || "—"}
                      </Typography>
                    </Box>
                    {idx < logs.length - 1 && <RowDivider />}
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 2,
                px: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Page {pagination.page} of {pagination.totalPages}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <PageBtn
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </PageBtn>
                <PageBtn
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </PageBtn>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Detail dialog */}
      <DarkDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title="Log Entry"
        wide
      >
        {detailLog && <LogDetail log={detailLog} fmtTs={fmtTs} />}
      </DarkDialog>
    </Box>
  );
}

function LogDetail({ log, fmtTs }: any) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Top row */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <ActionPill action={log.action} />
        <RolePill role={log.userRole} />
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'DM Mono', monospace",
            ml: "auto",
          }}
        >
          {fmtTs(log.createdAt)}
        </Typography>
      </Box>

      {/* User / entity grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Label>Actor</Label>
          <Typography
            sx={{
              fontSize: 13,
              color: "#e4e4e7",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {log.userName || "System"}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {log.userEmail || "—"}
          </Typography>
        </Box>
        <Box>
          <Label>Entity</Label>
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {log.entityType || "—"}
          </Typography>
          {log.entityId && (
            <Typography
              sx={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
                wordBreak: "break-all",
              }}
            >
              {log.entityId}
            </Typography>
          )}
        </Box>
        {log.ipAddress && (
          <Box>
            <Label>IP Address</Label>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {log.ipAddress}
            </Typography>
          </Box>
        )}
        {log.department && (
          <Box>
            <Label>Department</Label>
            <Typography
              sx={{
                fontSize: 12,
                color: "#c084fc",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {log.department}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Description */}
      {log.description && (
        <Box>
          <Label>Description</Label>
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.6,
            }}
          >
            {log.description}
          </Typography>
        </Box>
      )}

      {/* Before / After */}
      {(log.before || log.after) && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {[
            ["Before", log.before],
            ["After", log.after],
          ].map(([label, data]) =>
            data ? (
              <Box key={label}>
                <Label>{label}</Label>
                <JsonBlock data={data} />
              </Box>
            ) : null,
          )}
        </Box>
      )}

      {/* Changes */}
      {log.changes && (
        <Box>
          <Label>Changes</Label>
          <JsonBlock data={log.changes} />
        </Box>
      )}

      {/* Metadata */}
      {log.metadata && (
        <Box>
          <Label>Metadata</Label>
          <JsonBlock data={log.metadata} />
        </Box>
      )}
    </Box>
  );
}

/* ══════════════════════════════════════════ */
/*  Anomalies Tab                             */
/* ══════════════════════════════════════════ */
function AnomaliesTab() {
  const [severity, setSeverity] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState(""); // "" | "true" | "false"
  const [page, setPage] = useState(1);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailAnomaly, setDetailAnomaly] = useState<any>(null);

  const filters = useMemo(() => {
    const f: any = { page, limit: 50 };
    if (severity) f.severity = severity;
    if (resolvedFilter) f.resolved = resolvedFilter;
    return f;
  }, [severity, resolvedFilter, page]);

  const { data, isLoading } = useAnomalies(filters);
  const resolveMutation = useResolveAnomaly();
  const { enqueueSnackbar } = useSnackbar();

  const anomalies = data?.anomalies || [];
  const pagination: any = data?.pagination || null;

  const openResolve = (a: any) => {
    setSelectedAnomaly(a);
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    try {
      await resolveMutation.mutateAsync({
        id: selectedAnomaly.anomaly.id,
        resolutionNotes,
      });
      enqueueSnackbar("Anomaly resolved", { variant: "success" });
      setResolveDialogOpen(false);
      setSelectedAnomaly(null);
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || "Failed to resolve", {
        variant: "error",
      });
    }
  };

  const fmtDate = (d: any) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const openDetail = (a: any) => {
    setDetailAnomaly(a);
    setDetailDialogOpen(true);
  };

  const unresolvedCount = anomalies.filter((a) => !a.anomaly?.resolved).length;

  return (
    <Box>
      {/* Quick stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4,1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: "Unresolved", value: unresolvedCount, color: "#f87171" },
          ...[
            ["LOW", "#4ade80"],
            ["MEDIUM", "#fbbf24"],
            ["HIGH", "#fb923c"],
            ["CRITICAL", "#f87171"],
          ].map(([s, c]) => ({
            label: s,
            value: anomalies.filter((a) => a.anomaly?.severity === s).length,
            color: c,
          })),
        ]
          .slice(0, 4)
          .map((s) => (
            <Box
              key={s.label}
              onClick={() =>
                s.label !== "Unresolved" &&
                setSeverity(severity === s.label ? "" : s.label)
              }
              sx={{
                p: 2.5,
                borderRadius: "12px",
                background: "#0c0c0c",
                border:
                  severity === s.label
                    ? `1px solid ${s.color}40`
                    : "1px solid rgba(255,255,255,0.06)",
                cursor: s.label !== "Unresolved" ? "pointer" : "default",
                transition: "border-color 0.15s",
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
        <NativeSelect
          value={severity}
          onChange={(v: any) => {
            setSeverity(v);
            setPage(1);
          }}
        >
          <option value="">All Severities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </NativeSelect>
        <NativeSelect
          value={resolvedFilter}
          onChange={(v: any) => {
            setResolvedFilter(v);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </NativeSelect>
        {pagination && (
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.18)",
              fontFamily: "'DM Mono', monospace",
              ml: "auto",
            }}
          >
            {pagination.total.toLocaleString()} total
          </Typography>
        )}
      </Box>

      {/* Table */}
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
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
                  "90px 180px minmax(200px,1fr) 110px 110px 120px",
                px: 3,
                py: 1.5,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {[
                "Severity",
                "Type",
                "Description",
                "Detected",
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
              sx={{
                maxHeight: "min(62vh, 620px)",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <RowDivider />

              {anomalies.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 13,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    No anomalies found
                  </Typography>
                </Box>
              ) : (
                anomalies.map(({ anomaly, auditLog }, idx) => (
                  <Box key={anomaly.id}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "90px 180px minmax(200px,1fr) 110px 110px 120px",
                        alignItems: "center",
                        px: 3,
                        py: 2,
                        transition: "background 0.1s",
                        "&:hover": { background: "rgba(255,255,255,0.02)" },
                      }}
                    >
                      <Box>
                        <SeverityPill severity={anomaly.severity} />
                      </Box>

                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          fontFamily: "'DM Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          pr: 1,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {(anomaly.anomalyType || "—").replace(/_/g, " ")}
                      </Typography>

                      <Typography
                        onClick={() => openDetail({ anomaly, auditLog })}
                        sx={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.55)",
                          fontFamily: "'Syne', sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          pr: 2,
                          cursor: "pointer",
                          "&:hover": { color: "#e4e4e7" },
                        }}
                      >
                        {anomaly.description}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.25)",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {fmtDate(anomaly.createdAt)}
                      </Typography>

                      {/* Status */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        {anomaly.resolved ? (
                          <>
                            <CheckCircle2 size={12} color="#4ade80" />
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#4ade80",
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              Resolved
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Clock size={12} color="#fbbf24" />
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#fbbf24",
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              Open
                            </Typography>
                          </>
                        )}
                      </Box>

                      {/* Action */}
                      {!anomaly.resolved && (
                        <ResolveBtn
                          onClick={() => openResolve({ anomaly, auditLog })}
                        >
                          Resolve
                        </ResolveBtn>
                      )}
                    </Box>
                    {idx < anomalies.length - 1 && <RowDivider />}
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {pagination && pagination.totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mt: 2,
                px: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Page {pagination.page} of {pagination.totalPages}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <PageBtn
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </PageBtn>
                <PageBtn
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </PageBtn>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Resolve dialog */}
      <DarkDialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        title="Resolve Anomaly"
      >
        {selectedAnomaly && (
          <>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
              <SeverityPill severity={selectedAnomaly.anomaly.severity} />
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {(selectedAnomaly.anomaly.anomalyType || "").replace(/_/g, " ")}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'Syne', sans-serif",
                mb: 2,
                lineHeight: 1.6,
              }}
            >
              {selectedAnomaly.anomaly.description}
            </Typography>
            <DarkTextarea
              rows={3}
              value={resolutionNotes}
              onChange={(e: any) => setResolutionNotes(e.target.value)}
              placeholder="Resolution notes (optional)…"
            />
            <BtnRow>
              <GhostBtn onClick={() => setResolveDialogOpen(false)}>
                Cancel
              </GhostBtn>
              <GreenBtn
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? "Resolving…" : "Mark Resolved"}
              </GreenBtn>
            </BtnRow>
          </>
        )}
      </DarkDialog>

      {/* Detail dialog */}
      <DarkDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        title="Anomaly Details"
      >
        {detailAnomaly && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <SeverityPill severity={detailAnomaly.anomaly.severity} />
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {(detailAnomaly.anomaly.anomalyType || "").replace(/_/g, " ")}
              </Typography>
            </Box>
            <Box>
              <Label>Description</Label>
              <Typography
                sx={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "'Syne', sans-serif",
                  lineHeight: 1.6,
                }}
              >
                {detailAnomaly.anomaly.description}
              </Typography>
            </Box>
            {detailAnomaly.auditLog && (
              <Box>
                <Label>Related Log Entry</Label>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <ActionPill action={detailAnomaly.auditLog.action} />
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: "'DM Mono', monospace",
                      mt: 0.75,
                    }}
                  >
                    {detailAnomaly.auditLog.userName || "System"} ·{" "}
                    {detailAnomaly.auditLog.userEmail || ""}
                  </Typography>
                </Box>
              </Box>
            )}
            {detailAnomaly.anomaly.resolved && (
              <Box>
                <Label>Resolution Notes</Label>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#4ade80",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {detailAnomaly.anomaly.resolutionNotes || "—"}
                </Typography>
              </Box>
            )}
            <BtnRow>
              <GhostBtn onClick={() => setDetailDialogOpen(false)}>
                Close
              </GhostBtn>
              {!detailAnomaly.anomaly.resolved && (
                <GreenBtn
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openResolve(detailAnomaly);
                  }}
                >
                  Resolve
                </GreenBtn>
              )}
            </BtnRow>
          </Box>
        )}
      </DarkDialog>
    </Box>
  );
}

/* ══════════════════════════════════════════ */
/*  Shared primitives                         */
/* ══════════════════════════════════════════ */

function StatCard({ label, value, color, small }: any) {
  return (
    <Box
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
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: small ? 14 : 28,
          fontWeight: 700,
          color,
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function JsonBlock({ data }: any) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "8px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: "rgba(255,255,255,0.45)",
        overflow: "auto",
        maxHeight: 160,
      }}
    >
      <pre
        style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </Box>
  );
}

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

function DarkDialog({ open, onClose, title, children, wide }: any) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={wide ? "md" : "sm"}
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

function BtnRow({ children }: any) {
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

function GhostBtn({ onClick, children }: any) {
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

function GreenBtn({ onClick, children, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(74,222,128,0.1)",
        border: "1px solid rgba(74,222,128,0.2)",
        color: "#4ade80",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(74,222,128,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(74,222,128,0.1)";
      }}
    >
      {children}
    </button>
  );
}

function PageBtn({ onClick, disabled, children }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.8)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.color = disabled
          ? "rgba(255,255,255,0.15)"
          : "rgba(255,255,255,0.5)";
      }}
    >
      {children}
    </button>
  );
}

function ResolveBtn({ onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        background: "rgba(74,222,128,0.06)",
        border: "1px solid rgba(74,222,128,0.15)",
        borderRadius: 7,
        cursor: "pointer",
        color: "#4ade80",
        fontSize: 12,
        fontFamily: "'Syne', sans-serif",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(74,222,128,0.12)";
        e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(74,222,128,0.06)";
        e.currentTarget.style.borderColor = "rgba(74,222,128,0.15)";
      }}
    >
      {children}
    </button>
  );
}
