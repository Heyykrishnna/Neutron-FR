"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListItemButton, ListItemIcon, ListItemText, Box } from "@mui/material";

export function NavLink({ href, icon: Icon, label, onClick }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref style={{ textDecoration: "none" }}>
      <ListItemButton
        onClick={onClick}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          backgroundColor: isActive
            ? "rgba(255, 255, 255, 0.08)"
            : "transparent",
          "&:hover": {
            backgroundColor: isActive
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.05)",
          },
          transition: "all 0.2s ease",
        }}
      >
        <ListItemIcon
          sx={{ minWidth: 40, color: isActive ? "#fff" : "#a1a1aa" }}
        >
          <Icon size={20} />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "#fff" : "#a1a1aa",
          }}
        />
      </ListItemButton>
    </Link>
  );
}
