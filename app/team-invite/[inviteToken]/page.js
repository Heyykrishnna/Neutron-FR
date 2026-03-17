"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { CheckCircle2, XCircle, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAcceptTeamInvite,
  useDeclineTeamInvite,
} from "@/src/hooks/api/usePublicRegistration";

export default function TeamInvitePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const inviteToken = params?.inviteToken;

  const acceptInviteMutation = useAcceptTeamInvite();
  const declineInviteMutation = useDeclineTeamInvite();

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!loading && !user && inviteToken) {
      const next = `/team-invite/${inviteToken}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, inviteToken, router]);

  const isLoading = useMemo(
    () => acceptInviteMutation.isPending || declineInviteMutation.isPending,
    [acceptInviteMutation.isPending, declineInviteMutation.isPending],
  );

  const handleAccept = async () => {
    setStatus("idle");
    setMessage("");

    try {
      const data = await acceptInviteMutation.mutateAsync(inviteToken);
      setResultData(data || null);
      setStatus("accepted");
      setMessage("You have successfully joined the team.");

      const acceptedCompetitionId = data?.competition?.id;
      const acceptedTeamId = data?.team?.id;

      if (acceptedCompetitionId && acceptedTeamId) {
        setTimeout(() => {
          router.replace(
            `/competitions/${acceptedCompetitionId}/register?mode=member&teamId=${acceptedTeamId}`,
          );
        }, 900);
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to accept invite.",
      );
    }
  };

  const handleDecline = async () => {
    setStatus("idle");
    setMessage("");

    try {
      await declineInviteMutation.mutateAsync(inviteToken);
      setStatus("declined");
      setMessage("You declined the team invite.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to decline invite.",
      );
    }
  };

  if (loading || !inviteToken) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <CircularProgress size={26} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  if (!user) return null;

  const teamName = resultData?.team?.name;
  const competitionTitle = resultData?.competition?.title;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 620,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          background: "#0c0c0c",
          p: { xs: 2.2, md: 3 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Users size={18} color="#c084fc" />
          <Typography sx={{ color: "#f4f4f5", fontSize: 22, fontWeight: 700 }}>
            Team Invite
          </Typography>
        </Box>

        <Typography
          sx={{ color: "rgba(255,255,255,0.45)", fontSize: 13, mb: 2.4 }}
        >
          Accept this invite to join your team for the competition.
        </Typography>

        {status === "accepted" && (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid rgba(74,222,128,0.25)",
              background: "rgba(74,222,128,0.1)",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                color: "#4ade80",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.7,
              }}
            >
              <CheckCircle2 size={16} /> Invite accepted
            </Typography>
            {(teamName || competitionTitle) && (
              <Typography
                sx={{ color: "rgba(255,255,255,0.75)", mt: 0.7, fontSize: 13 }}
              >
                {teamName ? `Team: ${teamName}` : ""}
                {teamName && competitionTitle ? " · " : ""}
                {competitionTitle ? `Competition: ${competitionTitle}` : ""}
              </Typography>
            )}
          </Box>
        )}

        {status === "declined" && (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid rgba(244,114,182,0.25)",
              background: "rgba(244,114,182,0.1)",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                color: "#f9a8d4",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.7,
              }}
            >
              <XCircle size={16} /> Invite declined
            </Typography>
          </Box>
        )}

        {status === "error" && (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid rgba(248,113,113,0.3)",
              background: "rgba(248,113,113,0.1)",
              mb: 2,
            }}
          >
            <Typography sx={{ color: "#f87171", fontWeight: 600 }}>
              {message}
            </Typography>
          </Box>
        )}

        {status === "idle" && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleAccept}
              disabled={isLoading}
              style={{
                border: "1px solid rgba(74,222,128,0.32)",
                borderRadius: 10,
                padding: "10px 16px",
                background:
                  "linear-gradient(135deg, rgba(22,163,74,0.9) 0%, rgba(21,128,61,0.95) 100%)",
                color: "#fff",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {acceptInviteMutation.isPending
                ? "Accepting..."
                : "Accept Invite"}
            </button>

            <button
              type="button"
              onClick={handleDecline}
              disabled={isLoading}
              style={{
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 10,
                padding: "10px 16px",
                background: "rgba(239,68,68,0.12)",
                color: "#fca5a5",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {declineInviteMutation.isPending
                ? "Declining..."
                : "Decline Invite"}
            </button>
          </Box>
        )}

        {(status === "accepted" || status === "declined") && (
          <Box sx={{ mt: 2.2 }}>
            <Link href="/competitions" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.7,
                  color: "#c084fc",
                  fontSize: 13,
                }}
              >
                Go to competitions <ArrowRight size={14} />
              </Typography>
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  );
}
