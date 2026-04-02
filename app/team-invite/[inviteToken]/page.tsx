"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useAcceptTeamInvite } from "@/src/hooks/api/usePublicRegistration";

type FlowState = "auth" | "accepting" | "redirecting" | "error";

const isWrongAccountInviteError = (message: string): boolean => {
  const normalized = String(message || "").toLowerCase();
  return (
    normalized.includes("different account") ||
    normalized.includes("different email") ||
    normalized.includes("not intended recipient") ||
    normalized.includes("invited email") ||
    normalized.includes("intended recipient")
  );
};

export default function TeamInvitePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const inviteToken = String(params?.inviteToken || "");
  const acceptInviteMutation = useAcceptTeamInvite();

  const [flowState, setFlowState] = useState<FlowState>("auth");
  const [errorMessage, setErrorMessage] = useState("");
  const [requiresDifferentAccount, setRequiresDifferentAccount] =
    useState(false);
  const hasAttemptedAutoAccept = useRef(false);
  const profileInboxCallback = "/profile?section=inbox";

  useEffect(() => {
    if (loading || !inviteToken) return;

    if (!user) {
      router.replace(
        `/auth/signin?callbackUrl=${encodeURIComponent(profileInboxCallback)}`,
      );
    }
  }, [loading, user, inviteToken, router, profileInboxCallback]);

  useEffect(() => {
    if (loading || !user || !inviteToken || hasAttemptedAutoAccept.current) {
      return;
    }

    hasAttemptedAutoAccept.current = true;
    setFlowState("accepting");

    const autoAccept = async () => {
      try {
        const data = await acceptInviteMutation.mutateAsync({ inviteToken });
        const acceptedCompetitionId = data?.competition?.id;
        const acceptedTeamId = data?.team?.id;

        if (!acceptedCompetitionId || !acceptedTeamId) {
          throw new Error("Could not resolve team invite destination.");
        }

        setFlowState("redirecting");
        router.replace(
          `/competitions/${acceptedCompetitionId}/register?mode=member&teamId=${acceptedTeamId}`,
        );
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to process invite. Please try again.";

        if (isWrongAccountInviteError(message)) {
          router.replace(
            `/auth/signin?forceLogin=1&callbackUrl=${encodeURIComponent(profileInboxCallback)}`,
          );
          return;
        }

        setRequiresDifferentAccount(false);
        setErrorMessage(message);
        setFlowState("error");
      }
    };

    autoAccept();
  }, [
    loading,
    user,
    inviteToken,
    acceptInviteMutation,
    router,
    profileInboxCallback,
  ]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl border border-white/10 bg-[#0c0c0c] rounded-2xl p-8 text-center">
        {flowState === "error" ? (
          <>
            <h1 className="text-2xl font-bold mb-3">
              Invite could not be completed
            </h1>
            <p className="text-white/65 mb-6">{errorMessage}</p>
            {requiresDifferentAccount ? (
              <button
                type="button"
                onClick={() => {
                  const callbackUrl = `/team-invite/${inviteToken}`;
                  router.replace(
                    `/auth/signin?forceLogin=1&callbackUrl=${encodeURIComponent(callbackUrl)}`,
                  );
                }}
                className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
              >
                Sign In With Invited Account
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  hasAttemptedAutoAccept.current = false;
                  setRequiresDifferentAccount(false);
                  setErrorMessage("");
                  setFlowState("auth");
                }}
                className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
              >
                Try Again
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <CircularProgress size={26} sx={{ color: "#a855f7" }} />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {flowState === "redirecting"
                ? "Redirecting to registration"
                : "Processing team invite"}
            </h1>
            <p className="text-white/60">
              {flowState === "auth"
                ? "Verifying your account session before opening team invites..."
                : "You will be taken directly to the member registration form."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
