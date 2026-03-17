"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ArrowLeft, Calendar, MapPin, Users, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetition } from "@/src/hooks/api/useCompetitions";
import { usePublicCompetitionFormFields } from "@/src/hooks/api/usePublicRegistration";

function Stat({ icon, label, value }) {
  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        p: 1.5,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Typography
        sx={{ color: "rgba(255,255,255,0.35)", fontSize: 11, mb: 0.6 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: "#f4f4f5",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.8,
          fontSize: 13,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {icon}
        {value}
      </Typography>
    </Box>
  );
}

export default function PublicCompetitionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const competitionId = params?.competitionId;

  const {
    data: competition,
    isLoading,
    isError,
    error,
  } = useCompetition(competitionId);
  const { data: formInfo, isLoading: formLoading } =
    usePublicCompetitionFormFields(competitionId);

  const registerEnabled = useMemo(() => {
    if (!competition) return false;

    const beforeDeadline =
      !competition.registrationDeadline ||
      new Date(competition.registrationDeadline) > new Date();

    return (
      competition.status === "OPEN" &&
      competition.registrationsOpen &&
      beforeDeadline &&
      Boolean(formInfo?.formId) &&
      (formInfo?.fields || []).length > 0
    );
  }, [competition, formInfo]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#050505",
        }}
      >
        <CircularProgress size={26} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  if (isError || !competition) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#050505", p: 3 }}>
        <Typography sx={{ color: "#f87171" }}>
          {error?.response?.data?.message ||
            error?.message ||
            "Competition not available"}
        </Typography>
      </Box>
    );
  }

  const hasDynamicForm = (formInfo?.fields || []).length > 0;

  const handleRegister = () => {
    const target = `/competitions/${competitionId}/register`;
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Link href="/competitions" style={{ textDecoration: "none" }}>
          <Typography
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              mb: 2,
            }}
          >
            <ArrowLeft size={14} /> Back to competitions
          </Typography>
        </Link>

        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            background: "#0c0c0c",
            p: { xs: 2.2, md: 3 },
          }}
        >
          <Typography
            sx={{
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: { xs: 24, md: 32 },
              lineHeight: 1.15,
            }}
          >
            {competition.title}
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.45)",
              mt: 1.1,
              lineHeight: 1.7,
              fontSize: 14,
              maxWidth: 780,
            }}
          >
            {competition.shortDescription || "No short description available."}
          </Typography>

          <Box
            sx={{
              mt: 2.2,
              display: "grid",
              gap: 1.2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            }}
          >
            <Stat
              icon={<Users size={13} />}
              label="Type"
              value={competition.type || "—"}
            />
            <Stat
              icon={<Calendar size={13} />}
              label="Registration Deadline"
              value={
                competition.registrationDeadline
                  ? new Date(competition.registrationDeadline).toLocaleString()
                  : "No deadline"
              }
            />
            <Stat
              icon={<MapPin size={13} />}
              label="Venue"
              value={competition.venueName || "To be announced"}
            />
            <Stat
              icon={<FileText size={13} />}
              label="Registration Form"
              value={
                formLoading
                  ? "Checking..."
                  : hasDynamicForm
                    ? `${formInfo.fields.length} fields`
                    : "Not configured"
              }
            />
          </Box>

          {competition.rulesRichText && (
            <Box sx={{ mt: 2.5 }}>
              <Typography sx={{ color: "#e4e4e7", fontWeight: 600, mb: 0.9 }}>
                Rules
              </Typography>
              <Box
                sx={{
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.75,
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                }}
              >
                {competition.rulesRichText}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleRegister}
              disabled={!registerEnabled}
              style={{
                border: "1px solid rgba(168,85,247,0.35)",
                borderRadius: 10,
                padding: "11px 20px",
                background: registerEnabled
                  ? "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)"
                  : "rgba(71,85,105,0.28)",
                color: registerEnabled ? "#fff" : "rgba(255,255,255,0.4)",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: registerEnabled ? "pointer" : "not-allowed",
              }}
            >
              {registerEnabled ? "Register Now" : "Registration Unavailable"}
            </button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
