"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  CircularProgress,
} from "@mui/material";

const roleSchema = z.object({
  role: z.enum(["SA", "DH", "VH", "V"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

const roles = [
  { value: "SA", label: "Super Admin" },
  { value: "DH", label: "Department Head" },
  { value: "VH", label: "Volunteer Head" },
  { value: "V", label: "Volunteer" },
];

export function UserRoleForm({ currentRole, onSubmit, loading, onCancel }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: currentRole || "V",
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.role} sx={{ mb: 3 }}>
            <InputLabel>User Role</InputLabel>
            <Select {...field} label="User Role" disabled={loading}>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
            {errors.role && (
              <FormHelperText>{errors.role.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={16} />}
        >
          Update Role
        </Button>
      </Box>
    </Box>
  );
}
