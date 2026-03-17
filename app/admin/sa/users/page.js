"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  useUsers,
  useUpdateUserRole,
  useSuspendUser,
  useUnsuspendUser,
  useRevokeUser,
  useInviteUser,
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
} from "lucide-react";
import { useSnackbar } from "notistack";
import { LoadingState } from "@/src/components/LoadingState";

const ROLE_OPTIONS = [
  { value: "SA", label: "Super Admin" },
  { value: "BOARD", label: "Board" },
  { value: "DH", label: "Department Head" },
  { value: "JUDGE", label: "Judge" },
  { value: "VOLUNTEER", label: "Volunteer" },
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
  const { data: users = [], isLoading, isError, error } = useUsers();
  const updateRoleMutation = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const revokeMutation = useRevokeUser();
  const inviteMutation = useInviteUser();
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

  const stats = useMemo(() => {
    if (!users.length) return { total: 0, active: 0, suspended: 0 };
    return {
      total: users.length,
      active: users.filter((u) => !u.isSuspended && !u.isRevoked).length,
      suspended: users.filter((u) => u.isSuspended).length,
    };
  }, [users]);

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
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
    [users, searchQuery, roleFilter, statusFilter],
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
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(suspensionDays));
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

  if (isLoading) return <LoadingState />;
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
          { label: "Active", value: stats.active, color: "#4ade80" },
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
            gridTemplateColumns: "minmax(200px,1fr) 130px 120px 110px 44px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["User", "Role", "Status", "Joined", ""].map((h, i) => (
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
                      "minmax(200px,1fr) 130px 120px 110px 44px",
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
            disabled={updateRoleMutation.isPending || !newRole}
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
        <DarkInput
          type="number"
          min={1}
          value={suspensionDays}
          onChange={(e) => setSuspensionDays(e.target.value)}
          placeholder="Duration (days)"
          style={{ marginBottom: 12 }}
        />
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
            disabled={suspendMutation.isPending || !suspensionReason}
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
            disabled={unsuspendMutation.isPending}
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
            disabled={revokeMutation.isPending || !revokeReason}
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
          <DangerBtn onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting…" : "Delete User"}
          </DangerBtn>
        </BtnRow>
      </DarkDialog>

      <DarkDialog
        open={inviteDialogOpen}
        onClose={closeInvite}
        title="Invite New User"
      >
        {inviteError && <DangerNote>{inviteError}</DangerNote>}
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
          <InviteBtn onClick={handleInvite} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Sending…" : "Send Invitation"}
          </InviteBtn>
        </BtnRow>
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
function PrimaryBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#f4f4f5",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      }}
    >
      {children}
    </button>
  );
}
function WarnBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(251,191,36,0.1)",
        border: "1px solid rgba(251,191,36,0.2)",
        color: "#fbbf24",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(251,191,36,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(251,191,36,0.1)";
      }}
    >
      {children}
    </button>
  );
}
function GreenBtn({ onClick, children, disabled }) {
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

function InviteBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: disabled
          ? "rgba(109,40,217,0.25)"
          : "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
        border: "1px solid rgba(168,85,247,0.35)",
        color: disabled ? "rgba(255,255,255,0.4)" : "#fff",
        opacity: disabled ? 0.65 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background =
            "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = disabled
          ? "rgba(109,40,217,0.25)"
          : "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)";
      }}
    >
      {children}
    </button>
  );
}
