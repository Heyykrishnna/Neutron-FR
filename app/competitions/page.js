"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Search, Calendar, Users, ArrowRight } from "lucide-react";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";

const inputStyle = {
  width: "100%",
  padding: "10px 12px 10px 34px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "rgba(255,255,255,0.9)",
  fontSize: 13,
  outline: "none",
  fontFamily: "'Syne', sans-serif",
  boxSizing: "border-box",
};

function CompetitionCard({ competition }) {
  const registrationOpen =
    competition?.registrationsOpen &&
    competition?.status === "OPEN" &&
    (!competition?.registrationDeadline ||
      new Date(competition.registrationDeadline) > new Date());

  return (
    <Box
      component={Link}
      href={`/competitions/${competition.id}`}
      sx={{
        display: "block",
        p: 2.25,
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "#0c0c0c",
        textDecoration: "none",
        transition: "all 0.15s",
        "&:hover": {
          borderColor: "rgba(168,85,247,0.4)",
          background: "#101010",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Typography
          sx={{
            color: "#f4f4f5",
            fontWeight: 600,
            fontSize: 16,
            fontFamily: "'Syne', sans-serif",
            lineHeight: 1.25,
          }}
        >
          {competition.title}
        </Typography>

        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: registrationOpen
              ? "rgba(34,197,94,0.12)"
              : "rgba(255,255,255,0.06)",
            color: registrationOpen ? "#4ade80" : "rgba(255,255,255,0.6)",
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            flexShrink: 0,
            height: "fit-content",
          }}
        >
          {registrationOpen ? "Open" : "Closed"}
        </Box>
      </Box>

      <Typography
        sx={{
          mt: 1,
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1.55,
        }}
      >
        {competition.shortDescription || "No description available yet."}
      </Typography>

      <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Meta icon={<Users size={13} />} label={competition.type || "EVENT"} />
        <Meta
          icon={<Calendar size={13} />}
          label={
            competition.registrationDeadline
              ? new Date(competition.registrationDeadline).toLocaleDateString()
              : "No deadline"
          }
        />
      </Box>

      <Box sx={{ mt: 1.8, display: "flex", justifyContent: "flex-end" }}>
        <Typography
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.6,
            color: "#c084fc",
            fontSize: 12,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
          }}
        >
          View details <ArrowRight size={14} />
        </Typography>
      </Box>
    </Box>
  );
}

function Meta({ icon, label }) {
  return (
    <Typography
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.65,
        color: "rgba(255,255,255,0.42)",
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {icon}
      {label}
    </Typography>
  );
}

export default function PublicCompetitionsPage() {
  const [search, setSearch] = useState("");
  const {
    data: competitions = [],
    isLoading,
    isError,
    error,
  } = useCompetitions();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return competitions;

    return competitions.filter((competition) => {
      return (
        (competition.title || "").toLowerCase().includes(q) ||
        (competition.shortDescription || "").toLowerCase().includes(q) ||
        (competition.category || "").toLowerCase().includes(q)
      );
    });
  }, [competitions, search]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        py: 5,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1120, mx: "auto" }}>
        <Typography
          sx={{
            color: "#f4f4f5",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: { xs: 28, md: 34 },
            mb: 0.6,
          }}
        >
          Public Competitions
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            mb: 2.5,
          }}
        >
          Explore live competitions and register in a few clicks.
        </Typography>

        <Box sx={{ position: "relative", mb: 2.5, maxWidth: 420 }}>
          <Box
            sx={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.3)",
              display: "flex",
            }}
          >
            <Search size={14} />
          </Box>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search competitions..."
            style={inputStyle}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={26} sx={{ color: "#a855f7" }} />
          </Box>
        ) : isError ? (
          <Typography sx={{ color: "#f87171" }}>
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load competitions"}
          </Typography>
        ) : filtered.length === 0 ? (
          <Box
            sx={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0c0c0c",
              borderRadius: "12px",
              py: 8,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              No competitions available right now.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            }}
          >
            {filtered.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
