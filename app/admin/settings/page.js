"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import {
  ChevronLeft,
  KeyRound,
  Laptop,
  ShieldCheck,
  Clock3,
  Globe,
  Lock,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSessions,
  useRevokeSession,
  useRevokeAllSessions,
  useChangePassword,
} from "@/src/hooks/api/useAuth";
import { LoadingState } from "@/src/components/LoadingState";

function deriveBrowserName(userAgent = "") {
  const ua = userAgent.toLowerCase();

  if (!ua) return "";
  if (ua.includes("samsungbrowser")) return "Samsung Internet";
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("chrome/") && !ua.includes("edg/") && !ua.includes("opr/"))
    return "Chrome";
  if (
    ua.includes("safari/") &&
    !ua.includes("chrome/") &&
    !ua.includes("chromium")
  )
    return "Safari";

  return "";
}

function derivePlatformName(userAgent = "") {
  const ua = userAgent.toLowerCase();

  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("mac os x")) return "macOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("cros")) return "ChromeOS";
  if (ua.includes("linux")) return "Linux";

  return "";
}

function deriveSessionDeviceName(session) {
  if (session?.deviceName && session.deviceName !== "Unknown device") {
    return session.deviceName;
  }

  const userAgent = session?.userAgent || "";
  const platform = derivePlatformName(userAgent);
  const browser = deriveBrowserName(userAgent);

  if (platform && browser) {
    return `${platform} ${browser}`;
  }

  return platform || browser || "Unknown device";
}

export default function PersonalSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState("password");

  const sessionsQuery = useSessions();
  const revokeSessionMutation = useRevokeSession();
  const revokeAllSessionsMutation = useRevokeAllSessions();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!loading && (!user || !["SA", "DH"].includes(user.role))) {
      router.replace("/admin/auth");
    }
  }, [loading, router, user]);

  const sessions = useMemo(
    () => sessionsQuery.data || [],
    [sessionsQuery.data],
  );

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      enqueueSnackbar("All password fields are required", {
        variant: "warning",
      });
      return;
    }

    if (newPassword.length < 8) {
      enqueueSnackbar("New password must be at least 8 characters", {
        variant: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      enqueueSnackbar("New password and confirm password must match", {
        variant: "warning",
      });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      enqueueSnackbar("Password changed successfully", { variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to change password",
        { variant: "error" },
      );
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      enqueueSnackbar("Session revoked", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to revoke session",
        { variant: "error" },
      );
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await revokeAllSessionsMutation.mutateAsync();
      enqueueSnackbar("All sessions revoked. Please sign in again.", {
        variant: "success",
      });
      router.replace("/admin/auth");
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to revoke all sessions",
        { variant: "error" },
      );
    }
  };

  const formatDateTime = (value) =>
    new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return <LoadingState />;
  }

  if (!user || !["SA", "DH"].includes(user.role)) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      <Box sx={{ mb: 4 }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            padding: "7px 12px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          <ChevronLeft size={14} />
          Back
        </button>

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
            <ShieldCheck size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Personal Settings
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.03em",
            ml: 0.5,
          }}
        >
          Manage your password and active sessions across devices
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 1,
            borderRadius: "12px",
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            height: "fit-content",
          }}
        >
          {[
            { key: "password", label: "Password", icon: KeyRound },
            { key: "sessions", label: "Sessions", icon: Laptop },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  marginBottom: 6,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  border: active
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid transparent",
                  borderRadius: 10,
                  color: active ? "#f4f4f5" : "rgba(255,255,255,0.38)",
                  fontSize: 13,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </Box>

        <Box
          sx={{
            borderRadius: "12px",
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          {tab === "password" && (
            <Box sx={{ p: 3 }}>
              <SectionHeader
                title="Change Password"
                description="Update your account password. This affects your sign-in on every device."
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 3,
                }}
              >
                <DarkInput
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
                <DarkInput
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
                <DarkInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </Box>

              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.28)",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  Password requirements: at least 8 characters. If your account
                  was created with Google only, the API will block password
                  changes until a password exists.
                </Typography>
              </Box>

              <BtnRow>
                <PrimaryBtn
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Updating…"
                    : "Update Password"}
                </PrimaryBtn>
              </BtnRow>
            </Box>
          )}

          {tab === "sessions" && (
            <Box sx={{ p: 3 }}>
              <SectionHeader
                title="Session Management"
                description="Review active sessions and revoke device access when needed."
              />

              <Box
                sx={{
                  mt: 3,
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#f87171",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  Revoking all sessions signs you out everywhere, including this
                  device.
                </Typography>
              </Box>

              <BtnRow>
                <DangerBtn
                  onClick={handleRevokeAllSessions}
                  disabled={revokeAllSessionsMutation.isPending}
                >
                  {revokeAllSessionsMutation.isPending
                    ? "Revoking…"
                    : "Logout Everywhere"}
                </DangerBtn>
              </BtnRow>

              {sessionsQuery.isLoading ? (
                <Box sx={{ py: 6 }}>
                  <LoadingState />
                </Box>
              ) : sessions.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 13,
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    No active sessions found
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  {sessions.map((session) => (
                    <Box
                      key={session.id}
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.75,
                            }}
                          >
                            <Laptop size={14} color="rgba(255,255,255,0.55)" />
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#e4e4e7",
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 500,
                              }}
                            >
                              {deriveSessionDeviceName(session)}
                            </Typography>
                          </Box>
                          <MetaRow
                            icon={<Globe size={12} />}
                            label={session.ipAddress || "No IP recorded"}
                          />
                          <MetaRow
                            icon={<Clock3 size={12} />}
                            label={`Started ${formatDateTime(session.createdAt)}`}
                          />
                          <MetaRow
                            icon={<Lock size={12} />}
                            label={`Expires ${formatDateTime(session.expiresAt)}`}
                          />
                          {session.userAgent && (
                            <Typography
                              sx={{
                                mt: 1,
                                fontSize: 10,
                                color: "rgba(255,255,255,0.18)",
                                fontFamily: "'DM Mono', monospace",
                                wordBreak: "break-word",
                              }}
                            >
                              {session.userAgent}
                            </Typography>
                          )}
                        </Box>

                        <DangerBtn
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokeSessionMutation.isPending}
                        >
                          {revokeSessionMutation.isPending
                            ? "Revoking…"
                            : "Revoke"}
                        </DangerBtn>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function SectionHeader({ title, description }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 600,
          color: "#f4f4f5",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 12,
          color: "rgba(255,255,255,0.28)",
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

function MetaRow({ icon, label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
      <Box sx={{ color: "rgba(255,255,255,0.2)", display: "flex" }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function DarkInput({ type = "text", value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "11px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
        fontFamily: "'Syne', sans-serif",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function BtnRow({ children }) {
  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 3 }}>
      {children}
    </Box>
  );
}

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "9px 18px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
};

function PrimaryBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#f4f4f5",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      }}
    >
      {children}
    </button>
  );
}

function DangerBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#f87171",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
      }}
    >
      {children}
    </button>
  );
}
