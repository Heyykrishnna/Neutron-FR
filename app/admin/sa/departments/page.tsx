"use client";

import { useState, useMemo } from "react";
import {
  useDepartments,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useAssignUserToDepartment,
  useRemoveUserFromDepartment,
} from "@/src/hooks/api/useDepartments";
import { useUsers } from "@/src/hooks/api/useUsers";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Typography,
} from "@mui/material";
import {
  Building2,
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
import { LoadingState } from "@/src/components/LoadingState";

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: departmentHeads = [], isLoading: isDeptHeadsLoading } =
    useUsers({ role: "DH", limit: 100 });
  const { data: volunteers = [], isLoading: isVolunteersLoading } = useUsers({
    role: "VOLUNTEER",
    limit: 500,
  });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const assignMemberMutation = useAssignUserToDepartment();
  const removeMemberMutation = useRemoveUserFromDepartment();

  const { enqueueSnackbar } = useSnackbar();

  const [searchQuery, setSearchQuery] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuDept, setMenuDept] = useState<any>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deptHeadIds, setDeptHeadIds] = useState<any>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<any>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<any>(null);
  const [removingUserId, setRemovingUserId] = useState(null);

  const {
    data: selectedDepartment,
    isLoading: isDepartmentDetailsLoading,
    refetch: refetchDepartmentDetails,
  } = useDepartment(selectedDepartmentId) as any;

  const getErrorMessage = (error: any, fallbackMessage: any) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept: any) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [departments, searchQuery]);

  const handleMenuOpen = (event: any, dept: any) => {
    setAnchorEl(event.currentTarget);
    setMenuDept(dept);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openDialog = (type: any, dept: any = null) => {
    setDialogType(type);
    setMenuDept(dept);

    if (type === "members") {
      setSelectedVolunteerIds([]);
      setSelectedDepartmentId(dept?.id || null);
      setDialogOpen(true);
      handleMenuClose();
      return;
    }

    if (type === "viewMembers") {
      setSelectedDepartmentId(dept?.id || null);
      setDialogOpen(true);
      handleMenuClose();
      return;
    }

    if (dept) {
      setName(dept.name);
      setDescription(dept.description || "");
      if (Array.isArray(dept.deptHeadIds)) {
        setDeptHeadIds(dept.deptHeadIds.filter(Boolean));
      } else if (Array.isArray(dept.deptHeads)) {
        setDeptHeadIds(dept.deptHeads.map((head: any) => head?.id).filter(Boolean));
      } else {
        setDeptHeadIds([dept.deptHead?.id || dept.deptHeadId].filter(Boolean));
      }
    } else {
      setName("");
      setDescription("");
      setDeptHeadIds([]);
    }

    setDialogOpen(true);
    handleMenuClose();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setMenuDept(null);
    setName("");
    setDescription("");
    setDeptHeadIds([]);
    setSelectedVolunteerIds([]);
    setSelectedDepartmentId(null);
    setRemovingUserId(null);
    setVolunteerSearch("");
    setDeptHeadSearch("");
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name,
        description,
        deptHeadIds: deptHeadIds.length ? deptHeadIds : undefined,
      });

      enqueueSnackbar("Department created", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to create department"), {
        variant: "error",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({
        deptId: menuDept.id,
        name,
        description,
        deptHeadIds,
      });

      enqueueSnackbar("Department updated", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to update department"), {
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!menuDept?.id) {
      enqueueSnackbar("No department selected for deletion", {
        variant: "error",
      });
      return;
    }

    try {
      await deleteMutation.mutateAsync(menuDept.id);

      enqueueSnackbar("Department deleted", { variant: "success" });
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to delete department"), {
        variant: "error",
      });
    }
  };

  const handleAssignMembers = async () => {
    if (!menuDept?.id) {
      enqueueSnackbar("No department selected", { variant: "error" });
      return;
    }

    if (!selectedVolunteerIds.length) {
      enqueueSnackbar("Select at least one volunteer", { variant: "warning" });
      return;
    }

    const results = await Promise.allSettled(
      selectedVolunteerIds.map((userId: any) =>
        assignMemberMutation.mutateAsync({
          departmentId: menuDept.id,
          userId,
        }),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      enqueueSnackbar(
        `${successCount} member${successCount > 1 ? "s" : ""} added`,
        {
          variant: "success",
        },
      );
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

    await refetchDepartmentDetails();

    closeDialog();
  };

  const handleOpenDepartmentMembers = (dept: any) => {
    openDialog("viewMembers", dept);
  };

  const handleRemoveMember = async (member: any) => {
    if (!selectedDepartmentId || !member?.userId) return;

    try {
      setRemovingUserId(member.userId);
      await removeMemberMutation.mutateAsync({
        departmentId: selectedDepartmentId,
        userId: member.userId,
      });
      enqueueSnackbar("Member removed", { variant: "success" });
      await refetchDepartmentDetails();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, "Failed to remove member"), {
        variant: "error",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const selectedVolunteerNames = useMemo(() => {
    const selectedSet = new Set(selectedVolunteerIds);
    return volunteers
      .filter((volunteer: any) => selectedSet.has(volunteer.id))
      .map((volunteer: any) => volunteer.name || volunteer.email);
  }, [selectedVolunteerIds, volunteers]);

  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [deptHeadSearch, setDeptHeadSearch] = useState("");

  const existingMemberIds = useMemo(() => {
    const members = selectedDepartment?.members || [];
    return new Set(members.map((member: any) => member?.userId).filter(Boolean));
  }, [selectedDepartment?.members]);

  const availableVolunteers = useMemo(() => {
    if (dialogType !== "members") return volunteers;
    return volunteers.filter(
      (volunteer) => !existingMemberIds.has(volunteer.id),
    );
  }, [dialogType, existingMemberIds, volunteers]);

  const filteredVolunteers = useMemo(() => {
    if (!volunteerSearch) return availableVolunteers;
    const q = volunteerSearch.toLowerCase();
    return availableVolunteers.filter(
      (v) =>
        (v.name || "").toLowerCase().includes(q) ||
        (v.email || "").toLowerCase().includes(q),
    );
  }, [availableVolunteers, volunteerSearch]);

  const filteredDeptHeads = useMemo(() => {
    if (!deptHeadSearch) return departmentHeads;
    const q = deptHeadSearch.toLowerCase();
    return departmentHeads.filter(
      (h: any) =>
        (h.name || "").toLowerCase().includes(q) ||
        (h.email || "").toLowerCase().includes(q),
    );
  }, [departmentHeads, deptHeadSearch]);

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
              <Building2 size={15} color="rgba(255,255,255,0.7)" />
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
              Departments
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
            Manage departments, heads, and member assignments
          </Typography>
        </Box>
        <InlineBtn
          onClick={() => openDialog("create")}
          icon={<Plus size={14} />}
        >
          New Department
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
            label: "Total Departments",
            value: departments.length,
            color: "rgba(255,255,255,0.7)",
          },
          {
            label: "With Heads Assigned",
            value: departments.filter((d) => {
              const count =
                d.deptHeadIds?.length ??
                d.deptHeads?.length ??
                (d.deptHead ? 1 : 0);
              return count > 0;
            }).length,
            color: "#c084fc",
          },
          {
            label: "Total Members",
            value: departments.reduce(
              (sum, d) => sum + (d.membersCount ?? d.members?.length ?? 0),
              0,
            ),
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
            placeholder="Search departments…"
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
          {filteredDepartments.length} result
          {filteredDepartments.length !== 1 ? "s" : ""}
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
              "minmax(180px,1fr) minmax(120px,1fr) 160px 80px 44px",
            px: 3,
            py: 1.5,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {["Department", "Description", "Heads", "Members", ""].map((h, i) => (
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

          {filteredDepartments.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No departments found
              </Typography>
            </Box>
          ) : (
            filteredDepartments.map((dept: any, idx: any) => (
              <Box key={dept.id}>
                <Box
                  onClick={() => handleOpenDepartmentMembers(dept)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(180px,1fr) minmax(120px,1fr) 160px 80px 44px",
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
                      <Building2 size={14} color="#c084fc" />
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
                      {dept.name}
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
                    {dept.description || "—"}
                  </Typography>

                  {/* Heads */}
                  <Box>
                    {(dept.deptHeads?.length || 0) > 0 ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#c084fc",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#c084fc",
                            fontFamily: "'DM Mono', monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {dept.deptHeads[0].name || dept.deptHeads[0].email}
                          {dept.deptHeads.length > 1
                            ? ` +${dept.deptHeads.length - 1}`
                            : ""}
                        </Typography>
                      </Box>
                    ) : dept.deptHead ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#c084fc",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#c084fc",
                            fontFamily: "'DM Mono', monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {dept.deptHead.name || dept.deptHead.email}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.18)",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        Unassigned
                      </Typography>
                    )}
                  </Box>

                  {/* Members count */}
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {dept.membersCount ?? dept.members?.length ?? 0}
                  </Typography>

                  {/* Actions */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, dept);
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
                {idx < filteredDepartments.length - 1 && <RowDivider />}
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
          onClick={() => openDialog("members", menuDept)}
          icon={<UserPlus2 size={14} />}
        >
          Add Members
        </CtxItem>
        <CtxItem
          onClick={() => openDialog("edit", menuDept)}
          icon={<Pencil size={14} />}
        >
          Edit
        </CtxItem>
        <CtxItem
          onClick={() => openDialog("delete", menuDept)}
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
        title={dialogType === "create" ? "New Department" : "Edit Department"}
      >
        <DarkInput
          value={name}
          onChange={(e: any) => setName(e.target.value)}
          placeholder="Department name"
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
            mt: 2,
            mb: 0.75,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Department Heads
        </Typography>
        {/* DH search */}
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
            value={deptHeadSearch}
            onChange={(e) => setDeptHeadSearch(e.target.value)}
            placeholder="Filter department heads…"
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
        {/* DH checklist */}
        <Box
        data-lenis-prevent
          sx={{
            maxHeight: 200,
            overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
          }}
        >
          {isDeptHeadsLoading ? (
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
          ) : filteredDeptHeads.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                No department heads found
              </Typography>
            </Box>
          ) : (
            filteredDeptHeads.map(( h:any, idx:any ) => {
              const checked = deptHeadIds.includes(h.id);
              return (
                <Box key={h.id}>
                  <Box
                    onClick={() =>
                      setDeptHeadIds((prev: any) =>
                        checked
                          ? prev.filter((id: any) => id !== h.id)
                          : [...prev, h.id],
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
                    <Box sx={{ minWidth: 0 }}>
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
                        {h.name || "—"}
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
                        {h.email}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < filteredDeptHeads.length - 1 && (
                    <Box
                      sx={{ height: "1px", background: "rgba(255,255,255,0.04)" }}
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>
        {deptHeadIds.length > 0 && (
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
              mt: 1,
            }}
          >
            {deptHeadIds.length} selected
          </Typography>
        )}
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
        title="Delete Department"
      >
        <DangerNote>This action is permanent and cannot be undone.</DangerNote>
        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Delete <strong style={{ color: "#e4e4e7" }}>{menuDept?.name}</strong>?
        </Typography>
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <DangerBtn
            onClick={handleDelete}
            disabled={!menuDept?.id}
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
          {menuDept?.name}
        </Typography>
        {/* Volunteer search */}
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
            value={volunteerSearch}
            onChange={(e) => setVolunteerSearch(e.target.value)}
            placeholder="Filter volunteers…"
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
          
          {isVolunteersLoading || isDepartmentDetailsLoading ? (
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
          ) : filteredVolunteers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {availableVolunteers.length === 0
                  ? "All volunteers are already added"
                  : "No volunteers found"}
              </Typography>
            </Box>
          ) : (
            filteredVolunteers.map((v, idx) => {
              const checked = selectedVolunteerIds.includes(v.id);
              return (
                <Box key={v.id}>
                  <Box
                    onClick={() =>
                      setSelectedVolunteerIds((prev: any) =>
                        checked
                          ? prev.filter((id: any) => id !== v.id)
                          : [...prev, v.id],
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
                    <Box sx={{ minWidth: 0 }}>
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
                        {v.name || "—"}
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
                        {v.email}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < filteredVolunteers.length - 1 && (
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
        {selectedVolunteerIds.length > 0 && (
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
              mt: 1,
            }}
          >
            {selectedVolunteerIds.length} selected
          </Typography>
        )}
        <BtnRow>
          <GhostBtn onClick={closeDialog}>Cancel</GhostBtn>
          <PrimaryBtn
            onClick={handleAssignMembers}
            disabled={!menuDept?.id || selectedVolunteerIds.length === 0}
            loading={assignMemberMutation.isPending}
          >
            {assignMemberMutation.isPending
              ? "Adding…"
              : `Add ${selectedVolunteerIds.length || ""} Member${selectedVolunteerIds.length !== 1 ? "s" : ""}`}
          </PrimaryBtn>
        </BtnRow>
      </DarkDialog>

      {/* View Members dialog */}
      <DarkDialog
        open={dialogOpen && dialogType === "viewMembers"}
        onClose={closeDialog}
        title={
          menuDept?.name ? `${menuDept.name} — Members` : "Department Members"
        }
      >
        {isDepartmentDetailsLoading ? (
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
        ) : (selectedDepartment?.members?.length || 0) === 0 ? (
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
            {(() => {
              const dhIdSet = new Set(
                (selectedDepartment.deptHeads || []).map((h: any) => h.id),
              );
              const sorted = [...selectedDepartment.members].sort(
                (a: any, b: any) =>
                  (dhIdSet.has(b.userId) ? 1 : 0) -
                  (dhIdSet.has(a.userId) ? 1 : 0),
              );
              const roleLabel: any = {
                SA: "Super Admin",
                BOARD: "Board",
                DH: "Dept Head",
                JUDGE: "Judge",
                VOLUNTEER: "Volunteer",
                USER: "User",
              };
              return sorted.map((member, idx) => {
                const isDH = dhIdSet.has(member.userId);
                const role = member.user?.role;
                return (
                  <Box key={member.id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 2,
                        py: 1.75,
                        background: isDH
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
                          {member.user?.name || member.user?.email || "Unknown"}
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
                      {role && (
                        <Box
                          sx={{
                            flexShrink: 0,
                            px: 1,
                            py: 0.3,
                            borderRadius: "5px",
                            border: isDH
                              ? "1px solid rgba(168,85,247,0.35)"
                              : "1px solid rgba(255,255,255,0.08)",
                            background: isDH
                              ? "rgba(168,85,247,0.12)"
                              : "rgba(255,255,255,0.04)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontFamily: "'DM Mono', monospace",
                              color: isDH
                                ? "#c084fc"
                                : "rgba(255,255,255,0.35)",
                              letterSpacing: "0.03em",
                              lineHeight: 1,
                            }}
                          >
                            {roleLabel[role] ?? role}
                          </Typography>
                        </Box>
                      )}
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
                    {idx < sorted.length - 1 && (
                      <Box
                        sx={{
                          height: "1px",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      />
                    )}
                  </Box>
                );
              });
            })()}
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

function MultiNativeSelect({ values, onChange, options, fullWidth, disabled }: any) {
  return (
    <select
      multiple
      value={values}
      disabled={disabled}
      onChange={(e) =>
        onChange(
          Array.from(e.target.selectedOptions).map((option) => option.value),
        )
      }
      size={Math.min(Math.max(options.length, 3), 8)}
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
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
}: any) {
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

function CtxItem({
  onClick,
  icon,
  color = "rgba(255,255,255,0.65)",
  children,
}: any) {
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
