"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  IconButton,
  Typography,
  Avatar,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Users,
  Building2,
  ShieldCheck,
  Settings,
  Trophy,
  Star,
  UserCheck,
  LogOut,
  X,
  ChevronRight,
  ClipboardList,
  UserCog,
  FileText,
  AlertTriangle,
  Megaphone,
  UserCircle2,
} from "lucide-react";

const SA_NAVIGATION = [
  { name: "Users", href: "/admin/sa/users", icon: Users },
  { name: "Departments", href: "/admin/sa/departments", icon: Building2 },
  { name: "Clubs", href: "/admin/sa/clubs", icon: UserCircle2 },
  {
    name: "Campus Ambassadors",
    href: "/admin/sa/campus-ambassadors",
    icon: Star,
  },
  { name: "Requests", href: "/admin/sa/approvals", icon: ShieldCheck },
  { name: "Audit Logs", href: "/admin/sa/audit", icon: ClipboardList },
  { name: "Campaign Manager", href: "/admin/sa/campaigns", icon: Megaphone },
];

const DH_NAVIGATION = [
  { name: "My Department", href: "/admin/dh/users", icon: Users },

  {
    name: "Registrations",
    href: "/admin/dh/registrations",
    icon: ClipboardList,
  },
  { name: "Competitions", href: "/admin/dh/competitions", icon: Trophy },
  { name: "Issues", href: "/admin/dh/issues", icon: AlertTriangle },
  { name: "My Requests", href: "/admin/dh/requests", icon: ShieldCheck },
];

const SA_DH_NAVIGATION = DH_NAVIGATION.filter(
  (item) =>
    item.href !== "/admin/dh/users" &&
    item.href !== "/admin/club" &&
    item.href !== "/admin/dh/requests",
);

const SHARED_NAVIGATION = [
  { name: "Forms", href: "/admin/dh/competitions/forms", icon: FileText },
];

const JUDGE_NAVIGATION = [
  { name: "My Competitions", href: "/admin/judge/competitions", icon: Trophy },
];

const CH_NAVIGATION = [
  { name: "Club", href: "/admin/club", icon: UserCircle2 },
  { name: "My Requests", href: "/admin/club/requests", icon: ShieldCheck },
];

export const SIDEBAR_WIDTH = 272;

export function getAdminNavigation(role: any) {
  if (role === "SA") {
    return [...SA_NAVIGATION, ...SA_DH_NAVIGATION, ...SHARED_NAVIGATION];
  }

  if (role === "DH") {
    return [...DH_NAVIGATION, ...SHARED_NAVIGATION];
  }

  if (role === "JUDGE") {
    return JUDGE_NAVIGATION;
  }

  if (role === "CH") {
    return CH_NAVIGATION;
  }

  return [];
}

export function getAdminSettingsLink(role: any) {
  if (role === "SA") {
    return {
      name: "Platform Settings",
      href: "/admin/sa/settings",
      icon: UserCog,
    };
  }

  return null;
}

export function getPersonalSettingsLink(role: any) {
  if (role === "SA" || role === "DH" || role === "JUDGE" || role === "CH") {
    return {
      name: "Personal Settings",
      href: "/admin/settings",
      icon: Settings,
    };
  }

  return null;
}

// Thin accent line that runs the full height on the right edge
const RightEdge = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      right: 0,
      width: "1px",
      height: "100%",
      background:
        "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)",
      pointerEvents: "none",
      zIndex: 10,
    }}
  />
);

