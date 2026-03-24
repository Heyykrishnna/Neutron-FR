"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Search,
  MoreVertical,
  Plus,
  Users,
  UserPlus2,
  Pencil,
  Trash2,
  Shield,
} from "lucide-react";
import { useSnackbar } from "notistack";

import {
  useClubs,
  useClub,
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
  useAssignUserToClub,
  useRemoveUserFromClub,
} from "@/src/hooks/api/useClubs";
import { useUsers } from "@/src/hooks/api/useUsers";
import { LoadingState } from "@/src/components/LoadingState";

const CARD_BG = "#0b0b0b";
const BORDER = "1px solid rgba(255,255,255,0.08)";

const CLUB_MEMBER_ROLES = ["MEMBER", "COORDINATOR", "HEAD"];

function StatCard({ label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "12px",
        border: BORDER,
        background: CARD_BG,
        minWidth: 180,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 24,
          color: "#fff",
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        color: "rgba(255,255,255,0.48)",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        mb: 0.8,
      }}
    >
      {children}
    </Typography>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          background: "#090909",
          border: BORDER,
          color: "#fff",
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 13,
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: "100%",
        background: "#090909",
        border: BORDER,
        color: "#fff",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 13,
        fontFamily: "inherit",
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#090909",
        border: BORDER,
        color: "#fff",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 13,
        fontFamily: "inherit",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        borderRadius: 10,
        background: disabled ? "rgba(168,85,247,0.35)" : "#a855f7",
        color: "#fff",
        padding: "9px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 10,
        border: BORDER,
        background: "transparent",
        color: "rgba(255,255,255,0.75)",
        padding: "9px 14px",
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function AppDialog({ open, title, onClose, children, footer }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0d0d0d",
          border: BORDER,
          borderRadius: "14px",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: 2.2, borderBottom: BORDER }}>
        <Typography
          sx={{
            fontSize: 16,
            color: "#fff",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.2 }}>{children}</Box>
      {footer ? <Box sx={{ p: 2.2, pt: 0 }}>{footer}</Box> : null}
    </Dialog>
  );
}

