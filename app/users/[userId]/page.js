"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import {
  UserRound,
  Building2,
  MapPin,
  Trophy,
  Users,
  Mail,
  ArrowRight,
  Crown,
  UserMinus,
  UserPlus,
  ShieldCheck,
  LogOut,
  Inbox,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicUserProfile } from "@/src/hooks/api/usePublicProfile";
import {
  useAcceptTeamInvite,
  useDeclineTeamInvite,
  useLeaveTeam,
  useMyRegistrations,
  usePendingTeamInvites,
  useRemovePendingTeamInvite,
  useRemoveTeamMember,
  useSendTeamInvite,
  useTeamDetails,
  useTransferTeamLeadership,
} from "@/src/hooks/api/usePublicRegistration";

/* ─── helpers ─── */
const fmt = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS_MAP = {
  APPROVED: {
    color: "#86efac",
    bg: "rgba(74,222,128,0.10)",
    border: "rgba(74,222,128,0.28)",
  },
  PENDING: {
    color: "#fde047",
    bg: "rgba(250,204,21,0.10)",
    border: "rgba(250,204,21,0.28)",
  },
  REJECTED: {
    color: "#fda4af",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.28)",
  },
  WITHDRAWN: {
    color: "#a1a1aa",
    bg: "rgba(161,161,170,0.10)",
    border: "rgba(161,161,170,0.25)",
  },
};

function StatusBadge({ value }) {
  const key = (value || "").toUpperCase();
  const t = STATUS_MAP[key] || STATUS_MAP.PENDING;
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 5,
        fontSize: 10,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        whiteSpace: "nowrap",
      }}
    >
      {key || "UNKNOWN"}
    </span>
  );
}

/* ─── small ghost btn ─── */
function GhostBtn({ onClick, disabled, color = "#c084fc", children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        border: `1px solid ${color}44`,
        background: `${color}12`,
        color,
        borderRadius: 7,
        padding: "6px 10px",
        fontSize: 11,
        fontFamily: "'Space Mono', monospace",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ─── invite card ─── */
function InviteCard({ item, onAccept, onDecline, busyToken }) {
  const token = item?.invite?.inviteToken;
  const busy = busyToken === token;
  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              color: "#f4f4f5",
              marginBottom: 3,
            }}
          >
            {item?.team?.name || "Team Invite"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            {item?.competition?.title || "Unknown competition"}
          </div>
        </div>
        <StatusBadge value={item?.invite?.status || "PENDING"} />
      </div>
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.32)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Invited by{" "}
        {item?.inviter?.name || item?.inviter?.email || "team leader"} · Expires{" "}
        {fmt(item?.invite?.expiresAt)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <GhostBtn
          color="#86efac"
          onClick={() => onAccept(token)}
          disabled={busy}
        >
          {busy ? "Working…" : "Accept"}
        </GhostBtn>
        <GhostBtn
          color="#fda4af"
          onClick={() => onDecline(token)}
          disabled={busy}
        >
          Decline
        </GhostBtn>
      </div>
    </div>
  );
}