export function Sidebar({ user, onLogout, mobileOpen, onMobileClose }: any) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const navigation = getAdminNavigation(user?.role);
  const settingsLink = getAdminSettingsLink(user?.role);
  const personalSettingsLink = getPersonalSettingsLink(user?.role);
  const roleLabel =
    user?.role === "SA"
      ? "Super Admin"
      : user?.role === "JUDGE"
        ? "Judge"
        : user?.role === "CH"
          ? "Club Head"
          : "Department Head";

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#080808",
        position: "relative",
      }}
    >
      <RightEdge />

      {/* ── Header ── */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 20,
            right: 20,
            height: "1px",
            background: "rgba(255,255,255,0.06)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Logomark: layered squares with a glow */}
          <Box
            sx={{
              position: "relative",
              width: 36,
              height: 36,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "9px",
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Custom N mark — two diagonal lines */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 15V3L9 12V3M9 12V15M9 3L15 15V3"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{
                color: "#f4f4f5",
                fontWeight: 600,
                fontSize: 15,
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}
            >
              Neutron
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 10,
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                lineHeight: 1,
                mt: 0.4,
              }}
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        {isMobile && (
          <IconButton
            onClick={onMobileClose}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.3)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              width: 30,
              height: 30,
              "&:hover": {
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.15)",
              },
            }}
          >
            <X size={14} />
          </IconButton>
        )}
      </Box>

      {/* ── Section label ── */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography
          sx={{
            fontSize: 9.5,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Navigation
        </Typography>
      </Box>

      {/* ── Nav ── */}
      <Box
        data-lenis-prevent
        sx={{
          flex: 1,
          px: 2,
          pb: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {navigation.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.name}
              onClick={isMobile ? onMobileClose : undefined}
            />
          ))}
        </List>
      </Box>

      {/* ── User + Logout ── */}
      <Box
        sx={{
          p: 2,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 20,
            right: 20,
            height: "1px",
            background: "rgba(255,255,255,0.06)",
          },
        }}
      >
        {/* User chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            mb: 1,
            transition: "background 0.15s",
            cursor: "default",
            "&:hover": { background: "rgba(255,255,255,0.05)" },
          }}
        >
          <Avatar src="/images/bg.jpeg" sx={{ width: 32, height: 32 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: "#e4e4e7",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Syne', sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
              }}
            >
              {user?.name || "User"}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "0.03em",
              }}
            >
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>

        {settingsLink && (
          <Box sx={{ mb: 1 }}>
            <SidebarNavItem
              href={settingsLink.href}
              icon={settingsLink.icon}
              label={settingsLink.name}
              onClick={isMobile ? onMobileClose : undefined}
            />
          </Box>
        )}

        {personalSettingsLink && (
          <Box sx={{ mb: 1 }}>
            <SidebarNavItem
              href={personalSettingsLink.href}
              icon={personalSettingsLink.icon}
              label={personalSettingsLink.name}
              onClick={isMobile ? onMobileClose : undefined}
            />
          </Box>
        )}

        {/* Logout */}
        <Button
          fullWidth
          onClick={onLogout}
          startIcon={<LogOut size={14} />}
          sx={{
            justifyContent: "flex-start",
            px: 2,
            py: 1.2,
            borderRadius: "10px",
            color: "rgba(255,90,90,0.7)",
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: "0.02em",
            border: "1px solid transparent",
            transition: "all 0.15s",
            "&:hover": {
              background: "rgba(239,68,68,0.07)",
              borderColor: "rgba(239,68,68,0.15)",
              color: "#f87171",
            },
          }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            background: "#080808",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", lg: "block" },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            boxSizing: "border-box",
            background: "#080808",
            border: "none",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

// ── Inline nav item (replaces NavLink for full style control) ──
function SidebarNavItem({ href, icon: Icon, label, onClick }: any) {
  const pathname = usePathname();
  const isFormsRoute = pathname === "/admin/dh/competitions/forms";
  const isFormsChildRoute = pathname.startsWith(
    "/admin/dh/competitions/forms/",
  );
  const active =
    (pathname === href || pathname.startsWith(`${href}/`)) &&
    !(href === "/admin/dh/competitions" && (isFormsRoute || isFormsChildRoute));

  return (
    <Box
      component={Link}
      href={href}
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderRadius: "9px",
        textDecoration: "none",
        position: "relative",
        transition: "all 0.15s",
        border: "1px solid transparent",
        ...(active
          ? {
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.08)",
              "& .nav-icon": { color: "#fff" },
              "& .nav-label": { color: "#f4f4f5" },
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: "2px",
                borderRadius: "0 2px 2px 0",
                background: "rgba(255,255,255,0.6)",
              },
            }
          : {
              "& .nav-icon": { color: "rgba(255,255,255,0.3)" },
              "& .nav-label": { color: "rgba(255,255,255,0.45)" },
              "&:hover": {
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.05)",
                "& .nav-icon": { color: "rgba(255,255,255,0.7)" },
                "& .nav-label": { color: "rgba(255,255,255,0.8)" },
              },
            }),
      }}
    >
      <Box
        className="nav-icon"
        sx={{ display: "flex", transition: "color 0.15s", flexShrink: 0 }}
      >
        <Icon size={16} />
      </Box>
      <Typography
        className="nav-label"
        sx={{
          fontSize: 13,
          fontWeight: active ? 500 : 400,
          fontFamily: "'Syne', sans-serif",
          letterSpacing: "0.02em",
          transition: "color 0.15s",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
