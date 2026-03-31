"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useDHDepartmentMembers } from "@/src/hooks/api/useUsers";
import { Box, Typography } from "@mui/material";
import {
  Users,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { LoadingState } from "@/src/components/LoadingState";

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
  VOLUNTEER: {
    bg: "rgba(34,197,94,0.1)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.2)",
  },
  JUDGE: {
    bg: "rgba(234,179,8,0.1)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.2)",
  },
  PART: {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.1)",
  },
  USER: {
    bg: "rgba(255,255,255,0.06)",
    text: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.1)",
  },
  BOARD: {
    bg: "rgba(251,146,60,0.1)",
    text: "#fb923c",
    border: "rgba(251,146,60,0.2)",
  },
};

const ROLE_LABELS: any = {
  SA: "Super Admin",
  DH: "Dept Head",
  VH: "Vol Head",
  VOL: "Volunteer",
  VOLUNTEER: "Volunteer",
  JUDGE: "Judge",
  PART: "Participant",
  USER: "User",
  BOARD: "Board",
};

function RolePill({ role }: any) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.USER;
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
      {ROLE_LABELS[role] || role}
    </Box>
  );
}

function StatusDot({ isSuspended, isRevoked }: any) {
  if (isRevoked)
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <XCircle size={13} color="#f87171" />
        <Typography
          sx={{
            fontSize: 12,
            color: "#f87171",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Revoked
        </Typography>
      </Box>
    );
  if (isSuspended)
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <AlertCircle size={13} color="#fbbf24" />
        <Typography
          sx={{
            fontSize: 12,
            color: "#fbbf24",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Suspended
        </Typography>
      </Box>
    );
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <CheckCircle2 size={13} color="#4ade80" />
      <Typography
        sx={{
          fontSize: 12,
          color: "#4ade80",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Active
      </Typography>
    </Box>
  );
}

function UserAvatar({ name }: any) {
  return (
    <Box sx={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
      <Image
        src="/images/bg.jpeg"
        alt={name || "User"}
        fill
        sizes="36px"
        style={{ borderRadius: "50%", objectFit: "cover" }}
      />
    </Box>
  );
}

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
);

export default function DHUsersPage() {
  /**
   * Security: The backend derives the department from the DH's own session.
   * No departmentId is passed from the client — a DH cannot request another
   * department's members by modifying the request.
   */
  const { data, isLoading, isError, error } = useDHDepartmentMembers() as any;

  const [searchQuery, setSearchQuery] = useState("");

  const members = useMemo(() => {
    if (!data?.members) return [];
    const list = data.members.map((m: any) => m.user).filter(Boolean);
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (u: any) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  const fmtDate = (d: any) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (isLoading) return <LoadingState />;

  if (isError) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load department";
    return (
      <Box sx={{ p: 4 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: "#f87171",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {msg}
          </Typography>
        </Box>
      </Box>
    );
  }

  const dept = data?.department;

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
            <Users size={15} color="rgba(255,255,255,0.7)" />
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
            My Department
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
          Members assigned to your department — read-only view
        </Typography>
      </Box>

      {/* Department info card */}
      {dept && (
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: "12px",
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={18} color="#c084fc" />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: "#e4e4e7",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {dept.name}
            </Typography>
            {dept.description && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Syne', sans-serif",
                  mt: 0.25,
                }}
              >
                {dept.description}
              </Typography>
            )}
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono', monospace",
                mt: 0.75,
              }}
            >
              {data.members.length} member{data.members.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Search bar */}
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
            placeholder="Search members by name or email…"
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
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontFamily: "'DM Mono', monospace",
            ml: "auto",
          }}
        >
          {members.length} result{members.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Members table */}
      <Box
        sx={{
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          background: "#0c0c0c",
        }}
      >
        {/* Table header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(200px,1fr) 130px 120px 110px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["Member", "Role", "Status", "Joined"].map((h, i) => (
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
          sx={{
            maxHeight: "min(62vh, 620px)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <RowDivider />

          {members.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No members found
              </Typography>
            </Box>
          ) : (
            members.map(({ user, idx }: any) => (
              <Box key={user.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(200px,1fr) 130px 120px 110px",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.02)" },
                  }}
                >
                  {/* Member info */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      minWidth: 0,
                    }}
                  >
                    <UserAvatar name={user.name} />
                    <Box sx={{ minWidth: 0 }}>
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
                        {user.name || "Unknown"}
                      </Typography>
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
                        {user.email || "—"}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <RolePill role={user.role} />
                  </Box>
                  <Box>
                    <StatusDot
                      isSuspended={user.isSuspended}
                      isRevoked={user.isRevoked}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.28)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {fmtDate(user.createdAt)}
                  </Typography>
                </Box>
                {idx < members.length - 1 && <RowDivider />}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}
