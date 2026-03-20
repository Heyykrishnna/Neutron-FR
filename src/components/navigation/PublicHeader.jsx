"use client";

import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { UserRound, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function NavLink({ href, children }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Typography
        sx={{
          color: "rgba(255,255,255,0.72)",
          fontFamily: "'Syne', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          transition: "color 0.15s ease",
          "&:hover": { color: "#f4f4f5" },
        }}
      >
        {children}
      </Typography>
    </Link>
  );
}

export default function PublicHeader() {
  const { user, loading } = useAuth();
  const resolvedUser = loading ? null : user;

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(5,5,5,0.88)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Box
        sx={{
          maxWidth: 1120,
          mx: "auto",
          px: { xs: 2, md: 3 },
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Link href="/competitions" style={{ textDecoration: "none" }}>
            <Box
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.9 }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  border: "1px solid rgba(168,85,247,0.45)",
                  background:
                    "linear-gradient(140deg, rgba(168,85,247,0.22) 0%, rgba(59,130,246,0.15) 100%)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Trophy size={14} color="#d8b4fe" />
              </Box>
              <Typography
                sx={{
                  color: "#f4f4f5",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                Neutron
              </Typography>
            </Box>
          </Link>

          <Box
            sx={{
              ml: { xs: 1, md: 2 },
              display: "flex",
              alignItems: "center",
              gap: 1.8,
            }}
          >
            <NavLink href="/competitions">Competitions</NavLink>
            {resolvedUser ? (
              <NavLink href={`/users/${resolvedUser.id}`}>My Profile</NavLink>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {resolvedUser ? (
            <Link
              href={`/users/${resolvedUser.id}`}
              style={{ textDecoration: "none" }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.4,
                  py: 0.7,
                  borderRadius: "9px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <UserRound size={14} color="#e4e4e7" />
                <Typography
                  sx={{
                    color: "#e4e4e7",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    maxWidth: 160,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {resolvedUser.name || resolvedUser.email || "Profile"}
                </Typography>
              </Box>
            </Link>
          ) : loading ? null : (
            <>
              <Link href="/auth/login" style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.72)",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    px: 1.2,
                  }}
                >
                  Login
                </Typography>
              </Link>
              <Link href="/auth/signup" style={{ textDecoration: "none" }}>
                <Box
                  sx={{
                    px: 1.45,
                    py: 0.72,
                    borderRadius: "9px",
                    border: "1px solid rgba(168,85,247,0.35)",
                    background:
                      "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(99,102,241,0.24) 100%)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#f5f3ff",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Sign up
                  </Typography>
                </Box>
              </Link>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
