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
  Shield,
  Search,
  MoreVertical,
  Plus,
  Users,
  UserPlus2,
  Pencil,
  Trash2,
  Loader2,
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

const CLUB_MEMBER_ROLES = ["MEMBER", "COORDINATOR", "HEAD"];

const ROLE_LABEL: any = {
  SA: "Super Admin",
  BOARD: "Board",
  DH: "Dept Head",
  CH: "Club Head",
  JUDGE: "Judge",
  VOLUNTEER: "Volunteer",
  USER: "User",
};

export default function ClubsPage() {
  const { enqueueSnackbar } = useSnackbar();

  const { data: clubs = [], isLoading } = useClubs();
  const { data: volunteers = [], isLoading: volunteersLoading } = useUsers({
    role: "VOLUNTEER",
    limit: 500,
  });
  const { data: clubHeads = [], isLoading: clubHeadsLoading } = useUsers({
    role: "CH",
    limit: 500,
  });

  const createMutation = useCreateClub();
  const updateMutation = useUpdateClub();
  const deleteMutation = useDeleteClub();
  const assignMemberMutation = useAssignUserToClub();
  const removeMemberMutation = useRemoveUserFromClub();

  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuClub, setMenuClub] = useState<any>(null);

  const [dialogType, setDialogType] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [selectedClubId, setSelectedClubId] = useState<any>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<any>([]);
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [memberSearch, setMemberSearch] = useState("");
  const [removingUserId, setRemovingUserId] = useState(null);

  const {
    data: selectedClub,
    isLoading: selectedClubLoading,
    refetch: refetchSelectedClub,
  } = useClub(selectedClubId) as any;

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
    return new Set(members.map((m: any) => m?.userId).filter(Boolean));
  }, [selectedClub?.members]);

  // Merge volunteers + club heads as assignable users
  const allAssignable = useMemo(() => {
    const combined = [...volunteers, ...clubHeads];
    const seen = new Set();
    return combined.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [volunteers, clubHeads]);

  const availableMembers = useMemo(() => {
    if (dialogType !== "members") return allAssignable;
    return allAssignable.filter((u) => !existingMemberIds.has(u.id));
  }, [dialogType, allAssignable, existingMemberIds]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return availableMembers;
    const q = memberSearch.toLowerCase();
    return availableMembers.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [availableMembers, memberSearch]);

  const getErrorMessage = (error: any, fallback: any) =>
    error?.response?.data?.message || error?.message || fallback;

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setMenuClub(null);
    setName("");
    setDescription("");
    setLogoUrl("");
    setIsActive(true);
    setSelectedClubId(null);
    setSelectedMemberIds([]);
    setMemberRole("MEMBER");
    setMemberSearch("");
    setRemovingUserId(null);
  };

  const openDialog = (type: any, club: any = null) => {
    setDialogType(type);
    setMenuClub(club);

    if (type === "members" || type === "viewMembers") {
      setSelectedClubId(club?.id || null);
      setSelectedMemberIds([]);
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
    if (!menuClub?.id) return;
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
    if (!menuClub?.id) return;
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
    if (!selectedMemberIds.length) {
      enqueueSnackbar("Select at least one member", { variant: "warning" });
      return;
    }

    const results = await Promise.allSettled(
      selectedMemberIds.map((userId: any) =>
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
        { variant: "success" },
      );
      await refetchSelectedClub();
    }
    if (failedCount > 0) {
      enqueueSnackbar(
        `${failedCount} assignment${failedCount > 1 ? "s" : ""} failed`,
        { variant: "error" },
      );
      return;
    }

    closeDialog();
  };

  const handleRemoveMember = async (member: any) => {
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
              <Shield size={15} color="rgba(255,255,255,0.7)" />
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
              Clubs
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
            Manage clubs, heads, and member assignments
          </Typography>
        </Box>
        <InlineBtn onClick={() => openDialog("create")} icon={<Plus size={14} />}>
          New Club
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
            label: "Total Clubs",
            value: clubs.length,
            color: "rgba(255,255,255,0.7)",
          },
          {
            label: "Active Clubs",
            value: clubs.filter((c) => c.isActive !== false).length,
            color: "#4ade80",
          },
          {
            label: "Total Members",
            value: clubs.reduce((sum, c) => sum + (c.membersCount || 0), 0),
            color: "#c084fc",
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

      {/* Search */}
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
            placeholder="Search clubs…"
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
          {filteredClubs.length} result{filteredClubs.length !== 1 ? "s" : ""}
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
              "minmax(180px,1fr) minmax(120px,1fr) 120px 80px 44px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["Club", "Description", "Status", "Members", ""].map((h, i) => (
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

          {filteredClubs.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No clubs found
              </Typography>
            </Box>
          ) : (
            filteredClubs.map((club, idx) => (
              <Box key={club.id}>
                <Box
                  onClick={() => openDialog("viewMembers", club)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(180px,1fr) minmax(120px,1fr) 120px 80px 44px",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    cursor: "pointer",
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(255,255,255,0.02)" },
                  }}
                >
                  {/* Name */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "9px",
                        flexShrink: 0,
                        background: "rgba(168,85,247,0.08)",
                        border: "1px solid rgba(168,85,247,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Shield size={14} color="#c084fc" />
                    </Box>
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
                      {club.name}
                    </Typography>
                  </Box>

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.28)",
                      fontFamily: "'Syne', sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      pr: 2,
                    }}
                  >
                    {club.description || "—"}
                  </Typography>

                  {/* Status */}
                  <Box>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        px: 1,
                        py: 0.3,
                        borderRadius: "5px",
                        border:
                          club.isActive === false
                            ? "1px solid rgba(248,113,113,0.25)"
                            : "1px solid rgba(74,222,128,0.25)",
                        background:
                          club.isActive === false
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(74,222,128,0.08)",
                      }}
                    >
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background:
                            club.isActive === false ? "#f87171" : "#4ade80",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontFamily: "'DM Mono', monospace",
                          color:
                            club.isActive === false ? "#f87171" : "#4ade80",
                          letterSpacing: "0.05em",
                          lineHeight: 1,
                        }}
                      >
                        {club.isActive === false ? "INACTIVE" : "ACTIVE"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Members count */}
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {club.membersCount ?? 0}
                  </Typography>

                  {/* Actions */}
                  <IconButton
                    size="small"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setAnchorEl(e.currentTarget);
                      setMenuClub(club);
                    }}
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
                {idx < filteredClubs.length - 1 && <RowDivider />}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setMenuClub(null);
        }}
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
          onClick={() => openDialog("members", menuClub)}
          icon={<UserPlus2 size={14} />}
        >
          Add Members
        </CtxItem>
        <CtxItem
          onClick={() => openDialog("edit", menuClub)}
          icon={<Pencil size={14} />}
        >
          Edit
        </CtxItem>
        <CtxItem
          onClick={() => openDialog("delete", menuClub)}
          color="#f87171"
          icon={<Trash2 size={14} />}
        >
          Delete
        </CtxItem>
      </Menu>

      {/* Create / Edit dialog */}
      <DarkDialog
        open={dialogOpen && (dialogType === "create" || dialogType === "edit")}
        onClose={closeDialog}
        title={dialogType === "create" ? "New Club" : "Edit Club"}
      >
        <DarkInput
          value={name}
          onChange={(e: any) => setName(e.target.value)}
          placeholder="Club name"
          style={{ marginBottom: 12 }}
        />
        <DarkTextarea
          rows={3}
          value={description}
          onChange={(e: any) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mt: 2,
            mb: 0.75,
          }}
        >
          Logo URL
        </Typography>
        <DarkInput
          value={logoUrl}
          onChange={(e: any) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          style={{ marginBottom: 12 }}
        />
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          Status
        </Typography>
        <select
          value={isActive ? "ACTIVE" : "INACTIVE"}
          onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
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
          }}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          {dialogType === "create" ? (
            <PrimaryBtn
              onClick={handleCreate}
              disabled={!name.trim()}
              loading={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              onClick={handleUpdate}
              disabled={!name.trim()}
              loading={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating…" : "Update"}
            </PrimaryBtn>
          )}
        </BtnRow>
      </DarkDialog>

      {/* Delete dialog */}
      <DarkDialog
        open={dialogOpen && dialogType === "delete"}
        onClose={closeDialog}
        title="Delete Club"
      >
        <DangerNote>This action is permanent and cannot be undone.</DangerNote>
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Delete <strong style={{ color: "#e4e4e7" }}>{menuClub?.name}</strong>?
        </Typography>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <DangerBtn
            onClick={handleDelete}
            disabled={!menuClub?.id}
            loading={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </DangerBtn>
        </BtnRow>
      </DarkDialog>

      {/* Add Members dialog */}
      <DarkDialog
        open={dialogOpen && dialogType === "members"}
        onClose={closeDialog}
        title="Add Members"
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
            mb: 2,
          }}
        >
          {menuClub?.name}
        </Typography>

        {/* Role selector */}
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          Role
        </Typography>
        <select
          value={memberRole}
          onChange={(e) => setMemberRole(e.target.value)}
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
            marginBottom: 16,
          }}
        >
          {CLUB_MEMBER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Member search */}
        <Box sx={{ position: "relative", mb: 1.5 }}>
          <Box
            sx={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <Search size={12} color="rgba(255,255,255,0.25)" />
          </Box>
          <input
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Filter members…"
            style={{
              width: "100%",
              padding: "8px 12px 8px 30px",
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

        {/* Checklist */}
        <Box
        data-lenis-prevent
          sx={{
            maxHeight: 280,
            overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
          }}
        >
          {volunteersLoading || clubHeadsLoading || selectedClubLoading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                Loading…
              </Typography>
            </Box>
          ) : filteredMembers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {availableMembers.length === 0
                  ? "All members are already added"
                  : "No members found"}
              </Typography>
            </Box>
          ) : (
            filteredMembers.map((u, idx) => {
              const checked = selectedMemberIds.includes(u.id);
              return (
                <Box key={u.id}>
                  <Box
                    onClick={() =>
                      setSelectedMemberIds((prev: any) =>
                        checked
                          ? prev.filter((id: any) => id !== u.id)
                          : [...prev, u.id],
                      )
                    }
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      transition: "background 0.1s",
                      background: checked
                        ? "rgba(168,85,247,0.06)"
                        : "transparent",
                      "&:hover": {
                        background: checked
                          ? "rgba(168,85,247,0.09)"
                          : "rgba(255,255,255,0.02)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "4px",
                        flexShrink: 0,
                        border: checked
                          ? "1px solid rgba(168,85,247,0.6)"
                          : "1px solid rgba(255,255,255,0.15)",
                        background: checked
                          ? "rgba(168,85,247,0.25)"
                          : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "2px",
                            background: "#c084fc",
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#e4e4e7",
                          fontFamily: "'Syne', sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {u.name || "—"}
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
                        {u.email}
                      </Typography>
                    </Box>
                    {u.role === "CH" && (
                      <Box
                        sx={{
                          flexShrink: 0,
                          px: 1,
                          py: 0.3,
                          borderRadius: "5px",
                          border: "1px solid rgba(45,212,191,0.3)",
                          background: "rgba(20,184,166,0.08)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 9,
                            fontFamily: "'DM Mono', monospace",
                            color: "#2dd4bf",
                            letterSpacing: "0.05em",
                            lineHeight: 1,
                          }}
                        >
                          CH
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {idx < filteredMembers.length - 1 && (
                    <Box
                      sx={{
                        height: "1px",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>
        {selectedMemberIds.length > 0 && (
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
              mt: 1,
            }}
          >
            {selectedMemberIds.length} selected
          </Typography>
        )}
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <PrimaryBtn
            onClick={handleAssignMembers}
            disabled={!menuClub?.id || selectedMemberIds.length === 0}
            loading={assignMemberMutation.isPending}
          >
            {assignMemberMutation.isPending
              ? "Adding…"
              : `Add ${selectedMemberIds.length || ""} Member${selectedMemberIds.length !== 1 ? "s" : ""}`}
          </PrimaryBtn>
        </BtnRow>
      </DarkDialog>

      {/* View Members dialog */}
      <DarkDialog
        open={dialogOpen && dialogType === "viewMembers"}
        onClose={closeDialog}
        title={menuClub?.name ? `${menuClub.name} — Members` : "Club Members"}
      >
        {selectedClubLoading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Loading…
            </Typography>
          </Box>
        ) : (selectedClub?.members?.length || 0) === 0 ? (
          <Typography
            sx={{
              py: 2,
              fontSize: 13,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            No members assigned yet.
          </Typography>
        ) : (
          <Box
          data-lenis-prevent
            sx={{
              maxHeight: 360,
              overflowY: "auto",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
            }}
          >
            {selectedClub?.members?.map((member: any, idx: any) => {
              const isHead = member.role === "HEAD";
              const sysRole = member.user?.role;
              return (
                <Box key={member.id || `${member.userId}-${idx}`}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: 2,
                      py: 1.75,
                      background: isHead
                        ? "rgba(168,85,247,0.04)"
                        : "transparent",
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#e4e4e7",
                          fontFamily: "'Syne', sans-serif",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {member.user?.name ||
                          member.user?.email ||
                          "Unknown user"}
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
                        {member.user?.email || "—"}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      {sysRole && (
                        <Box
                          sx={{
                            px: 1,
                            py: 0.3,
                            borderRadius: "5px",
                            border:
                              sysRole === "CH"
                                ? "1px solid rgba(45,212,191,0.3)"
                                : "1px solid rgba(255,255,255,0.08)",
                            background:
                              sysRole === "CH"
                                ? "rgba(20,184,166,0.08)"
                                : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontFamily: "'DM Mono', monospace",
                              color:
                                sysRole === "CH"
                                  ? "#2dd4bf"
                                  : "rgba(255,255,255,0.35)",
                              letterSpacing: "0.03em",
                              lineHeight: 1,
                            }}
                          >
                            {ROLE_LABEL[sysRole] ?? sysRole}
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          px: 1,
                          py: 0.3,
                          borderRadius: "5px",
                          border: isHead
                            ? "1px solid rgba(168,85,247,0.35)"
                            : "1px solid rgba(255,255,255,0.08)",
                          background: isHead
                            ? "rgba(168,85,247,0.12)"
                            : "rgba(255,255,255,0.04)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontFamily: "'DM Mono', monospace",
                            color: isHead
                              ? "#c084fc"
                              : "rgba(255,255,255,0.35)",
                            letterSpacing: "0.03em",
                            lineHeight: 1,
                          }}
                        >
                          {member.role || "MEMBER"}
                        </Typography>
                      </Box>
                      <DangerBtn
                        onClick={() => handleRemoveMember(member)}
                        loading={
                          removeMemberMutation.isPending &&
                          removingUserId === member.userId
                        }
                        disabled={
                          removeMemberMutation.isPending &&
                          removingUserId !== member.userId
                        }
                      >
                        {removeMemberMutation.isPending &&
                          removingUserId === member.userId
                          ? "Removing…"
                          : "Remove"}
                      </DangerBtn>
                    </Box>
                  </Box>
                  {idx < selectedClub.members.length - 1 && (
                    <Box
                      sx={{
                        height: "1px",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Close</GhostBtn>
        </BtnRow>
      </DarkDialog>
    </Box>
  );
}

/* ── Primitives ── */

const RowDivider = () => (
  <Box sx={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
);

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

function DarkInput({ type = "text", value, onChange, placeholder, style = {}, ...rest }: any) {
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

function CtxItem({ onClick, icon, color = "rgba(255,255,255,0.65)", children }: any) {
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

function InlineBtn({ onClick, icon, children }: any) {
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

function GhostBtn({ onClick, children, loading, disabled }: any) {
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

function PrimaryBtn({ onClick, children, disabled, loading }: any) {
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

function DangerBtn({ onClick, children, disabled, loading }: any) {
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