/* ─── team card ─── */
function TeamCard({ item, viewer, showManagement }) {
  const { enqueueSnackbar } = useSnackbar();
  const teamId = item?.team?.id;
  const [inviteEmail, setInviteEmail] = useState("");
  const [newLeaderId, setNewLeaderId] = useState("");
  const [expanded, setExpanded] = useState(false);

  const { data: teamDetails } = useTeamDetails(
    teamId,
    showManagement && Boolean(teamId),
  );

  const sendInvite = useSendTeamInvite();
  const removeMember = useRemoveTeamMember();
  const removePendingInvite = useRemovePendingTeamInvite();
  const transferLeadership = useTransferTeamLeadership();
  const leaveTeam = useLeaveTeam();

  const members = teamDetails?.members || [];
  const isLeader = showManagement && teamDetails?.leaderId === viewer?.id;

  const pendingSent = useMemo(() => {
    const now = new Date();
    return (teamDetails?.invites || []).filter(
      (i) =>
        i?.status === "PENDING" &&
        (!i?.expiresAt || new Date(i.expiresAt) > now),
    );
  }, [teamDetails?.invites]);

  const leaderTargets = useMemo(
    () => members.filter((m) => m?.user?.id && m.user.id !== viewer?.id),
    [members, viewer?.id],
  );

  const toast = (msg, v) => enqueueSnackbar(msg, { variant: v });

  const doInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast("Enter email first.", "warning");
    try {
      await sendInvite.mutateAsync({ teamId, invitedEmail: email });
      toast("Invite sent.", "success");
      setInviteEmail("");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  const doRemoveMember = async (id) => {
    try {
      await removeMember.mutateAsync({ teamId, memberId: id });
      toast("Member removed.", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  const doTransfer = async () => {
    if (!newLeaderId) return toast("Select a member.", "warning");
    try {
      await transferLeadership.mutateAsync({ teamId, newLeaderId });
      toast("Leadership transferred.", "success");
      setNewLeaderId("");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  const doLeave = async () => {
    try {
      await leaveTeam.mutateAsync(teamId);
      toast("You left the team.", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  const doRemovePending = async (id) => {
    try {
      await removePendingInvite.mutateAsync({ teamId, inviteId: id });
      toast("Invite removed.", "success");
    } catch (e) {
      toast(e?.response?.data?.message || "Failed.", "error");
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* header row */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                color: "#f4f4f5",
              }}
            >
              {item?.team?.name || "Team"}
            </span>
            {isLeader && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.12em",
                  color: "#c084fc",
                  border: "1px solid rgba(192,132,252,0.3)",
                  background: "rgba(192,132,252,0.08)",
                  borderRadius: 4,
                  padding: "2px 7px",
                  textTransform: "uppercase",
                }}
              >
                Leader
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {item?.competition?.title || "Competition"} ·{" "}
            {fmt(item?.registration?.createdAt)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge
            value={item?.team?.status || item?.registration?.status}
          />
          {showManagement && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.4)",
                padding: "5px 7px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                transition: "all 0.15s",
              }}
            >
              <ChevronRight
                size={14}
                style={{
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>
          )}
        </div>
      </div>

      {/* members strip (always visible) */}
      {members.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "10px 20px",
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {members.map((m) => {
            const isL = m?.teamMember?.isLeader;
            return (
              <div
                key={m?.teamMember?.id || m?.user?.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${isL ? "rgba(192,132,252,0.3)" : "rgba(255,255,255,0.07)"}`,
                  background: isL
                    ? "rgba(192,132,252,0.07)"
                    : "rgba(255,255,255,0.02)",
                  fontSize: 11,
                  color: isL ? "#e9d5ff" : "rgba(255,255,255,0.55)",
                }}
              >
                {isL && <Crown size={9} />}
                {m?.user?.name || m?.user?.email || "Member"}
              </div>
            );
          })}
        </div>
      )}

      {/* management panel */}
      {showManagement && expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* leader controls */}
          {isLeader ? (
            <>
              {/* invite */}
              <div>
                <div className="section-micro-label">Invite Teammate</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@email.com"
                    className="dark-input"
                    style={{ flex: 1, minWidth: 180 }}
                    onKeyDown={(e) => e.key === "Enter" && doInvite()}
                  />
                  <GhostBtn
                    color="#c084fc"
                    onClick={doInvite}
                    disabled={sendInvite.isPending}
                  >
                    <UserPlus size={11} />{" "}
                    {sendInvite.isPending ? "Sending…" : "Send invite"}
                  </GhostBtn>
                </div>
              </div>

              {/* pending invites */}
              {pendingSent.length > 0 && (
                <div>
                  <div className="section-micro-label">
                    Pending Invites ({pendingSent.length})
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {pendingSent.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, color: "#e4e4e7" }}>
                            {inv.invitedEmail}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.35)",
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            Sent {fmt(inv.createdAt)} · Expires{" "}
                            {fmt(inv.expiresAt)}
                          </div>
                        </div>
                        <GhostBtn
                          color="#fda4af"
                          onClick={() => doRemovePending(inv.id)}
                          disabled={removePendingInvite.isPending}
                          title="Remove invite"
                        >
                          <UserMinus size={11} />
                        </GhostBtn>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* remove members */}
              {members.filter((m) => !m?.teamMember?.isLeader).length > 0 && (
                <div>
                  <div className="section-micro-label">Remove Member</div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {members
                      .filter((m) => !m?.teamMember?.isLeader)
                      .map((m) => (
                        <div
                          key={m?.user?.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "7px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.02)",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.65)",
                            }}
                          >
                            {m?.user?.name || m?.user?.email}
                          </div>
                          <GhostBtn
                            color="#fda4af"
                            onClick={() => doRemoveMember(m?.user?.id)}
                            disabled={removeMember.isPending}
                            title="Remove"
                          >
                            <UserMinus size={11} />
                          </GhostBtn>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* transfer leadership */}
              {leaderTargets.length > 0 && (
                <div>
                  <div className="section-micro-label">Transfer Leadership</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select
                      value={newLeaderId}
                      onChange={(e) => setNewLeaderId(e.target.value)}
                      className="dark-input"
                      style={{ flex: 1, minWidth: 180 }}
                    >
                      <option value="">Select new leader…</option>
                      {leaderTargets.map((m) => (
                        <option key={m.user.id} value={m.user.id}>
                          {m.user.name || m.user.email}
                        </option>
                      ))}
                    </select>
                    <GhostBtn
                      color="#818cf8"
                      onClick={doTransfer}
                      disabled={transferLeadership.isPending}
                    >
                      <ShieldCheck size={11} />{" "}
                      {transferLeadership.isPending
                        ? "Transferring…"
                        : "Transfer"}
                    </GhostBtn>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* non-leader: leave */
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <GhostBtn
                color="#fda4af"
                onClick={doLeave}
                disabled={leaveTeam.isPending}
              >
                <LogOut size={11} />{" "}
                {leaveTeam.isPending ? "Leaving…" : "Leave team"}
              </GhostBtn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── TAB NAV ─── */
function TabBar({ tabs, active, onChange, counts }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive
                ? "2px solid #7c3aed"
                : "2px solid transparent",
              color: isActive ? "#f4f4f5" : "rgba(255,255,255,0.38)",
              padding: "10px 16px",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tab.label}
            {counts?.[tab.id] != null && (
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "'Space Mono', monospace",
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: isActive
                    ? "rgba(124,58,237,0.3)"
                    : "rgba(255,255,255,0.06)",
                  color: isActive ? "#c084fc" : "rgba(255,255,255,0.3)",
                  border: isActive
                    ? "1px solid rgba(124,58,237,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {counts[tab.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════ MAIN PAGE ══════════════════════════ */
export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { user: viewer, loading: authLoading } = useAuth();

  const userId = params?.userId;
  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = usePublicUserProfile(userId);

  const isOwner = Boolean(viewer?.id && userId && viewer.id === userId);

  const { data: myRegistrations = [] } = useMyRegistrations(
    isOwner && Boolean(viewer) && !authLoading,
  );
  const { data: pendingInvites = [], isLoading: pendingLoading } =
    usePendingTeamInvites(isOwner && Boolean(viewer) && !authLoading);

  const acceptInvite = useAcceptTeamInvite();
  const declineInvite = useDeclineTeamInvite();
  const [inviteActionToken, setInviteActionToken] = useState("");

  const [activeTab, setActiveTab] = useState("competitions");

  const profileRegs = profile?.registrations || [];

  const teamCards = useMemo(() => {
    if (isOwner) {
      const withTeams = myRegistrations.filter((r) => Boolean(r?.team?.id));
      const map = new Map();
      for (const row of withTeams) {
        if (!map.has(row.team.id))
          map.set(row.team.id, {
            registration: row.registration,
            competition: row.competition,
            team: row.team,
          });
      }
      return Array.from(map.values());
    }
    return profileRegs.filter((r) => Boolean(r?.team?.id));
  }, [isOwner, myRegistrations, profileRegs]);

  const onAccept = async (token) => {
    if (!token) return;
    try {
      setInviteActionToken(token);
      const result = await acceptInvite.mutateAsync(token);
      enqueueSnackbar("Invite accepted. Complete your member form.", {
        variant: "success",
      });
      const cId = result?.competition?.id;
      const tId = result?.team?.id;
      if (cId && tId)
        router.push(`/competitions/${cId}/register?mode=member&teamId=${tId}`);
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || "Failed to accept.", {
        variant: "error",
      });
    } finally {
      setInviteActionToken("");
    }
  };

  const onDecline = async (token) => {
    if (!token) return;
    try {
      setInviteActionToken(token);
      await declineInvite.mutateAsync(token);
      enqueueSnackbar("Invite declined.", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || "Failed to decline.", {
        variant: "error",
      });
    } finally {
      setInviteActionToken("");
    }
  };

  /* loading */
  if (isLoading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
        }}
      >
        <CircularProgress size={22} sx={{ color: "#7c3aed" }} />
      </div>
    );

  /* error */
  if (isError || !profile?.user)
    return (
      <div style={{ minHeight: "100vh", background: "#050505", padding: 32 }}>
        <p
          style={{
            color: "#f87171",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
          }}
        >
          {error?.response?.data?.message ||
            error?.message ||
            "Profile not found."}
        </p>
      </div>
    );

  const user = profile.user;
  const stats = profile.stats || {};

  const tabs = [
    { id: "competitions", label: "Competitions", icon: <Trophy size={12} /> },
    { id: "teams", label: "Teams", icon: <Users size={12} /> },
    ...(isOwner
      ? [{ id: "invites", label: "Invites", icon: <Inbox size={12} /> }]
      : []),
  ];

  const tabCounts = {
    competitions: profileRegs.length || 0,
    teams: teamCards.length || 0,
    ...(isOwner ? { invites: pendingInvites.length || 0 } : {}),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap');

        .profile-page *, .profile-page *::before, .profile-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .profile-page {
          min-height: 100vh;
          background: #050505;
          color: #f4f4f5;
          font-family: system-ui, sans-serif;
        }

        .profile-page .card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          background: #0a0a0a;
          padding: 18px 20px;
        }

        .profile-page .dark-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #f4f4f5;
          padding: 8px 12px;
          font-size: 12px;
          font-family: 'Space Mono', monospace;
          outline: none;
          transition: border-color 0.15s;
        }
        .profile-page .dark-input:focus { border-color: rgba(124,58,237,0.5); }
        .profile-page .dark-input option { background: #111; color: #f4f4f5; }

        .profile-page .section-micro-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          margin-bottom: 8px;
        }

        /* accent bar atop page */
        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #6d28d9, #4338ca, #7c3aed, #6d28d9);
          background-size: 200%;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer { to { background-position: 200%; } }

        .empty-state {
          padding: 32px 20px;
          text-align: center;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.06em;
        }

        @media (max-width: 540px) {
          .profile-header-inner { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      <div className="profile-page">
        <div className="accent-bar" />

        <div
          style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 80px" }}
        >
          {/* ── HERO ── */}
          <div
            style={{
              marginBottom: 32,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
            className="profile-header-inner"
          >
            {/* avatar + name */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  border: "1px solid rgba(124,58,237,0.35)",
                  background:
                    "linear-gradient(135deg, rgba(109,40,217,0.3) 0%, rgba(67,56,202,0.2) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <UserRound size={24} color="#c084fc" />
                )}
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontSize: "clamp(24px, 5vw, 36px)",
                    fontWeight: 400,
                    color: "#f4f4f5",
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {user?.name || "Neutron User"}
                </h1>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {user?.collegeName && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Building2 size={11} /> {user.collegeName}
                    </span>
                  )}
                  {(user?.city || user?.state) && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <MapPin size={11} />{" "}
                      {[user.city, user.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* stats pills */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                {
                  label: "Registrations",
                  value: stats?.registrationsCount ?? profileRegs.length,
                },
                {
                  label: "Teams",
                  value: stats?.teamsCount ?? teamCards.length,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "#0a0a0a",
                    textAlign: "center",
                    minWidth: 80,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                      color: "#f4f4f5",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: "'Space Mono', monospace",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                      marginTop: 5,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABS ── */}
          <TabBar
            tabs={tabs}
            active={activeTab}
            onChange={setActiveTab}
            counts={tabCounts}
          />

          {/* ── COMPETITIONS TAB ── */}
          {activeTab === "competitions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profileRegs.length === 0 ? (
                <div className="empty-state">No registrations yet.</div>
              ) : (
                profileRegs.map((item) => (
                  <div
                    key={item?.registration?.id}
                    className="card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontFamily: "'Instrument Serif', serif",
                          fontStyle: "italic",
                          color: "#f4f4f5",
                          marginBottom: 4,
                        }}
                      >
                        {item?.competition?.title || "Competition"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.35)",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {item?.team?.name ? `Team · ${item.team.name}` : "Solo"}{" "}
                        · Registered {fmt(item?.registration?.createdAt)}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <StatusBadge value={item?.registration?.status} />
                      {item?.competition?.id && (
                        <Link
                          href={`/competitions/${item.competition.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: "#a78bfa",
                              fontFamily: "'Space Mono', monospace",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            View <ArrowRight size={11} />
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TEAMS TAB ── */}
          {activeTab === "teams" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {teamCards.length === 0 ? (
                <div className="empty-state">No team memberships yet.</div>
              ) : (
                teamCards.map((item) => (
                  <TeamCard
                    key={item?.team?.id || item?.registration?.id}
                    item={item}
                    viewer={viewer}
                    showManagement={isOwner}
                  />
                ))
              )}
            </div>
          )}

          {/* ── INVITES TAB ── */}
          {activeTab === "invites" && isOwner && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingLoading ? (
                <div
                  style={{
                    padding: 32,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress size={18} sx={{ color: "#7c3aed" }} />
                </div>
              ) : pendingInvites.length === 0 ? (
                <div className="empty-state">No pending invites.</div>
              ) : (
                pendingInvites.map((inv) => (
                  <InviteCard
                    key={inv?.invite?.id || inv?.invite?.inviteToken}
                    item={inv}
                    onAccept={onAccept}
                    onDecline={onDecline}
                    busyToken={inviteActionToken}
                  />
                ))
              )}
            </div>
          )}

          {/* non-owner note */}
          {!isOwner && (
            <div
              style={{
                marginTop: 32,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.2)",
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              <Mail size={11} />
              Log in to manage your own profile.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
