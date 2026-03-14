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
  Paper,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  List,
  ListItem,
  ListItemSecondaryAction,
  InputAdornment,
  CircularProgress,
} from "@mui/material";

import {
  Search as SearchIcon,
  MoreVert,
  Business,
  Add,
  GroupAdd,
  Edit,
  Delete,
} from "@mui/icons-material";

import { useSnackbar } from "notistack";
import { DataTable } from "@/src/components/DataTable";
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
  const [menuDept, setMenuDept] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);

  const {
    data: selectedDepartment,
    isLoading: isDepartmentDetailsLoading,
    refetch: refetchDepartmentDetails,
  } = useDepartment(selectedDepartmentId);

  const getErrorMessage = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [departments, searchQuery]);

  const handleMenuOpen = (event, dept) => {
    setAnchorEl(event.currentTarget);
    setMenuDept(dept);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openDialog = (type, dept = null) => {
    setDialogType(type);
    setMenuDept(dept);

    if (type === "members") {
      setSelectedVolunteerIds([]);
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
      setDeptHeadId(dept.deptHead?.id || dept.deptHeadId || "");
    } else {
      setName("");
      setDescription("");
      setDeptHeadId("");
    }

    setDialogOpen(true);
    handleMenuClose();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setMenuDept(null);
    setName("");
    setDescription("");
    setDeptHeadId("");
    setSelectedVolunteerIds([]);
    setSelectedDepartmentId(null);
    setRemovingUserId(null);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name,
        description,
        deptHeadId: deptHeadId || undefined,
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
        deptHeadId: deptHeadId || null,
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
      selectedVolunteerIds.map((userId) =>
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

  const handleOpenDepartmentMembers = (dept) => {
    openDialog("viewMembers", dept);
  };

  const handleRemoveMember = async (member) => {
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
      .filter((volunteer) => selectedSet.has(volunteer.id))
      .map((volunteer) => volunteer.name || volunteer.email);
  }, [selectedVolunteerIds, volunteers]);

  const columns = [
    {
      id: "name",
      label: "Department",
      render: (row) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Business />
          <Typography sx={{ fontWeight: 500 }}>{row.name}</Typography>
        </Box>
      ),
    },
    {
      id: "description",
      label: "Description",
      render: (row) => row.description || "—",
    },
    {
      id: "deptHead",
      label: "Department Head",
      render: (row) => row.deptHead?.name || "Not assigned",
    },
    {
      id: "members",
      label: "Members",
      render: (row) => row.membersCount ?? row.members?.length ?? 0,
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Departments
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog("create")}
        >
          Create Department
        </Button>
      </Box>

      {/* Search */}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search departments..."
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
      </Paper>

      {/* Table */}

      <DataTable
        columns={columns}
        data={filteredDepartments}
        onRowClick={handleOpenDepartmentMembers}
        emptyMessage="No departments found"
      />

      {/* Menu */}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => openDialog("members", menuDept)}>
          <GroupAdd sx={{ mr: 1 }} />
          Add Members
        </MenuItem>

        <MenuItem onClick={() => openDialog("edit", menuDept)}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => openDialog("delete", menuDept)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create / Edit Dialog */}

      <Dialog
        open={dialogOpen && (dialogType === "create" || dialogType === "edit")}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType === "create" ? "Create Department" : "Edit Department"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Department Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth>
            <InputLabel id="department-head-label">Department Head</InputLabel>
            <Select
              labelId="department-head-label"
              label="Department Head"
              value={deptHeadId}
              onChange={(e) => setDeptHeadId(e.target.value)}
              disabled={isDeptHeadsLoading}
            >
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>

              {departmentHeads.map((head) => (
                <MenuItem key={head.id} value={head.id}>
                  {head.name || head.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>

          {dialogType === "create" ? (
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={createMutation.isPending || !name.trim()}
              startIcon={
                createMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          ) : (
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={updateMutation.isPending || !name.trim()}
              startIcon={
                updateMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}

      <Dialog
        open={dialogOpen && dialogType === "delete"}
        onClose={closeDialog}
      >
        <DialogTitle>Delete Department</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete "{menuDept?.name}"?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || !menuDept?.id}
            startIcon={
              deleteMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add members */}

      <Dialog
        open={dialogOpen && dialogType === "members"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Members</DialogTitle>

        <DialogContent>
          <Typography
            sx={{ mb: 2, mt: 1 }}
            variant="body2"
            color="text.secondary"
          >
            Department: {menuDept?.name}
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="volunteers-multiselect-label">
              Volunteers
            </InputLabel>
            <Select
              multiple
              labelId="volunteers-multiselect-label"
              label="Volunteers"
              value={selectedVolunteerIds}
              onChange={(event) => setSelectedVolunteerIds(event.target.value)}
              disabled={isVolunteersLoading || assignMemberMutation.isPending}
              renderValue={() =>
                selectedVolunteerNames.length
                  ? selectedVolunteerNames.join(", ")
                  : "Select volunteers"
              }
            >
              {volunteers.map((volunteer) => (
                <MenuItem key={volunteer.id} value={volunteer.id}>
                  <Checkbox
                    checked={selectedVolunteerIds.includes(volunteer.id)}
                  />
                  <ListItemText
                    primary={volunteer.name || volunteer.email}
                    secondary={volunteer.email}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignMembers}
            disabled={
              assignMemberMutation.isPending ||
              !menuDept?.id ||
              selectedVolunteerIds.length === 0
            }
            startIcon={
              assignMemberMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {assignMemberMutation.isPending ? "Adding..." : "Add Members"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View members */}

      <Dialog
        open={dialogOpen && dialogType === "viewMembers"}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {menuDept?.name ? `${menuDept.name} Members` : "Department Members"}
        </DialogTitle>

        <DialogContent>
          {isDepartmentDetailsLoading ? (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : (selectedDepartment?.members?.length || 0) === 0 ? (
            <Typography sx={{ py: 2 }} color="text.secondary">
              No members assigned yet.
            </Typography>
          ) : (
            <List sx={{ pt: 0 }}>
              {selectedDepartment.members.map((member) => (
                <ListItem key={member.id} divider>
                  <ListItemText
                    primary={
                      member.user?.name || member.user?.email || "Unknown"
                    }
                    secondary={member.user?.email || "No email"}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      color="error"
                      size="small"
                      onClick={() => handleRemoveMember(member)}
                      disabled={
                        removeMemberMutation.isPending &&
                        removingUserId === member.userId
                      }
                      startIcon={
                        removeMemberMutation.isPending &&
                        removingUserId === member.userId ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : undefined
                      }
                    >
                      {removeMemberMutation.isPending &&
                      removingUserId === member.userId
                        ? "Removing..."
                        : "Remove"}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
