"use client";

import { Chip } from "@mui/material";

const statusConfig = {
  active: {
    label: "Active",
    color: "success",
  },
  suspended: {
    label: "Suspended",
    color: "error",
  },
  revoked: {
    label: "Revoked",
    color: "error",
  },
  pending: {
    label: "Pending",
    color: "warning",
  },
  inactive: {
    label: "Inactive",
    color: "default",
  },
};

export function UserStatusChip({
  status,
  isSuspended = false,
  isRevoked = false,
}) {
  let resolvedStatus = status;

  if (!resolvedStatus) {
    if (isRevoked) {
      resolvedStatus = "revoked";
    } else if (isSuspended) {
      resolvedStatus = "suspended";
    } else {
      resolvedStatus = "active";
    }
  }

  const config =
    statusConfig[resolvedStatus?.toLowerCase()] || statusConfig.inactive;

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
}
