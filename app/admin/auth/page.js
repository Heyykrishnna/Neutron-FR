"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { LoginForm } from "@/src/components/forms/LoginForm";
import { useSnackbar } from "notistack";
import { useRef } from "react";
export default function AdminAuthPage() {
  const { user, loading, login, checkAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const handledOAuthRef = useRef(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "SA") router.replace("/admin/sa");
      else if (user.role === "DH") router.replace("/admin/dh");
      else if (user.role === "CH") router.replace("/admin/club");
      else if (user.role === "VH") router.replace("/admin/vh");
      else if (user.role === "VOLUNTEER") router.replace("/admin/volunteer");
      else if (user.role === "JUDGE") router.replace("/admin/judge");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const authStatus = searchParams.get("auth");
    if (!authStatus || handledOAuthRef.current) return;

    handledOAuthRef.current = true;

    if (authStatus === "success") {
      checkAuth();
      return;
    }

    if (authStatus === "failed") {
      const rawReason = searchParams.get("reason");
      const reason = rawReason
        ? decodeURIComponent(rawReason).replace(/_/g, " ")
        : "Google login failed";
      setLoginError(reason);
      enqueueSnackbar(reason, { variant: "error" });
    }
  }, [checkAuth, enqueueSnackbar, searchParams]);

  const handleLogin = async (credentials) => {
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const result = await login(credentials);
      if (!result.success) {
        const errorMessage = result.error || "Invalid email or password";
        setLoginError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: "error" });
      } else {
        enqueueSnackbar("Successfully logged in!", { variant: "success" });
      }
    } catch {
      const errorMessage = "An error occurred. Please try again.";
      setLoginError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, "");
    const oauthBaseUrl = normalizedBackendUrl.endsWith("/api/v1")
      ? normalizedBackendUrl
      : `${normalizedBackendUrl}/api/v1`;
    const redirectUrl = encodeURIComponent(
      window.location.origin + "/admin/auth",
    );
    window.location.href = `${oauthBaseUrl}/auth/google?redirect=${redirectUrl}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#02040a",
        }}
      >
        <CircularProgress size={28} sx={{ color: "rgba(120,160,255,0.7)" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: "#02040a",
        overflow: "hidden",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {/* Starfield canvas */}
      <StarField />

      {/* Nebula glow blobs */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "15%",
            left: "60%",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(59,80,180,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
            borderRadius: "50%",
            transform: "translate(-50%,-50%)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "10%",
            left: "20%",
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(100,40,160,0.14) 0%, transparent 70%)",
            filter: "blur(40px)",
            borderRadius: "50%",
          },
        }}
      />

      {/* Horizon line glow */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(80,120,255,0.3), transparent)",
          zIndex: 1,
        }}
      />

      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Wordmark */}
        <Box sx={{ mb: 5, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            {/* Logomark — orbiting dot */}
            <Box
              sx={{
                position: "relative",
                width: 28,
                height: 28,
                "& .ring": {
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "1.5px solid rgba(100,140,255,0.5)",
                },
                "& .dot": {
                  position: "absolute",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#7aabff",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 8px #7aabff",
                },
                "& .orbit-dot": {
                  position: "absolute",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#a0c0ff",
                  top: 0,
                  left: "50%",
                  transformOrigin: "0 14px",
                  animation: "orbit 3s linear infinite",
                  "@keyframes orbit": {
                    from: {
                      transform:
                        "translateX(-50%) rotate(0deg) translateY(-14px)",
                    },
                    to: {
                      transform:
                        "translateX(-50%) rotate(360deg) translateY(-14px)",
                    },
                  },
                },
              }}
            >
              <Box className="ring" />
              <Box className="dot" />
              <Box className="orbit-dot" />
            </Box>

            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#e8eeff",
                fontFamily: "'Syne', sans-serif",
                textTransform: "uppercase",
              }}
            >
              Neutron
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(140,165,255,0.5)",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Mission Control
          </Typography>
        </Box>

        {/* Card */}
        <Paper
          elevation={0}
          sx={{
            p: "36px 40px",
            borderRadius: "16px",
            backdropFilter: "blur(24px) saturate(160%)",
            background: "rgba(8,12,28,0.72)",
            border: "1px solid rgba(100,140,255,0.12)",
            boxShadow: [
              "0 0 0 1px rgba(255,255,255,0.03) inset",
              "0 32px 80px rgba(0,0,0,0.7)",
              "0 0 40px rgba(60,90,200,0.08)",
            ].join(","),
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(140,180,255,0.25), transparent)",
            },
          }}
        >
          <LoginForm
            onSubmit={handleLogin}
            loading={isLoggingIn}
            error={loginError}
            onGoogleLogin={handleGoogleLogin}
          />
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.18)",
              fontFamily: "'Syne', sans-serif",
              textTransform: "uppercase",
            }}
          >
            © {new Date().getFullYear()} Neutron Systems
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Lightweight canvas starfield
function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() / 1000;
      stars.forEach((s) => {
        const opacity = 0.3 + 0.5 * Math.sin(t * s.speed * 10 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
