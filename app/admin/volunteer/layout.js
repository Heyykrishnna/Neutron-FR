"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  LayoutDashboard,
  UserCheck,
  QrCode,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const SIDEBAR_WIDTH = 240;

const NAV = [
  { name: "Dashboard", href: "/admin/volunteer", icon: LayoutDashboard },
  {
    name: "Mark Attendance",
    href: "/admin/volunteer/attendance",
    icon: UserCheck,
  },
  { name: "QR Scanner", href: "/admin/volunteer/scan", icon: QrCode },
  {
    name: "Escalate Issue",
    href: "/admin/volunteer/issues",
    icon: AlertTriangle,
  },
];

const ALLOWED_ROLES = new Set(["VOLUNTEER", "DH", "SA"]);

function SidebarContent({ user, pathname, onLogout, onClose }) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#060606",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo / title */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "8px",
              background: "rgba(168,85,247,0.15)",
              border: "1px solid rgba(168,85,247,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserCheck size={14} color="#c084fc" />
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Volunteer
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mx: 1.5, mb: 1 }} />

      {/* Nav items */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        {NAV.map(({ name, href, icon: Icon }) => {
          const active =
            href === "/admin/volunteer"
              ? pathname === "/admin/volunteer"
              : pathname.startsWith(href);
          return (
            <ListItem key={href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                href={href}
                onClick={onClose}
                sx={{
                  borderRadius: "8px",
                  py: 0.9,
                  px: 1.5,
                  backgroundColor: active
                    ? "rgba(168,85,247,0.12)"
                    : "transparent",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Icon
                    size={15}
                    color={active ? "#c084fc" : "rgba(255,255,255,0.4)"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: 13,
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: active ? 600 : 400,
                      color: active ? "#e9d5ff" : "rgba(255,255,255,0.55)",
                    },
                  }}
                />
                {active && (
                  <ChevronRight size={12} color="rgba(192,132,252,0.7)" />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider
        sx={{ borderColor: "rgba(255,255,255,0.05)", mx: 1.5, mb: 1.5 }}
      />

      {/* User + logout */}
      <Box sx={{ px: 2, pb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            mb: 1.5,
            p: 1,
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: 12,
              bgcolor: "rgba(168,85,247,0.25)",
              color: "#c084fc",
            }}
          >
            {(user?.name || "V")[0].toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "#f4f4f5",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {user?.name || "Volunteer"}
            </Typography>
            <Typography
              noWrap
              sx={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          startIcon={<LogOut size={14} />}
          onClick={onLogout}
          sx={{
            textTransform: "none",
            justifyContent: "flex-start",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Syne', sans-serif",
            borderRadius: "8px",
            py: 0.8,
            "&:hover": {
              backgroundColor: "rgba(239,68,68,0.08)",
              color: "#f87171",
            },
          }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

export default function VolunteerLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !ALLOWED_ROLES.has(user.role))) {
      router.replace("/admin/auth");
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
        }}
      >
        {mounted && <CircularProgress sx={{ color: "#a855f7" }} />}
      </Box>
    );
  }

  if (!user || !ALLOWED_ROLES.has(user.role)) return null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#000" }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
          }}
        >
          <SidebarContent
            user={user}
            pathname={pathname}
            onLogout={logout}
            onClose={() => {}}
          />
        </Box>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: { width: SIDEBAR_WIDTH, background: "transparent" },
          }}
        >
          <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
            <IconButton
              onClick={() => setMobileOpen(false)}
              sx={{ color: "rgba(255,255,255,0.5)" }}
            >
              <X size={18} />
            </IconButton>
          </Box>
          <SidebarContent
            user={user}
            pathname={pathname}
            onLogout={logout}
            onClose={() => setMobileOpen(false)}
          />
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          minHeight: "100vh",
          backgroundColor: "#000",
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              backgroundColor: "#060606",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Toolbar sx={{ minHeight: 52, px: 2 }}>
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{ color: "rgba(255,255,255,0.6)", mr: 1 }}
              >
                <Menu size={18} />
              </IconButton>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f4f4f5",
                  fontFamily: "'Syne', sans-serif",
                  flexGrow: 1,
                }}
              >
                Volunteer Panel
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        {children}
      </Box>
    </Box>
  );
}
