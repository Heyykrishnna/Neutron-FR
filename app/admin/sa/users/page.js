"use client";

import { useState, useMemo } from "react";
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
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  MoreVert,
  PersonOutline,
  Block,
  CheckCircle,
  Cancel,
  Edit,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { DataTable } from "@/src/components/DataTable";
import { UserStatusChip } from "@/src/components/UserStatusChip";
import { RoleBadge } from "@/src/components/RoleBadge";
import { LoadingState } from "@/src/components/LoadingState";

const roles = [
  { value: "SA", label: "Super Admin" },
  { value: "DH", label: "Department Head" },
  { value: "VH", label: "Volunteer Head" },
  { value: "VOL", label: "Volunteer" },
  { value: "PART", label: "Participant" },
];

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  // Form states
  const [newRole, setNewRole] = useState("");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  // Invite user form
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VOL");
  const [inviteError, setInviteError] = useState("");

  // Stats
  const stats = useMemo(() => {
    if (!users.length) return { total: 0, active: 0, suspended: 0 };
    return {
      total: users.length,
      active: users.filter((u) => !u.isSuspended && !u.isRevoked).length,
      suspended: users.filter((u) => u.isSuspended).length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) => {
      const name = user.name || "";
      const email = user.email || "";

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = !user.isSuspended && !user.isRevoked;
      } else if (statusFilter === "suspended") {
        matchesStatus = user.isSuspended;
      } else if (statusFilter === "revoked") {
        matchesStatus = user.isRevoked;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const openDialog = (type, user) => {
    setDialogType(type);
    setSelectedUser(user);
    if (type === "delete") {
      setDeleteDialogOpen(true);
    } else {
      setDialogOpen(true);
    }
    handleMenuClose();

    if (type === "role") {
      setNewRole(user.role);
    }
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

  const openInviteDialog = () => {
    setInviteDialogOpen(true);
    setInviteError("");
  };

  const closeInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("VOL");
    setInviteError("");
  };

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail) {
      setInviteError("Name and email are required");
      return;
    }

    try {
      setInviteError("");
      await inviteMutation.mutateAsync({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      enqueueSnackbar("Invitation sent successfully", { variant: "success" });
      closeInviteDialog();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send invitation";
      setInviteError(message);
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUser.id,
        role: newRole,
      });
      enqueueSnackbar("User role updated successfully", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to update role", {
        variant: "error",
      });
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
      enqueueSnackbar("User suspended successfully", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to suspend user", {
        variant: "error",
      });
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;

    try {
      await unsuspendMutation.mutateAsync(selectedUser.id);
      enqueueSnackbar("User unsuspended successfully", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to unsuspend user", {
        variant: "error",
      });
    }
  };

  const handleRevoke = async () => {
    if (!selectedUser || !revokeReason) return;

    try {
      await revokeMutation.mutateAsync({
        userId: selectedUser.id,
        reason: revokeReason,
      });
      enqueueSnackbar("User access revoked successfully", {
        variant: "success",
      });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to revoke access", {
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteMutation.mutateAsync(selectedUser.id);
      enqueueSnackbar("User deleted successfully", { variant: "success" });
      closeDialog();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete user";
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const getInitials = (name) => {
    const safeName = (name || "").trim();
    if (!safeName) return "?";

    return safeName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const columns = [
    {
      id: "user",
      label: "User",
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background:
                "linear-gradient(135deg, rgb(168, 85, 247), rgb(59, 130, 246))",
              fontWeight: 600,
            }}
          >
            {getInitials(row.name)}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "white" }}
            >
              {row.name || "Invited user"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.email || "No email"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: "role",
      label: "Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <UserStatusChip
          isSuspended={row.isSuspended}
          isRevoked={row.isRevoked}
        />
      ),
    },
    {
      id: "joined",
      label: "Joined",
      render: (row) => (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatDateTime(row.createdAt)}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <IconButton onClick={(e) => handleMenuOpen(e, row)} size="small">
          <MoreVert />
        </IconButton>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error?.message || "Failed to load users"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 1, color: "white" }}
          >
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Manage user roles, permissions, and account status
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonOutline />}
          onClick={openInviteDialog}
          disabled={inviteMutation.isPending}
        >
          {inviteMutation.isPending ? "Sending Invite..." : "Invite User"}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                Total Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ color: "success.main" }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Active
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "success.main" }}
                  >
                    {stats.active}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                <Block sx={{ color: "warning.main" }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Suspended
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "warning.main" }}
                  >
                    {stats.suspended}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="all">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="revoked">Revoked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="No users found"
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => openDialog("role", menuUser)}>
          <Edit sx={{ mr: 1, fontSize: 20 }} />
          Change Role
        </MenuItem>
        {menuUser && !menuUser.isSuspended && !menuUser.isRevoked && (
          <MenuItem
            onClick={() => openDialog("suspend", menuUser)}
            sx={{ color: "warning.main" }}
          >
            <Block sx={{ mr: 1, fontSize: 20 }} />
            Suspend User
          </MenuItem>
        )}
        {menuUser && menuUser.isSuspended && (
          <MenuItem
            onClick={() => openDialog("unsuspend", menuUser)}
            sx={{ color: "success.main" }}
          >
            <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
            Unsuspend User
          </MenuItem>
        )}
        {menuUser && !menuUser.isRevoked && (
          <MenuItem
            onClick={() => openDialog("revoke", menuUser)}
            sx={{ color: "error.main" }}
          >
            <Cancel sx={{ mr: 1, fontSize: 20 }} />
            Revoke Access
          </MenuItem>
        )}
        {menuUser && (
          <MenuItem
            onClick={() => openDialog("delete", menuUser)}
            sx={{ color: "error.main" }}
          >
            <Cancel sx={{ mr: 1, fontSize: 20 }} />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Change Role Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "role"}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mb: 0.5 }}
            >
              User: {selectedUser?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", mb: 2, display: "block" }}
            >
              {selectedUser?.email}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Role</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="New Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={updateRoleMutation.isPending || !newRole}
          >
            {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "suspend"}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Suspend User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              User: {selectedUser?.name}
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Suspension Duration (days)"
              value={suspensionDays}
              onChange={(e) => setSuspensionDays(e.target.value)}
              InputProps={{ inputProps: { min: 1 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Provide a reason for suspension..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleSuspend}
            variant="contained"
            color="warning"
            disabled={suspendMutation.isPending || !suspensionReason}
          >
            {suspendMutation.isPending ? "Suspending..." : "Suspend User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsuspend User Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "unsuspend"}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Unsuspend User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to unsuspend {selectedUser?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleUnsuspend}
            variant="contained"
            color="success"
            disabled={unsuspendMutation.isPending}
          >
            {unsuspendMutation.isPending ? "Unsuspending..." : "Unsuspend"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Access Dialog */}
      <Dialog
        open={dialogOpen && dialogType === "revoke"}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Revoke User Access</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Warning: This action is permanent and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            User: {selectedUser?.name}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Revocation"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="Provide a reason for revoking access..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleRevoke}
            variant="contained"
            color="error"
            disabled={revokeMutation.isPending || !revokeReason}
          >
            {revokeMutation.isPending ? "Revoking..." : "Revoke Access"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will permanently delete the user and cannot be undone.
          </Alert>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            User: {selectedUser?.name || "Invited user"}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {selectedUser?.email}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={closeInviteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {inviteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {inviteError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Full Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 1.5 }}
            >
              An invitation email will be sent to the user with instructions to
              set up their password and complete their account.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInviteDialog}>Cancel</Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
