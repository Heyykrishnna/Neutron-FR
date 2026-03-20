"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  CheckCircle2,
  XCircle,
  Users,
  ArrowRight,
  Calendar,
  UserRound,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAcceptTeamInvite,
  useDeclineTeamInvite,
  useTeamInvitePreview,
} from "@/src/hooks/api/usePublicRegistration";

export default function TeamInvitePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const inviteToken = params?.inviteToken;

  const acceptInviteMutation = useAcceptTeamInvite();
  const declineInviteMutation = useDeclineTeamInvite();
  const {
    data: invitePreview,
    isLoading: previewLoading,
    isError: previewError,
    error: previewErrorObject,
  } = useTeamInvitePreview(inviteToken, Boolean(user && inviteToken));

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [resultData, setResultData] = useState(null);
  const [mismatchRedirecting, setMismatchRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && inviteToken) {
      const next = `/team-invite/${inviteToken}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, inviteToken, router]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      inviteToken &&
      invitePreview &&
      invitePreview.isIntendedRecipient === false
    ) {
      const next = `/team-invite/${inviteToken}`;
      setMismatchRedirecting(true);
      router.replace(
        `/auth/login?forceLogin=1&next=${encodeURIComponent(next)}`,
      );
    }
  }, [loading, user, inviteToken, invitePreview, router]);

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

  if (mismatchRedirecting) {
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
        <CircularProgress size={24} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  if (previewLoading) {
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
        <CircularProgress size={24} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  if (previewError) {
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
            p: 3,
            borderRadius: "14px",
            border: "1px solid rgba(248,113,113,0.25)",
            background: "#0c0c0c",
          }}
        >
          <Typography
            sx={{
              color: "#fda4af",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            <ShieldAlert size={20} /> Invite unavailable
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.62)", mt: 1 }}>
            {previewErrorObject?.response?.data?.message ||
              previewErrorObject?.message ||
              "This invite is invalid or no longer available."}
          </Typography>

          <Box sx={{ mt: 2 }}>
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
        </Box>
      </Box>
    );
  }

  const inviteStatus = invitePreview?.invite?.status || "PENDING";
  const isInviteActionable =
    invitePreview?.isIntendedRecipient && inviteStatus === "PENDING";

  const teamName = resultData?.team?.name || invitePreview?.team?.name;
  const competitionTitle =
    resultData?.competition?.title || invitePreview?.competition?.title;
  const inviterName =
    invitePreview?.inviter?.name ||
    invitePreview?.inviter?.email ||
    "Team Lead";
  const expiresAt = invitePreview?.invite?.expiresAt
    ? new Date(invitePreview.invite.expiresAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 760,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          background: "#0c0c0c",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: 2.2, md: 2.8 },
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(109,40,217,0.2) 0%, rgba(67,56,202,0.12) 45%, rgba(12,12,12,0.95) 100%)",
          }}
        >
          <Typography
            sx={{
              color: "#f4f4f5",
              fontSize: { xs: 24, md: 28 },
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.15,
            }}
          >
            Team Invitation
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.68)",
              mt: 0.8,
              fontSize: 13,
            }}
          >
            Join <strong>{teamName || "the team"}</strong> for{" "}
            <strong>{competitionTitle || "this competition"}</strong>.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2.2, md: 2.8 }, display: "grid", gap: 1.5 }}>
          <Box
            sx={{
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              p: 1.6,
              display: "grid",
              gap: 0.9,
            }}
          >
            <Typography
              sx={{
                color: "rgba(255,255,255,0.48)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Invite details
            </Typography>

            <Typography
              sx={{
                color: "#f4f4f5",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Users size={14} color="#c084fc" /> Team: {teamName || "-"}
            </Typography>
            <Typography
              sx={{
                color: "#f4f4f5",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Trophy size={14} color="#818cf8" /> Competition:{" "}
              {competitionTitle || "-"}
            </Typography>
            <Typography
              sx={{
                color: "#d4d4d8",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <UserRound size={14} color="#a1a1aa" /> Invited by: {inviterName}
            </Typography>
            <Typography
              sx={{
                color: "#d4d4d8",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
              }}
            >
              <Calendar size={14} color="#a1a1aa" /> Expires: {expiresAt}
            </Typography>
          </Box>

          {invitePreview?.isIntendedRecipient === false && (
            <Box
              sx={{
                p: 1.8,
                borderRadius: "10px",
                border: "1px solid rgba(248,113,113,0.3)",
                background: "rgba(248,113,113,0.1)",
              }}
            >
              <Typography
                sx={{
                  color: "#fda4af",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.7,
                }}
              >
                <ShieldAlert size={16} /> This invite is for a different account
              </Typography>
              <Typography
                sx={{ color: "rgba(255,255,255,0.75)", mt: 0.8, fontSize: 13 }}
              >
                Please sign in with the invited email to continue.
              </Typography>
            </Box>
          )}

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
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    mt: 0.7,
                    fontSize: 13,
                  }}
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
                disabled={isLoading || !isInviteActionable}
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
                  cursor:
                    isLoading || !isInviteActionable
                      ? "not-allowed"
                      : "pointer",
                  opacity: isLoading || !isInviteActionable ? 0.6 : 1,
                }}
              >
                {acceptInviteMutation.isPending
                  ? "Accepting..."
                  : "Accept Invite"}
              </button>

              <button
                type="button"
                onClick={handleDecline}
                disabled={isLoading || !isInviteActionable}
                style={{
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  background: "rgba(239,68,68,0.12)",
                  color: "#fca5a5",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor:
                    isLoading || !isInviteActionable
                      ? "not-allowed"
                      : "pointer",
                  opacity: isLoading || !isInviteActionable ? 0.6 : 1,
                }}
              >
                {declineInviteMutation.isPending
                  ? "Declining..."
                  : "Decline Invite"}
              </button>
            </Box>
          )}

          {(status === "accepted" || status === "declined") && (
            <Box sx={{ mt: 1 }}>
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
    </Box>
  );
}
