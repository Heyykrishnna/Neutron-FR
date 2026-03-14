"use client";

import { Chip } from "@mui/material";

const roleConfig = {
  SA: {
    label: "Super Admin",
    color: "#a855f7",
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  DH: {
    label: "Department Head",
    color: "#3b82f6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  VH: {
    label: "Volunteer Head",
    color: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  V: {
    label: "Volunteer",
    color: "#a1a1aa",
    backgroundColor: "rgba(161, 161, 170, 0.1)",
  },
};

export function RoleBadge({ role }) {
  const config = roleConfig[role] || roleConfig.V;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.backgroundColor,
        borderColor: config.color,
        border: "1px solid",
      }}
    />
  );
}
