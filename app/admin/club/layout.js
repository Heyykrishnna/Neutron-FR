"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMyClubs } from "@/src/hooks/api/useClub";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Menu } from "lucide-react";
import {
  Sidebar,
  SIDEBAR_WIDTH,
  getAdminNavigation,
} from "@/src/components/navigation/Sidebar";

export default function ClubLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: myClubs = [], isLoading: clubsLoading } = useMyClubs();

  const hasRole =
    user?.role === "SA" || user?.role === "DH" || user?.role === "JUDGE" || user?.role === "CH";
  // CH users get access by role alone; others need at least one club assigned
  const hasClubAccess =
    user?.role === "CH" ? hasRole : hasRole && myClubs.length > 0;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/auth");
      return;
    }

    if (!loading && user && !hasRole) {
      router.replace("/admin/auth");
      return;
    }

    if (!loading && !clubsLoading && user && hasRole && !hasClubAccess) {
      router.replace("/admin/dh");
    }
  }, [loading, clubsLoading, user, hasRole, hasClubAccess, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading || clubsLoading) {
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
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  if (!user || !hasClubAccess) {
    return null;
  }

  const navigation = getAdminNavigation(user.role);
  const currentPage = pathname.startsWith("/admin/settings")
    ? "Personal Settings"
    : pathname.startsWith("/admin/club")
      ? "Club"
      : navigation.find((item) => pathname.startsWith(item.href))?.name ||
        "Dashboard";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#000" }}>
      <Sidebar
        user={user}
        onLogout={logout}
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid #27272a",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { lg: "none" } }}
            >
              <Menu size={24} />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                display: { xs: "none", lg: "block" },
              }}
            >
              {currentPage}
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, lg: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
