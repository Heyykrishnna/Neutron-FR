"use client";

import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  LayoutDashboard,
  UserCheck,
  QrCode,
  AlertTriangle,
  ShieldCheck,
  Trophy,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerAttendanceProfile } from "@/src/hooks/api/useAttendance";

const sy = { fontFamily: "'Syne', sans-serif" };

function SectionLabel({ children }) {
  return (
    <Typography
      sx={{
        fontSize: 9.5,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)",
        mb: 1.5,
        ...sy,
      }}
    >
      {children}
    </Typography>
  );
}

export default function VolunteerDashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useVolunteerAttendanceProfile();

  const isGateVolunteer = !!profile?.isRegistrationDeskVolunteer;
  const assignedComps = profile?.assignedCompetitions || [];
  const attendanceComps = assignedComps.filter(
    (ac) => ac.competition?.attendanceRequired,
  );
  const canMarkAttendance = isGateVolunteer || attendanceComps.length > 0;

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress sx={{ color: "#a855f7" }} size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 960 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
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
            <LayoutDashboard size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", ...sy }}
          >
            Dashboard
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: 12, color: "rgba(255,255,255,0.3)", ...sy, ml: 0.5 }}
        >
          Welcome back, {user?.name?.split(" ")[0] || "Volunteer"}
        </Typography>
      </Box>

      {/* Status cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          mb: 4,
        }}
      >
        <Paper
          sx={{
            p: 2.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography
            sx={{
              fontSize: 9.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              mb: 1.2,
              ...sy,
            }}
          >
            Gate Access
          </Typography>
          {isGateVolunteer ? (
            <Chip
              label="Active"
              size="small"
              icon={<ShieldCheck size={11} color="#4ade80" />}
              sx={{
                background: "rgba(34,197,94,0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.2)",
                fontSize: 11,
                ...sy,
              }}
            />
          ) : (
            <Chip
              label="Not assigned"
              size="small"
              sx={{
                background: "rgba(255,255,255,0.04)",
                color: "#71717a",
                fontSize: 11,
              }}
            />
          )}
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography
            sx={{
              fontSize: 9.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              mb: 1.2,
              ...sy,
            }}
          >
            Competitions
          </Typography>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: "#c084fc",
              lineHeight: 1,
              ...sy,
            }}
          >
            {assignedComps.length}
          </Typography>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography
            sx={{
              fontSize: 9.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              mb: 1.2,
              ...sy,
            }}
          >
            Attendance Duty
          </Typography>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: attendanceComps.length > 0 ? "#38bdf8" : "#71717a",
              lineHeight: 1,
              ...sy,
            }}
          >
            {attendanceComps.length}
          </Typography>
        </Paper>
      </Box>

      {/* Quick actions */}
      <Box sx={{ mb: 4 }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          flexWrap="wrap"
        >
          <Button
            component={canMarkAttendance ? Link : "button"}
            href={canMarkAttendance ? "/admin/volunteer/attendance" : undefined}
            disabled={!canMarkAttendance}
            variant="outlined"
            startIcon={<UserCheck size={14} />}
            sx={{
              textTransform: "none",
              ...sy,
              borderColor: canMarkAttendance
                ? "rgba(168,85,247,0.4)"
                : "rgba(255,255,255,0.08)",
              color: canMarkAttendance ? "#c084fc" : "rgba(255,255,255,0.2)",
              "&:hover": {
                borderColor: "rgba(168,85,247,0.7)",
                background: "rgba(168,85,247,0.06)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.18)",
              },
            }}
          >
            Mark Attendance
          </Button>
          <Button
            component={canMarkAttendance ? Link : "button"}
            href={canMarkAttendance ? "/admin/volunteer/scan" : undefined}
            disabled={!canMarkAttendance}
            variant="outlined"
            startIcon={<QrCode size={14} />}
            sx={{
              textTransform: "none",
              ...sy,
              borderColor: canMarkAttendance
                ? "rgba(255,255,255,0.18)"
                : "rgba(255,255,255,0.08)",
              color: canMarkAttendance ? "#e4e4e7" : "rgba(255,255,255,0.2)",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.03)",
              },
              "&.Mui-disabled": {
                borderColor: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.18)",
              },
            }}
          >
            QR Scanner
          </Button>
          <Button
            component={Link}
            href="/admin/volunteer/issues"
            variant="outlined"
            startIcon={<AlertTriangle size={14} />}
            sx={{
              textTransform: "none",
              ...sy,
              borderColor: "rgba(234,179,8,0.3)",
              color: "#fbbf24",
              "&:hover": {
                borderColor: "rgba(234,179,8,0.55)",
                background: "rgba(234,179,8,0.06)",
              },
            }}
          >
            Report Issue
          </Button>
        </Stack>
      </Box>

      {/* Assigned competitions */}
      {assignedComps.length > 0 ? (
        <Box>
          <SectionLabel>Assigned Competitions</SectionLabel>
          <Stack spacing={1}>
            {assignedComps.map((ac) => {
              const comp = ac.competition;
              return (
                <Paper
                  key={ac.id}
                  sx={{
                    p: 2,
                    background: "#0c0c0c",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f4f4f5",
                        mb: 0.4,
                        ...sy,
                      }}
                      noWrap
                    >
                      {comp?.title || "Unnamed Competition"}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        label={ac.role || "Volunteer"}
                        size="small"
                        sx={{
                          fontSize: 10,
                          height: 18,
                          background: "rgba(255,255,255,0.05)",
                          color: "#a1a1aa",
                          ...sy,
                        }}
                      />
                      {comp?.attendanceRequired && (
                        <Chip
                          label="Attendance duty"
                          size="small"
                          sx={{
                            fontSize: 10,
                            height: 18,
                            background: "rgba(56,189,248,0.1)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,0.2)",
                            ...sy,
                          }}
                        />
                      )}
                      {comp?.status && (
                        <Chip
                          label={comp.status}
                          size="small"
                          sx={{
                            fontSize: 10,
                            height: 18,
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(255,255,255,0.3)",
                            ...sy,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {comp?.attendanceRequired && (
                    <Button
                      component={Link}
                      href="/admin/volunteer/attendance"
                      size="small"
                      endIcon={<ChevronRight size={12} />}
                      sx={{
                        textTransform: "none",
                        fontSize: 12,
                        color: "#c084fc",
                        flexShrink: 0,
                        ...sy,
                        "&:hover": { background: "rgba(168,85,247,0.08)" },
                      }}
                    >
                      Mark
                    </Button>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </Box>
      ) : (
        !isGateVolunteer && (
          <Paper
            sx={{
              p: 4,
              background: "#0c0c0c",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)", ...sy }}
            >
              No competitions assigned yet
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: "rgba(255,255,255,0.18)",
                mt: 0.5,
                ...sy,
              }}
            >
              A department head will assign you to events
            </Typography>
          </Paper>
        )
      )}
    </Box>
  );
}