export default function ClubsPage() {
  const { enqueueSnackbar } = useSnackbar();

  const { data: clubs = [], isLoading } = useClubs();
  const { data: volunteers = [], isLoading: volunteersLoading } = useUsers({
    role: "VOLUNTEER",
    limit: 500,
  });

  const createMutation = useCreateClub();
  const updateMutation = useUpdateClub();
  const deleteMutation = useDeleteClub();
  const assignMemberMutation = useAssignUserToClub();
  const removeMemberMutation = useRemoveUserFromClub();

  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuClub, setMenuClub] = useState(null);

  const [dialogType, setDialogType] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [selectedClubId, setSelectedClubId] = useState(null);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [removingUserId, setRemovingUserId] = useState(null);

  const {
    data: selectedClub,
    isLoading: selectedClubLoading,
    refetch: refetchSelectedClub,
  } = useClub(selectedClubId);

  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) return clubs;
    const q = searchQuery.toLowerCase();
    return clubs.filter(
      (club) =>
        (club.name || "").toLowerCase().includes(q) ||
        (club.description || "").toLowerCase().includes(q),
    );
  }, [clubs, searchQuery]);

  const existingMemberIds = useMemo(() => {
    const members = selectedClub?.members || [];
    return new Set(members.map((member) => member?.userId).filter(Boolean));
  }, [selectedClub?.members]);

  const availableVolunteers = useMemo(() => {
    if (dialogType !== "members") return volunteers;
    return volunteers.filter(
      (volunteer) => !existingMemberIds.has(volunteer.id),
    );
  }, [dialogType, volunteers, existingMemberIds]);

  const filteredVolunteers = useMemo(() => {
    if (!volunteerSearch.trim()) return availableVolunteers;
    const q = volunteerSearch.toLowerCase();
    return availableVolunteers.filter(
      (v) =>
        (v.name || "").toLowerCase().includes(q) ||
        (v.email || "").toLowerCase().includes(q),
    );
  }, [availableVolunteers, volunteerSearch]);

  const getErrorMessage = (error, fallback) => {
    return error?.response?.data?.message || error?.message || fallback;
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setMenuClub(null);
    setName("");
    setDescription("");
    setLogoUrl("");
    setIsActive(true);
    setSelectedClubId(null);
    setSelectedVolunteerIds([]);
    setMemberRole("MEMBER");
    setVolunteerSearch("");
    setRemovingUserId(null);
  };

  const openDialog = (type, club = null) => {
    setDialogType(type);
    setMenuClub(club);

    if (type === "members" || type === "viewMembers") {
      setSelectedClubId(club?.id || null);
      setSelectedVolunteerIds([]);
      setMemberRole("MEMBER");
      setDialogOpen(true);
      setAnchorEl(null);
      return;
    }

    if (club) {
      setName(club.name || "");
      setDescription(club.description || "");
      setLogoUrl(club.logoUrl || "");
      setIsActive(Boolean(club.isActive));
    } else {
      setName("");
      setDescription("");
      setLogoUrl("");
      setIsActive(true);
    }

    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      enqueueSnackbar("Club name is required", { variant: "warning" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        isActive,
      });
      enqueueSnackbar("Club created", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to create club"), {
        variant: "error",
      });
    }
  };

  const handleUpdate = async () => {
    if (!menuClub?.id) {
      enqueueSnackbar("No club selected", { variant: "error" });
      return;
    }

    if (!name.trim()) {
      enqueueSnackbar("Club name is required", { variant: "warning" });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        clubId: menuClub.id,
        name: name.trim(),
        description: description.trim() || null,
        logoUrl: logoUrl.trim() || null,
        isActive,
      });
      enqueueSnackbar("Club updated", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to update club"), {
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!menuClub?.id) {
      enqueueSnackbar("No club selected", { variant: "error" });
      return;
    }

    try {
      await deleteMutation.mutateAsync(menuClub.id);
      enqueueSnackbar("Club deleted", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to delete club"), {
        variant: "error",
      });
    }
  };

  const handleAssignMembers = async () => {
    if (!menuClub?.id) {
      enqueueSnackbar("No club selected", { variant: "error" });
      return;
    }

    if (!selectedVolunteerIds.length) {
      enqueueSnackbar("Select at least one volunteer", { variant: "warning" });
      return;
    }

    const results = await Promise.allSettled(
      selectedVolunteerIds.map((userId) =>
        assignMemberMutation.mutateAsync({
          clubId: menuClub.id,
          userId,
          role: memberRole,
        }),
      ),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      enqueueSnackbar(
        `${successCount} member${successCount > 1 ? "s" : ""} added`,
        {
          variant: "success",
        },
      );
      await refetchSelectedClub();
    }

    if (failedCount > 0) {
      enqueueSnackbar(
        `${failedCount} assignment${failedCount > 1 ? "s" : ""} failed`,
        {
          variant: "error",
        },
      );
      return;
    }

    closeDialog();
  };

  const handleRemoveMember = async (member) => {
    if (!selectedClubId || !member?.userId) return;

    try {
      setRemovingUserId(member.userId);
      await removeMemberMutation.mutateAsync({
        clubId: selectedClubId,
        userId: member.userId,
      });
      enqueueSnackbar("Member removed", { variant: "success" });
      await refetchSelectedClub();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to remove member"), {
        variant: "error",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 28,
              color: "#fff",
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.1,
            }}
          >
            Clubs
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.48)", mt: 0.6, fontSize: 13 }}
          >
            Manage clubs and member assignments from SA dashboard
          </Typography>
        </Box>

        <PrimaryButton onClick={() => openDialog("create")}>
          <Plus size={15} />
          New Club
        </PrimaryButton>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5 }}>
        <StatCard label="Total Clubs" value={clubs.length} />
        <StatCard
          label="Active Clubs"
          value={clubs.filter((club) => club.isActive !== false).length}
        />
        <StatCard
          label="Total Members"
          value={clubs.reduce((sum, club) => sum + (club.membersCount || 0), 0)}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          border: BORDER,
          borderRadius: "12px",
          px: 1.4,
          py: 1,
          mb: 1.2,
          background: CARD_BG,
        }}
      >
        <Search size={14} color="rgba(255,255,255,0.45)" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clubs…"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: "#fff",
            outline: "none",
            fontSize: 13,
          }}
        />
      </Box>

      <Typography
        sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", mb: 1.2 }}
      >
        {filteredClubs.length} result{filteredClubs.length !== 1 ? "s" : ""}
      </Typography>

      <Box
        sx={{
          border: BORDER,
          borderRadius: "12px",
          overflow: "hidden",
          background: CARD_BG,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 60px", md: "2fr 2fr 100px 80px" },
            p: 1.4,
            borderBottom: BORDER,
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <Box>Name</Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>Description</Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>Members</Box>
          <Box />
        </Box>

        {filteredClubs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 13 }}>
              No clubs found.
            </Typography>
          </Box>
        ) : (
          filteredClubs.map((club, idx) => (
            <Box
              key={club.id}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 60px",
                  md: "2fr 2fr 100px 80px",
                },
                p: 1.4,
                alignItems: "center",
                borderBottom: idx < filteredClubs.length - 1 ? BORDER : "none",
                cursor: "pointer",
                "&:hover": { background: "rgba(255,255,255,0.02)" },
              }}
              onClick={() => openDialog("viewMembers", club)}
            >
              <Box>
                <Typography
                  sx={{ color: "#fff", fontSize: 14, lineHeight: 1.2 }}
                >
                  {club.name}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    mt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      px: 0.8,
                      py: 0.2,
                      borderRadius: "999px",
                      border: BORDER,
                      fontSize: 10,
                      color:
                        club.isActive === false
                          ? "rgba(244,63,94,0.95)"
                          : "rgba(34,197,94,0.95)",
                    }}
                  >
                    {club.isActive === false ? "INACTIVE" : "ACTIVE"}
                  </Box>
                </Box>
              </Box>

              <Typography
                sx={{
                  display: { xs: "none", md: "block" },
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 12,
                  pr: 1,
                }}
              >
                {club.description || "—"}
              </Typography>

              <Typography
                sx={{
                  display: { xs: "none", md: "block" },
                  color: "rgba(255,255,255,0.82)",
                  fontSize: 12,
                }}
              >
                {club.membersCount || 0}
              </Typography>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setAnchorEl(e.currentTarget);
                  setMenuClub(club);
                }}
                size="small"
                sx={{ color: "rgba(255,255,255,0.6)", justifySelf: "end" }}
              >
                <MoreVertical size={14} />
              </IconButton>
            </Box>
          ))
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setMenuClub(null);
        }}
      >
        <MenuItem onClick={() => openDialog("members", menuClub)}>
          <UserPlus2 size={14} style={{ marginRight: 8 }} /> Add Members
        </MenuItem>
        <MenuItem onClick={() => openDialog("edit", menuClub)}>
          <Pencil size={14} style={{ marginRight: 8 }} /> Edit Club
        </MenuItem>
        <MenuItem
          onClick={() => openDialog("delete", menuClub)}
          sx={{ color: "#ef4444" }}
        >
          <Trash2 size={14} style={{ marginRight: 8 }} /> Delete Club
        </MenuItem>
      </Menu>

      <AppDialog
        open={dialogOpen && (dialogType === "create" || dialogType === "edit")}
        onClose={closeDialog}
        title={dialogType === "create" ? "New Club" : "Edit Club"}
        footer={
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <GhostButton onClick={closeDialog}>Cancel</GhostButton>
            <PrimaryButton
              onClick={dialogType === "create" ? handleCreate : handleUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {dialogType === "create" ? "Create Club" : "Save Changes"}
            </PrimaryButton>
          </Box>
        }
      >
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChange={setName} placeholder="Club name" />
          </Box>
          <Box>
            <FieldLabel>Description</FieldLabel>
            <Input
              value={description}
              onChange={setDescription}
              placeholder="Description"
              multiline
            />
          </Box>
          <Box>
            <FieldLabel>Logo URL</FieldLabel>
            <Input
              value={logoUrl}
              onChange={setLogoUrl}
              placeholder="https://..."
            />
          </Box>
          <Box>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(value) => setIsActive(value === "ACTIVE")}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              placeholder="Select status"
            />
          </Box>
        </Box>
      </AppDialog>

      <AppDialog
        open={dialogOpen && dialogType === "delete"}
        onClose={closeDialog}
        title="Delete Club"
        footer={
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <GhostButton onClick={closeDialog}>Cancel</GhostButton>
            <PrimaryButton
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </PrimaryButton>
          </Box>
        }
      >
        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
          Delete <b>{menuClub?.name || "this club"}</b>? This action cannot be
          undone.
        </Typography>
      </AppDialog>

      <AppDialog
        open={dialogOpen && dialogType === "members"}
        onClose={closeDialog}
        title={
          menuClub?.name ? `${menuClub.name} — Add Members` : "Add Members"
        }
        footer={
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              {selectedVolunteerIds.length} selected
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <GhostButton onClick={closeDialog}>Cancel</GhostButton>
              <PrimaryButton
                onClick={handleAssignMembers}
                disabled={
                  assignMemberMutation.isPending ||
                  selectedVolunteerIds.length === 0
                }
              >
                <Users size={14} /> Add Members
              </PrimaryButton>
            </Box>
          </Box>
        }
      >
        <Box sx={{ mb: 1.3 }}>
          <FieldLabel>Default role for selected users</FieldLabel>
          <Select
            value={memberRole}
            onChange={setMemberRole}
            options={CLUB_MEMBER_ROLES.map((role) => ({
              value: role,
              label: role,
            }))}
            placeholder="Select role"
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
          <Search size={14} color="rgba(255,255,255,0.45)" />
          <input
            value={volunteerSearch}
            onChange={(e) => setVolunteerSearch(e.target.value)}
            placeholder="Filter volunteers…"
            style={{
              width: "100%",
              border: BORDER,
              borderRadius: 10,
              background: "#090909",
              color: "#fff",
              padding: "8px 10px",
              outline: "none",
              fontSize: 13,
            }}
          />
        </Box>

        <Box
          sx={{
            border: BORDER,
            borderRadius: 10,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {volunteersLoading || selectedClubLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
              >
                Loading users…
              </Typography>
            </Box>
          ) : filteredVolunteers.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
              >
                {availableVolunteers.length === 0
                  ? "All volunteers are already added"
                  : "No volunteers found"}
              </Typography>
            </Box>
          ) : (
            filteredVolunteers.map((volunteer, idx) => {
              const checked = selectedVolunteerIds.includes(volunteer.id);
              return (
                <label
                  key={volunteer.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderBottom:
                      idx < filteredVolunteers.length - 1
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedVolunteerIds((prev) =>
                        checked
                          ? prev.filter((id) => id !== volunteer.id)
                          : [...prev, volunteer.id],
                      );
                    }}
                  />
                  <Box>
                    <Typography sx={{ color: "#fff", fontSize: 13 }}>
                      {volunteer.name || "Unnamed User"}
                    </Typography>
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    >
                      {volunteer.email}
                    </Typography>
                  </Box>
                </label>
              );
            })
          )}
        </Box>
      </AppDialog>

      <AppDialog
        open={dialogOpen && dialogType === "viewMembers"}
        onClose={closeDialog}
        title={menuClub?.name ? `${menuClub.name} — Members` : "Club Members"}
      >
        {selectedClubLoading ? (
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            Loading members…
          </Typography>
        ) : (selectedClub?.members?.length || 0) === 0 ? (
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            No members assigned yet.
          </Typography>
        ) : (
          <Box sx={{ border: BORDER, borderRadius: 10, overflow: "hidden" }}>
            {selectedClub.members.map((member, idx) => (
              <Box
                key={member.id || `${member.userId}-${idx}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  p: 1.2,
                  borderBottom:
                    idx < selectedClub.members.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                }}
              >
                <Box>
                  <Typography sx={{ color: "#fff", fontSize: 13 }}>
                    {member.user?.name || member.user?.email || "Unknown user"}
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
                  >
                    {member.user?.email || "—"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 0.8,
                      py: 0.2,
                      borderRadius: "999px",
                      border: BORDER,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 10,
                    }}
                  >
                    <Shield size={11} />
                    {member.role || "MEMBER"}
                  </Box>

                  <GhostButton
                    onClick={() => handleRemoveMember(member)}
                    disabled={removingUserId === member.userId}
                  >
                    Remove
                  </GhostButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </AppDialog>
    </Box>
  );
}
