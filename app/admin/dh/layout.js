"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
import { useDHDepartmentMembers } from "@/src/hooks/api/useUsers";

export default function DHLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasAccess = user?.role === "DH" || user?.role === "SA";
  const isDH = user?.role === "DH";

  const {
    isLoading: departmentLoading,
    isError: departmentError,
    error: departmentErrorObject,
  } = useDHDepartmentMembers(mounted && !!user && isDH);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !hasAccess)) {
      router.replace("/admin/auth");
    }
  }, [user, loading, router, hasAccess]);

  useEffect(() => {
    if (!mounted || !isDH || departmentLoading) return;

    if (departmentError) {
      const errorCode = departmentErrorObject?.response?.data?.error;
      const errorMessage = departmentErrorObject?.response?.data?.message || "";
      const isNoDepartmentAssigned =
        errorCode === "NO_DEPARTMENT_ASSIGNED" ||
        /no department/i.test(errorMessage);

      if (isNoDepartmentAssigned) {
        router.replace("/admin/auth");
      }
    }
  }, [
    mounted,
    isDH,
    departmentLoading,
    departmentError,
    departmentErrorObject,
    router,
  ]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!mounted || loading || (isDH && departmentLoading)) {
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
        {mounted && <CircularProgress sx={{ color: "#fff" }} />}
      </Box>
    );
  }

  if (!user || !hasAccess || (isDH && departmentError)) {
    return null;
  }

  const navigation = getAdminNavigation(user.role);
  const currentPage = pathname.startsWith("/admin/settings")
    ? "Personal Settings"
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
