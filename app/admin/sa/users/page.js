"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  useUsers,
  useUpdateUserRole,
  useSuspendUser,
  useUnsuspendUser,
  useRevokeUser,
  useInviteUser,
  useBulkInviteUsers,
  useDeleteUser,
} from "@/src/hooks/api/useUsers";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Typography,
} from "@mui/material";
import {
  Users,
  Search,
  MoreVertical,
  UserPlus,
  ShieldAlert,
  ShieldOff,
  ShieldCheck,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Upload,
  Loader2,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { LoadingState } from "@/src/components/LoadingState";
import { getSocket } from "@/lib/socket";

const ROLE_OPTIONS = [
  { value: "SA", label: "Super Admin" },
  { value: "BOARD", label: "Board" },
  { value: "DH", label: "Department Head" },
  { value: "CH", label: "Club Head" },
  { value: "JUDGE", label: "Judge" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "USER", label: "User" },
];

const ROLE_COLORS = {
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
  CH: {
    bg: "rgba(20,184,166,0.1)",
    text: "#2dd4bf",
    border: "rgba(20,184,166,0.2)",
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

function RolePill({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.USER;
  const label = ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
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
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        display: "inline-block",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}
    >
      {label}
    </Box>
  );
}

function StatusDot({ isSuspended, isRevoked }) {
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

function PresenceDot({ presence }) {
  const isOnline = presence === "ONLINE";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "999px",
          background: isOnline ? "#4ade80" : "rgba(255,255,255,0.28)",
          boxShadow: isOnline ? "0 0 10px rgba(74,222,128,0.45)" : "none",
        }}
      />
      <Typography
        sx={{
          fontSize: 11,
          color: isOnline ? "#4ade80" : "rgba(255,255,255,0.4)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {isOnline ? "Online" : "Offline"}
      </Typography>
    </Box>
  );
}

function UserAvatar({ name }) {
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

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UsersPageContent />
    </Suspense>
  );
}

function UsersPageContent() {
  const {
    data: users = [],
    isError,
    error,
  } = useUsers(
    {
      includeSuspended: true,
      includeRevoked: true,
    },
    {
      suspense: true,
    },
  );
  const updateRoleMutation = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const revokeMutation = useRevokeUser();
  const inviteMutation = useInviteUser();
  const bulkInviteMutation = useBulkInviteUsers();
  const deleteMutation = useDeleteUser();
  const { enqueueSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const [dialogType, setDialogType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [newRole, setNewRole] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("USER");
  const [inviteError, setInviteError] = useState("");
  const [inviteMode, setInviteMode] = useState("single");
  const [csvParsed, setCsvParsed] = useState([]);
  const [csvResults, setCsvResults] = useState(null);
  const [presenceOverrides, setPresenceOverrides] = useState({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePresenceUpdate = (payload) => {
      if (!payload?.userId || !payload?.presence) return;

      setPresenceOverrides((prev) => {
        const current = prev[payload.userId];
        if (current === payload.presence) {
          return prev;
        }

        return {
          ...prev,
          [payload.userId]: payload.presence,
        };
      });
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, []);

  const usersWithPresence = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        presence: presenceOverrides[u.id] ?? u.presence,
      })),
    [users, presenceOverrides],
  );

  const stats = useMemo(() => {
    if (!usersWithPresence.length) return { total: 0, online: 0, suspended: 0 };
    return {
      total: usersWithPresence.length,
      online: usersWithPresence.filter((u) => u.presence === "ONLINE").length,
      suspended: usersWithPresence.filter((u) => u.isSuspended).length,
    };
  }, [usersWithPresence]);

  const filteredUsers = useMemo(
    () =>
      usersWithPresence.filter((u) => {
        const matchesSearch =
          (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        let matchesStatus = true;
        if (statusFilter === "active")
          matchesStatus = !u.isSuspended && !u.isRevoked;
        if (statusFilter === "suspended") matchesStatus = u.isSuspended;
        if (statusFilter === "revoked") matchesStatus = u.isRevoked;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [usersWithPresence, searchQuery, roleFilter, statusFilter],
  );

  const handleMenuOpen = (e, u) => {
    setAnchorEl(e.currentTarget);
    setMenuUser(u);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const openDialog = (type, u) => {
    setDialogType(type);
    setSelectedUser(u);
    if (type === "delete") setDeleteDialogOpen(true);
    else setDialogOpen(true);
    if (type === "role") setNewRole(u.role);
    handleMenuClose();
  };
  const closeDialog = () => {
    setDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    setDialogType(null);
    setNewRole("");
    setSuspensionDays("7");
    setSuspensionReason("");
    setRevokeReason("");
  };

  const openInvite = () => {
    setInviteDialogOpen(true);
    setInviteError("");
  };
  const closeInvite = () => {
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteRole("USER");
    setInviteError("");
    setInviteMode("single");
    setCsvParsed([]);
    setCsvResults(null);
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      setInviteError("Email is required");
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      enqueueSnackbar("Invitation sent", { variant: "success" });
      closeInvite();
    } catch (err) {
      setInviteError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send invitation",
      );
    }
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const validRoles = new Set(["SA", "BOARD", "DH", "CH", "JUDGE", "VOLUNTEER", "USER"]);
      const parsed = [];
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.startsWith("email")) continue; // skip header row
        const parts = line.split(",");
        const email = (parts[0] || "").trim();
        const rawRole = (parts[1] || "").trim().toUpperCase();
        if (!email) continue;
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const role = validRoles.has(rawRole) ? rawRole : "USER";
        const warning = !emailValid
          ? "Invalid email format"
          : !validRoles.has(rawRole) && rawRole
          ? `Unknown role "${parts[1]?.trim()}", defaulted to USER`
          : null;
        parsed.push({ email, role, warning, emailValid });
      }
      setCsvParsed(parsed);
      setCsvResults(null);
    };
    reader.readAsText(file);
  };

  const handleBulkInvite = async () => {
    const valid = csvParsed.filter((r) => r.emailValid);
    if (!valid.length) return;
    try {
      const res = await bulkInviteMutation.mutateAsync(valid);
      setCsvResults(res.data.results);
    } catch (err) {
      setInviteError(err?.response?.data?.message || err?.message || "Failed to send bulk invitations");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUser.id,
        role: newRole,
      });
      enqueueSnackbar("Role updated", { variant: "success" });
      closeDialog();
    } catch (err) {
      enqueueSnackbar(err.message || "Failed", { variant: "error" });
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspensionReason) return;

    const durationDays = parseInt(suspensionDays, 10);
    if (Number.isNaN(durationDays) || durationDays < 1) {
      enqueueSnackbar("Enter a valid suspension duration in days", {
        variant: "error",
      });
      return;
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);
    try {
      await suspendMutation.mutateAsync({
        userId: selectedUser.id,
        data: {
          reason: suspensionReason,
          suspendedUntil: suspendedUntil.toISOString(),
        },
      });
      enqueueSnackbar("User suspended", { variant: "success" });
      closeDialog();
    } catch (err) {
      enqueueSnackbar(err.message || "Failed", { variant: "error" });
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;
    try {
      await unsuspendMutation.mutateAsync(selectedUser.id);
      enqueueSnackbar("User unsuspended", { variant: "success" });
      closeDialog();
    } catch (err) {
      enqueueSnackbar(err.message || "Failed", { variant: "error" });
    }
  };

  const handleRevoke = async () => {
    if (!selectedUser || !revokeReason) return;
    try {
      await revokeMutation.mutateAsync({
        userId: selectedUser.id,
        reason: revokeReason,
      });
      enqueueSnackbar("Access revoked", { variant: "success" });
      closeDialog();
    } catch (err) {
      enqueueSnackbar(err.message || "Failed", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      enqueueSnackbar("User deleted", { variant: "success" });
      closeDialog();
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
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

  if (isError)
    return (
      <Box sx={{ p: 4 }}>
        <Typography sx={{ color: "#f87171" }}>
          {error?.message || "Failed to load users"}
        </Typography>
      </Box>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
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
              User Management
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
            Manage roles, permissions and account status
          </Typography>
        </Box>

        <InlineBtn onClick={openInvite} icon={<UserPlus size={14} />}>
          Invite User
        </InlineBtn>
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
          {
            label: "Total Users",
            value: stats.total,
            color: "rgba(255,255,255,0.7)",
          },
          { label: "Online", value: stats.online, color: "#4ade80" },
          { label: "Suspended", value: stats.suspended, color: "#fbbf24" },
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
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
        <NativeSelect value={roleFilter} onChange={setRoleFilter}>
          <option value="all">All Roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="revoked">Revoked</option>
        </NativeSelect>
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.18)",
            fontFamily: "'DM Mono', monospace",
            ml: "auto",
          }}
        >
          {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
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
              "minmax(200px,1fr) 120px 120px 110px 110px 44px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["User", "Role", "Status", "Presence", "Joined", ""].map((h, i) => (
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

          {filteredUsers.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No users found
              </Typography>
            </Box>
          ) : (
            filteredUsers.map((user, idx) => (
              <Box key={user.id}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(200px,1fr) 120px 120px 110px 110px 44px",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.02)" },
                  }}
                >
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
                        {user.name || "Invited user"}
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
                  <Box sx={{ overflow: "hidden", minWidth: 0 }}>
                    <RolePill role={user.role} />
                  </Box>
                  <Box>
                    <StatusDot
                      isSuspended={user.isSuspended}
                      isRevoked={user.isRevoked}
                    />
                  </Box>
                  <Box>
                    <PresenceDot presence={user.presence} />
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
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user)}
                    sx={{
                      color: "rgba(255,255,255,0.25)",
                      borderRadius: "7px",
                      "&:hover": {
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.7)",
                      },
                    }}
                  >
                    <MoreVertical size={15} />
                  </IconButton>
                </Box>
                {idx < filteredUsers.length - 1 && <RowDivider />}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            minWidth: 180,
            mt: 0.5,
          },
        }}
      >
        <CtxItem
          onClick={() => openDialog("role", menuUser)}
          icon={<Pencil size={14} />}
        >
          Change Role
        </CtxItem>
        {menuUser && !menuUser.isSuspended && !menuUser.isRevoked && (
          <CtxItem
            onClick={() => openDialog("suspend", menuUser)}
            color="#fbbf24"
            icon={<ShieldAlert size={14} />}
          >
            Suspend
          </CtxItem>
        )}
        {menuUser && menuUser.isSuspended && (
          <CtxItem
            onClick={() => openDialog("unsuspend", menuUser)}
            color="#4ade80"
            icon={<ShieldCheck size={14} />}
          >
            Unsuspend
          </CtxItem>
        )}
        {menuUser && !menuUser.isRevoked && (
          <CtxItem
            onClick={() => openDialog("revoke", menuUser)}
            color="#f87171"
            icon={<ShieldOff size={14} />}
          >
            Revoke Access
          </CtxItem>
        )}
        {menuUser && (
          <CtxItem
            onClick={() => openDialog("delete", menuUser)}
            color="#f87171"
            icon={<Trash2 size={14} />}
          >
            Delete User
          </CtxItem>
        )}
      </Menu>

      {/* ── Dialogs ── */}
      <DarkDialog
        open={dialogOpen && dialogType === "role"}
        onClose={closeDialog}
        title="Change Role"
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.32)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedUser?.name} · {selectedUser?.email}
        </Typography>
        <NativeSelect value={newRole} onChange={setNewRole} fullWidth>
          <option value="">Select role…</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </NativeSelect>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <PrimaryBtn
            onClick={handleUpdateRole}
            disabled={!newRole}
            loading={updateRoleMutation.isPending}
          >
            {updateRoleMutation.isPending ? "Updating…" : "Update Role"}
          </PrimaryBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={dialogOpen && dialogType === "suspend"}
        onClose={closeDialog}
        title="Suspend User"
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.32)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedUser?.name}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'DM Mono', monospace",
            mb: 0.75,
          }}
        >
          Suspension duration (days)
        </Typography>
        <DarkInput
          type="number"
          min={1}
          value={suspensionDays}
          onChange={(e) => setSuspensionDays(e.target.value)}
          placeholder="e.g. 7"
          style={{ marginBottom: 12 }}
        />
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
            mb: 1.5,
          }}
        >
          User access is restored automatically after this many days.
        </Typography>
        <DarkTextarea
          rows={3}
          value={suspensionReason}
          onChange={(e) => setSuspensionReason(e.target.value)}
          placeholder="Reason for suspension…"
        />
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <WarnBtn
            onClick={handleSuspend}
            disabled={!suspensionReason}
            loading={suspendMutation.isPending}
          >
            {suspendMutation.isPending ? "Suspending…" : "Suspend"}
          </WarnBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={dialogOpen && dialogType === "unsuspend"}
        onClose={closeDialog}
        title="Unsuspend User"
      >
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Syne', sans-serif",
            mb: 3,
          }}
        >
          Remove the suspension from{" "}
          <strong style={{ color: "#e4e4e7" }}>{selectedUser?.name}</strong>?
        </Typography>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <GreenBtn
            onClick={handleUnsuspend}
            loading={unsuspendMutation.isPending}
          >
            {unsuspendMutation.isPending ? "Unsuspending…" : "Unsuspend"}
          </GreenBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={dialogOpen && dialogType === "revoke"}
        onClose={closeDialog}
        title="Revoke Access"
      >
        <DangerNote>This action is permanent and cannot be undone.</DangerNote>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.32)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {selectedUser?.name}
        </Typography>
        <DarkTextarea
          rows={3}
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
          placeholder="Reason for revoking access…"
        />
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <DangerBtn
            onClick={handleRevoke}
            disabled={!revokeReason}
            loading={revokeMutation.isPending}
          >
            {revokeMutation.isPending ? "Revoking…" : "Revoke Access"}
          </DangerBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={deleteDialogOpen}
        onClose={closeDialog}
        title="Delete User"
      >
        <DangerNote>
          This will permanently delete the user and all associated data.
        </DangerNote>
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {selectedUser?.name || "Invited user"} ·{" "}
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
            {selectedUser?.email}
          </span>
        </Typography>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <DangerBtn onClick={handleDelete} loading={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting…" : "Delete User"}
          </DangerBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={inviteDialogOpen}
        onClose={closeInvite}
        title="Invite New User"
      >
        {/* Mode toggle */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mb: 2,
            p: 0.5,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {["single", "csv"].map((mode) => (
            <Box
              key={mode}
              onClick={() => { setInviteMode(mode); setInviteError(""); setCsvParsed([]); setCsvResults(null); }}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 0.75,
                borderRadius: 1.5,
                fontSize: 12,
                fontFamily: "'Syne', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
                background: inviteMode === mode ? "rgba(255,255,255,0.1)" : "transparent",
                color: inviteMode === mode ? "#f4f4f5" : "rgba(255,255,255,0.35)",
                fontWeight: inviteMode === mode ? 600 : 400,
              }}
            >
              {mode === "single" ? "Single" : "Bulk CSV"}
            </Box>
          ))}
        </Box>

        {inviteError && <DangerNote>{inviteError}</DangerNote>}

        {inviteMode === "single" ? (
          <>
            <DarkInput
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              style={{ marginBottom: 12 }}
            />
            <NativeSelect value={inviteRole} onChange={setInviteRole} fullWidth>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'Syne', sans-serif",
                mt: 1.5,
                lineHeight: 1.6,
              }}
            >
              An invitation email will be sent with instructions to set up their
              account.
            </Typography>
            <BtnRow>
              <GhostBtn onClick={closeInvite}>Cancel</GhostBtn>
              <InviteBtn onClick={handleInvite} loading={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Sending…" : "Send Invitation"}
              </InviteBtn>
            </BtnRow>
          </>
        ) : (
          <>
            {/* CSV upload area */}
            {!csvResults && (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "24px 16px",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.02)",
                  marginBottom: 12,
                }}
              >
                <Upload size={20} color="rgba(255,255,255,0.3)" />
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'Syne', sans-serif",
                    textAlign: "center",
                  }}
                >
                  {csvParsed.length
                    ? `${csvParsed.length} row(s) loaded — click to replace`
                    : "Click to upload CSV"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  Format: email,role (one per line)
                </Typography>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  style={{ display: "none" }}
                  onChange={(e) => handleCsvFile(e.target.files?.[0])}
                />
              </label>
            )}

            {/* Preview table */}
            {csvParsed.length > 0 && !csvResults && (
              <Box
                sx={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  mb: 1.5,
                }}
              >
                {csvParsed.map((row, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.75,
                      borderBottom: i < csvParsed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      gap: 1,
                    }}
                  >
                    {row.emailValid ? (
                      <CheckCircle2 size={12} color="rgba(74,222,128,0.7)" />
                    ) : (
                      <XCircle size={12} color="rgba(248,113,113,0.8)" />
                    )}
                    <Typography
                      sx={{
                        flex: 1,
                        fontSize: 11,
                        fontFamily: "'Syne', sans-serif",
                        color: row.emailValid ? "rgba(255,255,255,0.65)" : "rgba(248,113,113,0.8)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.email}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontFamily: "'Syne', sans-serif",
                        color: "rgba(255,255,255,0.3)",
                        flexShrink: 0,
                      }}
                    >
                      {row.role}
                    </Typography>
                    {row.warning && (
                      <AlertCircle size={12} color="rgba(251,191,36,0.7)" title={row.warning} />
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Results after sending */}
            {csvResults && (
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  mb: 1.5,
                }}
              >
                <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography sx={{ fontSize: 11, fontFamily: "'Syne', sans-serif", color: "rgba(255,255,255,0.4)" }}>
                    {csvResults.filter((r) => r.success).length} sent ·{" "}
                    {csvResults.filter((r) => !r.success).length} failed
                  </Typography>
                </Box>
                {csvResults.map((row, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.75,
                      borderBottom: i < csvResults.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      gap: 1,
                    }}
                  >
                    {row.success ? (
                      <CheckCircle2 size={12} color="rgba(74,222,128,0.7)" />
                    ) : (
                      <XCircle size={12} color="rgba(248,113,113,0.8)" />
                    )}
                    <Typography
                      sx={{
                        flex: 1,
                        fontSize: 11,
                        fontFamily: "'Syne', sans-serif",
                        color: row.success ? "rgba(255,255,255,0.65)" : "rgba(248,113,113,0.8)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.email}
                    </Typography>
                    {!row.success && (
                      <Typography sx={{ fontSize: 10, fontFamily: "'Syne', sans-serif", color: "rgba(248,113,113,0.6)", flexShrink: 0 }}>
                        {row.error === "EMAIL_ALREADY_EXISTS" ? "already exists" : "failed"}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            <Typography
              sx={{
                fontSize: 10,
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'Syne', sans-serif",
                mb: 1.5,
                lineHeight: 1.6,
              }}
            >
              Valid roles: SA, BOARD, DH, JUDGE, VOLUNTEER, USER. Unknown roles default to USER.
            </Typography>

            <BtnRow>
              <GhostBtn onClick={closeInvite}>{csvResults ? "Close" : "Cancel"}</GhostBtn>
              {!csvResults && (
                <InviteBtn
                  onClick={handleBulkInvite}
                  disabled={!csvParsed.filter((r) => r.emailValid).length}
                  loading={bulkInviteMutation.isPending}
                >
                  {bulkInviteMutation.isPending
                    ? "Sending…"
                    : `Send ${csvParsed.filter((r) => r.emailValid).length} Invitation(s)`}
                </InviteBtn>
              )}
            </BtnRow>
          </>
        )}
      </DarkDialog>
    </Box>
  );
}

/* ── Primitives ── */

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

function NativeSelect({ value, onChange, children, fullWidth }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: fullWidth ? "100%" : "auto",
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

function DarkInput({
  type = "text",
  value,
  onChange,
  placeholder,
  style = {},
  ...rest
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
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
        boxSizing: "border-box",
        ...style,
      }}
    />
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

function CtxItem({
  onClick,
  icon,
  color = "rgba(255,255,255,0.65)",
  children,
}) {
  return (
    <MenuItem
      onClick={onClick}
      sx={{
        fontSize: 13,
        color,
        fontFamily: "'Syne', sans-serif",
        gap: 1.5,
        "&:hover": { background: "rgba(255,255,255,0.04)" },
        minHeight: 38,
      }}
    >
      {icon}
      {children}
    </MenuItem>
  );
}

function InlineBtn({ onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        cursor: "pointer",
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 500,
        letterSpacing: "0.02em",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.09)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      {icon}
      {children}
    </button>
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

function GhostBtn({ onClick, children, loading, disabled }) {
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
function PrimaryBtn({ onClick, children, disabled, loading }) {
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
function WarnBtn({ onClick, children, disabled, loading }) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: "rgba(251,191,36,0.1)",
        border: "1px solid rgba(251,191,36,0.2)",
        color: "#fbbf24",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.background = "rgba(251,191,36,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(251,191,36,0.1)";
      }}
    >
      {loading && <BtnSpinner color="#fbbf24" />}
      {children}
    </button>
  );
}
function GreenBtn({ onClick, children, disabled, loading }) {
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
function DangerBtn({ onClick, children, disabled, loading }) {
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

function InviteBtn({ onClick, children, disabled, loading }) {
  const isDisabled = disabled || loading;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...btnBase,
        background: isDisabled
          ? "rgba(109,40,217,0.25)"
          : "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
        border: "1px solid rgba(168,85,247,0.35)",
        color: isDisabled ? "rgba(255,255,255,0.4)" : "#fff",
        opacity: isDisabled ? 0.65 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.background =
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isDisabled
          ? "rgba(109,40,217,0.25)"
          : "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)";
      }}
    >
      {loading && <BtnSpinner color="rgba(255,255,255,0.7)" />}
      {children}
    </button>
  );
}
