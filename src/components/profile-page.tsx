"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import * as THREE from "three";
import {
  Trash2,
  X,
  ChevronRight,
  Bell,
  Layout,
  User,
  Target,
  Mail,
  Download,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Upload,
  Calendar,
  Zap,
  Award,
  ChevronLeft,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCard from "./ProfileCard";
import { useAuthMe } from "@/src/hooks/api/useAuth";
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
import { useRetryRegistrationPayment } from "@/src/hooks/api/usePayments";
import {
  useMyQRCode,
  useUpdateUserProfile,
} from "@/src/hooks/api/useUserProfile";

type NavItem =
  | "profile"
  | "competitions"
  | "events"
  | "inbox"
  | "campus-ambassador";

const DashboardContext = React.createContext<{
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  setExpandedID: (val: boolean) => void;
}>({
  showToast: () => {},
  setExpandedID: () => {},
});

function useDashboard() {
  return React.useContext(DashboardContext);
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "leader" | "member";
  status: "confirmed" | "pending";
  avatar: string;
}

interface EnrolledItem {
  kind: "competition" | "event";
  id: string;
  slug: string;
  registrationId?: string;
  registrationStatus?: string;
  paymentStatus?: string;
  paymentRequired?: boolean;
  paymentVerifiedAt?: string;
  onRetryPayment?: (registrationId: string) => Promise<void> | void;
  retryingRegistrationId?: string | null;
  disablePaymentAction?: boolean;
  teamId?: string;
  currentUserId?: string;
  title: string;
  image: string;
  category: string;
  date: string;
  status: "open" | "closed" | "cancelled" | "postponed";
  teamSize: string; // e.g. "1-3 Members" or "4 Members"
  team?: TeamMember[];
}

interface ProfileState {
  name: string;
  email: string;
  bio: string;
  college: string;
  year: string;
  gender: string;
  city: string;
  state: string;
  whatsapp: string;
  image: string;
  collegeIdPic: string;
  govtIdPic: string;
}

const EMPTY_PROFILE: ProfileState = {
  name: "",
  email: "",
  bio: "",
  college: "",
  year: "",
  gender: "",
  city: "",
  state: "",
  whatsapp: "",
  image: "",
  collegeIdPic: "",
  govtIdPic: "",
};

const STATUS_MAP: Record<string, EnrolledItem["status"]> = {
  OPEN: "open",
  ACTIVE: "open",
  REGISTRATION_OPEN: "open",
  CLOSED: "closed",
  REGISTRATION_CLOSED: "closed",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
};

function toDashboardStatus(status?: string): EnrolledItem["status"] {
  if (!status) return "closed";
  return STATUS_MAP[status.toUpperCase()] || "closed";
}

function formatTeamSize(min?: number, max?: number): string {
  if (typeof max !== "number" || max < 2) return "1 Member";
  const safeMin = typeof min === "number" && min > 0 ? min : 1;
  if (safeMin === max) return `${max} Members`;
  return `${safeMin}-${max} Members`;
}

function formatDisplayDate(value?: string | Date): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"] as const;

function normalizeGender(value: string): string {
  const normalized = value.trim().toUpperCase();
  return GENDER_OPTIONS.includes(normalized as (typeof GENDER_OPTIONS)[number])
    ? normalized
    : "";
}

function timeAgo(value?: string | Date): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function isTeamEvent(teamSize: string): boolean {
  const match = teamSize.match(/\d+/g);
  if (!match) return false;
  const max = parseInt(match[match.length - 1]);
  return max > 1;
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-1000 px-4 py-2.5 rounded-xl border border-white/10 bg-[#080808]/90 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 min-w-50 max-w-[320px]"
    >
      <div
        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
          type === "success"
            ? "bg-emerald-500/10 text-emerald-400"
            : type === "error"
              ? "bg-rose-500/10 text-rose-400"
              : "bg-blue-500/10 text-blue-400"
        }`}
      >
        {type === "success" && <CheckCircle2 size={14} />}
        {type === "error" && <AlertCircle size={14} />}
        {type === "info" && <Bell size={14} />}
      </div>
      <p className="text-[10px] font-bold text-white tracking-wide truncate flex-1">
        {message}
      </p>
      <button
        onClick={onClose}
        className="text-white/20 hover:text-white transition-colors p-1"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

function EditableRow({
  label,
  value,
  onChange,
  locked = false,
  type = "text",
  options,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
  type?: string;
  options?: string[];
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono w-1/3 shrink-0">
        {label}
      </span>

      <div className="flex-1 flex items-center justify-end gap-3 text-right">
        {editing ? (
          <div className="flex items-center gap-2 w-full max-w-60">
            {options?.length ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-white/40 transition-all font-mono"
              >
                {!draft && <option value="">Select</option>}
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-white/40 transition-all font-mono"
              />
            )}
            <button
              onClick={save}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className={`text-[12px] font-medium leading-none ${locked ? "text-white/40" : "text-white/80"}`}
            >
              {value || placeholder || "—"}
            </span>
            {!locked && (
              <button
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/50"
              >
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-mono">
          {label}
        </label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
          >
            <svg
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                strokeLinecap="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                strokeLinecap="round"
              />
            </svg>
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setEditing(false);
            }}
            autoFocus
            className="flex-1 bg-[#111] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-all"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <p
          className={`text-sm mt-0.5 ${value ? "text-white/80" : "text-white/25 italic"}`}
        >
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function DocumentCard({
  label,
  type,
  date,
  onUpload,
  existingUrl,
  file,
  setFile,
}: {
  label: string;
  type: string;
  date: string;
  onUpload: (file: File) => void;
  existingUrl?: string;
  file?: File | null;
  setFile?: (file: File | null) => void;
}) {
  const { showToast } = useDashboard();
  const [localFile, setLocalFile] = useState<File | null>(file || null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [existingPreviewFailed, setExistingPreviewFailed] =
    useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasExistingFile = Boolean(existingUrl && !localFile);
  const existingFileName = existingUrl
    ? decodeURIComponent(existingUrl.split("/").pop() || label)
    : label;
  const isImageFile = Boolean(localFile?.type?.startsWith("image/"));

  useEffect(() => {
    setExistingPreviewFailed(false);
  }, [existingUrl]);

  useEffect(() => {
    if (!localFile || !isImageFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(localFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [localFile, isImageFile]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setUploading(true);
    try {
      await onUpload(f);
      setLocalFile(f);
    } catch {
      showToast("Failed to upload file.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`bg-white/2 border border-white/8 rounded-2xl p-4 flex flex-col gap-3 group/doc hover:border-white/20 hover:bg-white/5 transition-all duration-300 relative ${localFile ? "border-emerald-500/20" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
      />
      <div
        className="w-full aspect-video rounded-xl bg-[#111] border border-white/5 overflow-hidden relative cursor-pointer"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-[8px] text-white/40 uppercase tracking-widest font-mono">
                Uploading...
              </p>
            </div>
          ) : localFile ? (
            isImageFile && localPreviewUrl ? (
              <img
                src={localPreviewUrl}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-emerald-500/10 to-teal-500/10 flex flex-col items-center justify-center p-4 text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
                <p className="text-[8px] text-white/50 truncate w-full font-mono">
                  {localFile.name}
                </p>
              </div>
            )
          ) : hasExistingFile ? (
            !existingPreviewFailed ? (
              <img
                src={existingUrl}
                alt={`${label} preview`}
                className="w-full h-full object-cover"
                onError={() => setExistingPreviewFailed(true)}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-500/10 to-cyan-500/10 flex flex-col items-center justify-center p-4 text-center">
                <CheckCircle2 size={24} className="text-blue-400 mb-2" />
                <p className="text-[8px] text-white/50 truncate w-full font-mono">
                  {existingFileName}
                </p>
              </div>
            )
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/doc:bg-white/10 transition-all">
              <Upload
                size={18}
                className="text-white/20 group-hover/doc:text-white"
              />
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
            {label}
          </h4>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all cursor-pointer"
            >
              <MoreVertical size={14} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-100"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute bottom-full right-0 mb-2 w-32 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl z-101 overflow-hidden"
                  >
                    {[
                      {
                        label: "View",
                        icon: Layout,
                        action: () =>
                          showToast("Viewer restricted in beta.", "info"),
                      },
                      {
                        label: "Download",
                        icon: Download,
                        action: () =>
                          showToast("Download started...", "success"),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        action: () => {
                          setLocalFile(null);
                          showToast("File deleted.");
                        },
                        destructive: true,
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors text-left ${item.destructive ? "text-rose-400 hover:bg-rose-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                      >
                        <item.icon size={12} />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest leading-none">
            {localFile
              ? (localFile.size / 1024 / 1024).toFixed(1) + " MB"
              : type}{" "}
            &bull;{" "}
            {localFile ? "Just now" : hasExistingFile ? "Uploaded" : date}
          </p>
          {(localFile || hasExistingFile) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardWidget({
  title,
  children,
  className = "",
  onManage,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  onManage: () => void;
}) {
  return (
    <div
      className={`bg-white/3 border border-white/10 rounded-3xl p-6 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-white/20 h-full ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 font-mono">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function TeamModal({
  item,
  userId,
  onClose,
}: {
  item: EnrolledItem;
  userId: string;
  onClose: () => void;
}) {
  const { showToast } = useDashboard();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const maxStr = item.teamSize.match(/\d+/g);
  const maxMembers = maxStr ? parseInt(maxStr[maxStr.length - 1]) : 1;
  const teamId = item.teamId || "";

  const teamDetailsQuery = useTeamDetails(teamId, Boolean(teamId));
  const sendInviteMutation = useSendTeamInvite();
  const transferLeaderMutation = useTransferTeamLeadership();
  const removeMemberMutation = useRemoveTeamMember();
  const removePendingInviteMutation = useRemovePendingTeamInvite();
  const leaveTeamMutation = useLeaveTeam();

  const teamDetails = teamDetailsQuery.data;
  const isTeamLeader =
    Boolean(teamDetails?.leaderId) &&
    String(teamDetails.leaderId) === String(userId);
  const members: TeamMember[] = Array.isArray(teamDetails?.members)
    ? teamDetails.members.map((entry: any) => {
        const memberUser = entry?.user || {};
        const teamMember = entry?.teamMember || {};
        const isLeader =
          Boolean(teamMember?.isLeader) ||
          String(memberUser?.id || "") === String(teamDetails?.leaderId || "");

        return {
          id: String(memberUser?.id || teamMember?.userId || ""),
          name: memberUser?.name || memberUser?.email || "Member",
          email: memberUser?.email || "",
          role: isLeader ? "leader" : "member",
          status: "confirmed",
          avatar: memberUser?.image || "",
        };
      })
    : [];

  const pendingInvites = Array.isArray(teamDetails?.invites)
    ? teamDetails.invites.filter((invite: any) => invite?.status === "PENDING")
    : [];

  const rejectedRegistrations = Array.isArray(
    teamDetails?.rejectedRegistrations,
  )
    ? teamDetails.rejectedRegistrations
    : [];

  const occupiedSlots = members.length + pendingInvites.length;
  const canAdd = isTeamLeader && occupiedSlots < maxMembers;

  const handleInvite = async () => {
    setInviteError("");

    const val = inviteEmail.trim();
    if (!teamId || !val || !canAdd) return;

    if (
      members.some(
        (m) =>
          m.email.toLowerCase() === val.toLowerCase() ||
          m.name.toLowerCase() === val.toLowerCase(),
      )
    ) {
      setInviteError("User is already in your team.");
      return;
    }

    try {
      await sendInviteMutation.mutateAsync({ teamId, invitedEmail: val });
      showToast(`Invite sent to ${val}.`, "success");
      setInviteEmail("");
      await teamDetailsQuery.refetch();
    } catch (error: any) {
      setInviteError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send invite.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#080808] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {item.title}
            </h2>
            <p className="text-xs text-white/30 mt-1 font-mono uppercase tracking-widest">
              Team Management &bull; {occupiedSlots}/{maxMembers} Slots
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto overflow-x-visible custom-scrollbar">
          {teamDetailsQuery.isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : teamDetailsQuery.isError ? (
            <p className="text-sm text-rose-300 border border-rose-300/30 bg-rose-900/20 rounded-xl px-4 py-3">
              Failed to load team details.
            </p>
          ) : (
            <>
              {/* Members List */}
              <div className="space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 font-mono">
                  Active Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/5 group hover:border-white/10 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img
                          src="/images/bg.jpeg"
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono mt-0.5">
                          {member.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTeamLeader && member.role !== "leader" && (
                          <>
                            <button
                              onClick={async () => {
                                if (!teamId) return;
                                try {
                                  await transferLeaderMutation.mutateAsync({
                                    teamId,
                                    newLeaderId: member.id,
                                  });
                                  showToast(
                                    "Leadership transferred.",
                                    "success",
                                  );
                                  await teamDetailsQuery.refetch();
                                } catch {
                                  showToast(
                                    "Failed to transfer leadership.",
                                    "error",
                                  );
                                }
                              }}
                              className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[9px] uppercase tracking-wider text-white/70 hover:text-white"
                            >
                              Make Lead
                            </button>
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {rejectedRegistrations.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-rose-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-300 font-mono">
                      Rejected Members
                    </h3>
                    <span className="text-[9px] uppercase tracking-widest font-mono text-rose-300">
                      Needs review
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rejectedRegistrations.map((entry: any) => {
                      const rejectedUser = entry?.user || {};
                      const reason =
                        entry?.registration?.rejectionReason ||
                        "Registration was rejected.";
                      const memberId = String(rejectedUser?.id || "");

                      return (
                        <div
                          key={entry?.registration?.id || memberId}
                          className="flex items-center justify-between p-3 rounded-xl border border-rose-500/30 bg-rose-500/10"
                        >
                          <div className="min-w-0 pr-4">
                            <p className="text-sm font-semibold text-white truncate">
                              {rejectedUser?.name ||
                                rejectedUser?.email ||
                                "Rejected user"}
                            </p>
                            <p className="text-[10px] text-rose-200/70 uppercase tracking-widest font-mono mt-0.5 truncate">
                              {reason}
                            </p>
                          </div>
                          {isTeamLeader && memberId ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!teamId) return;
                                try {
                                  await removeMemberMutation.mutateAsync({
                                    teamId,
                                    memberId,
                                  });
                                  showToast(
                                    "Rejected user removed from team.",
                                    "info",
                                  );
                                  await teamDetailsQuery.refetch();
                                } catch {
                                  showToast(
                                    "Failed to remove rejected user.",
                                    "error",
                                  );
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg border border-rose-300/30 text-[10px] font-mono uppercase tracking-wider text-rose-200 hover:bg-rose-500/15"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <AnimatePresence>
                {memberToRemove && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-60 bg-black/95 flex items-center justify-center p-8"
                  >
                    <div className="text-center max-w-xs">
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={24} />
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        Remove {memberToRemove.name}?
                      </h4>
                      <p className="text-xs text-white/40 mt-2 leading-relaxed">
                        This will revoke their access to this project
                        immediately.
                      </p>
                      <div className="flex gap-3 mt-8">
                        <button
                          onClick={() => setMemberToRemove(null)}
                          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!teamId) return;

                            try {
                              await removeMemberMutation.mutateAsync({
                                teamId,
                                memberId: memberToRemove.id,
                              });
                              showToast(
                                `${memberToRemove.name} removed.`,
                                "info",
                              );
                              setMemberToRemove(null);
                              await teamDetailsQuery.refetch();
                            } catch {
                              showToast("Failed to remove member.", "error");
                            }
                          }}
                          className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Invitation Section */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 font-mono">
                    Invite Peers
                  </h3>
                  <span
                    className={`text-[9px] uppercase tracking-widest font-mono ${canAdd ? "text-emerald-400" : "text-rose-400"}`}
                  >
                    {canAdd
                      ? "Available Slots Open"
                      : isTeamLeader
                        ? "Limit Reached"
                        : "Leader Access Required"}
                  </span>
                </div>

                <div className="relative">
                  <div
                    className={`p-1.5 rounded-2.5xl border transition-all flex items-center gap-2 ${isFocused ? "bg-white/5 border-white/20" : "bg-white/3 border-white/5"}`}
                  >
                    <div className="pl-3 text-white/20">
                      <Mail size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter name or email..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      disabled={!canAdd || sendInviteMutation.isPending}
                      className="bg-transparent border-none outline-none flex-1 py-3 text-sm text-white placeholder:text-white/10 font-medium"
                    />
                    <button
                      onClick={() => handleInvite()}
                      disabled={
                        !canAdd ||
                        !inviteEmail.trim() ||
                        sendInviteMutation.isPending
                      }
                      className="h-10 px-6 rounded-2xl bg-white text-black text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20 disabled:grayscale"
                    >
                      {sendInviteMutation.isPending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
                {inviteError && (
                  <p className="text-[10px] text-rose-400 font-mono ml-2">
                    {inviteError}
                  </p>
                )}
              </div>

              {/* Pending Invites */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 font-mono">
                  Pending Invites
                </h3>
                {pendingInvites.length === 0 ? (
                  <p className="text-xs text-white/40">No pending invites.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingInvites.map((invite: any) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/3"
                      >
                        <div>
                          <p className="text-xs text-white font-medium">
                            {invite.invitedEmail}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono">
                            Expires {formatDisplayDate(invite.expiresAt)}
                          </p>
                        </div>
                        {isTeamLeader && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!teamId) return;
                              try {
                                await removePendingInviteMutation.mutateAsync({
                                  teamId,
                                  inviteId: invite.id,
                                });
                                showToast("Pending invite removed.", "info");
                                await teamDetailsQuery.refetch();
                              } catch {
                                showToast(
                                  "Failed to remove pending invite.",
                                  "error",
                                );
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-rose-400/30 text-[10px] font-mono uppercase tracking-wider text-rose-300 hover:bg-rose-500/10"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isTeamLeader && teamId ? (
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await leaveTeamMutation.mutateAsync(teamId);
                        showToast("You left the team.", "info");
                        onClose();
                      } catch {
                        showToast("Failed to leave team.", "error");
                      }
                    }}
                    className="w-full py-3 rounded-xl border border-rose-400/30 text-rose-300 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/10"
                  >
                    Leave Team
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="px-8 py-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
          <p className="text-[9px] text-white/10 font-mono uppercase tracking-[0.3em]">
            Integrity verified &bull; 2m ago
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EnrolledCard({ item, href }: { item: EnrolledItem; href: string }) {
  const [showTeam, setShowTeam] = useState(false);
  const hasTeam = Boolean(item.teamId);
  const teamDetailsQuery = useTeamDetails(item.teamId || "", hasTeam);

  const cardTeamMembers: TeamMember[] = hasTeam
    ? Array.isArray(teamDetailsQuery.data?.members)
      ? teamDetailsQuery.data.members.map((entry: any) => {
          const memberUser = entry?.user || {};
          const teamMember = entry?.teamMember || {};
          const isLeader =
            Boolean(teamMember?.isLeader) ||
            String(memberUser?.id || "") ===
              String(teamDetailsQuery.data?.leaderId || "");

          return {
            id: String(memberUser?.id || teamMember?.userId || ""),
            name: memberUser?.name || memberUser?.email || "Member",
            email: memberUser?.email || "",
            role: isLeader ? "leader" : "member",
            status: "confirmed",
            avatar: memberUser?.image || "",
          };
        })
      : []
    : [];

  const fallbackTeamMembers = Array.isArray(item.team) ? item.team : [];
  const visibleTeamMembers =
    cardTeamMembers.length > 0 ? cardTeamMembers : fallbackTeamMembers;
  const visibleTeamCount = visibleTeamMembers.length;

  const statusColor: Record<string, string> = {
    open: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    closed: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    postponed: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    cancelled: "bg-white/5 border-white/10 text-white/30",
  };

  const normalizedRegistrationStatus = String(
    item.registrationStatus || "",
  ).toUpperCase();
  const normalizedPaymentStatus = String(
    item.paymentStatus || "",
  ).toUpperCase();
  const canCompletePayment = Boolean(
    item.kind === "competition" &&
    item.paymentRequired &&
    normalizedRegistrationStatus === "APPROVED" &&
    normalizedPaymentStatus !== "PAID" &&
    item.registrationId,
  );

  return (
    <>
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/14 transition-all duration-200 group">
        {/* Top row */}
        <div className="flex gap-4 items-center p-4">
          <div
            className="w-14 h-14 rounded-xl shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(/images/bg.jpeg)` }}
          />
          <div className="flex-1 min-w-0">
            <Link href={href}>
              <p className="text-sm font-semibold text-white truncate hover:text-white/80 transition-colors">
                {item.title}
              </p>
            </Link>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {item.category} · {item.date}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono ${statusColor[item.status]}`}
              >
                {item.status}
              </span>
              {item.kind === "competition" && item.paymentRequired ? (
                <span
                  className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono ${normalizedPaymentStatus === "PAID" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : normalizedPaymentStatus === "FAILED" || normalizedPaymentStatus === "EXPIRED" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}
                >
                  {normalizedPaymentStatus || "PENDING"}
                </span>
              ) : null}
              <span className="text-[10px] text-white/25 font-mono">
                {item.teamSize}
              </span>
            </div>
          </div>
        </div>

        {item.kind === "competition" && item.paymentRequired ? (
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[10px] uppercase tracking-widest font-mono text-white/30">
                {normalizedPaymentStatus === "PAID"
                  ? "Payment completed"
                  : normalizedRegistrationStatus !== "APPROVED"
                    ? "Payment unlocks after approval"
                    : "Payment pending"}
              </p>
              {canCompletePayment ? (
                <button
                  type="button"
                  onClick={() =>
                    item.onRetryPayment?.(String(item.registrationId || ""))
                  }
                  disabled={
                    item.retryingRegistrationId === item.registrationId ||
                    Boolean(item.disablePaymentAction)
                  }
                  className="px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 text-[10px] uppercase tracking-wider font-mono text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {item.retryingRegistrationId === item.registrationId
                    ? "Opening..."
                    : "Complete Payment"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {hasTeam && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Avatar stack */}
                <div className="flex -space-x-2">
                  {visibleTeamMembers.slice(0, 4).map((m) => (
                    <div
                      key={m.id || m.name}
                      className="w-6 h-6 rounded-full ring-1 ring-black/50 overflow-hidden bg-white/10"
                      title={m.name}
                    >
                      <img
                        src="/images/bg.jpeg"
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {visibleTeamCount > 4 && (
                    <span className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-[10px] text-white/70 grid place-items-center font-mono">
                      +{visibleTeamCount - 4}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-white/45 font-mono">
                  {visibleTeamCount} member
                  {visibleTeamCount === 1 ? "" : "s"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTeam(true)}
                className="px-3 py-1.5 rounded-lg border border-white/15 text-[10px] uppercase tracking-wider font-mono text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                View Team
              </button>
            </div>
          </div>
        )}
      </div>

      {showTeam && (
        <TeamModal
          item={item}
          userId={String(item.currentUserId || "")}
          onClose={() => setShowTeam(false)}
        />
      )}
    </>
  );
}

function MemberProfileModal({
  member,
  onClose,
}: {
  member: TeamMember | any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-sm bg-[#080808] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 mb-6 shadow-2xl transition-transform group-hover:scale-105 duration-500">
              <img
                src="/images/bg.jpeg"
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#080808]"></div>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            {member.name}
          </h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono mt-2">
            {member.role || "Member"}
          </p>

          <div className="w-full h-px bg-white/5 my-8"></div>

          <div className="w-full space-y-5 text-left">
            <div>
              <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono mb-2">
                About & Bio
              </p>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                Expert in {member.role || "this field"} with a focus on
                collaborative problem solving and innovative design thinking.
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono mb-3">
                Presence
              </p>
              <div className="flex gap-3">
                {["Github", "X", "LinkedIn"].map((sn) => (
                  <div
                    key={sn}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] text-white/40 font-mono uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    {sn}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-10 w-full py-4 rounded-2xl bg-white text-black text-[10px] font-extrabold uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all"
          >
            Close Member Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
function ProfilePanel({
  profile,
  set,
  userId,
  updateProfileMutation,
  setProfile,
}: {
  profile: ProfileState;
  set: (key: keyof ProfileState) => (val: string) => void;
  userId: string;
  updateProfileMutation: any;
  setProfile: (
    p: ProfileState | ((prev: ProfileState) => ProfileState),
  ) => void;
}) {
  const { showToast, setExpandedID } = useDashboard();

  const isPersonalDataComplete = Boolean(
    (profile.name || profile.email) &&
    profile.gender &&
    (profile.city || profile.state),
  );

  const uploadFile =
    (field: "collegeIdPic" | "govtIdPic" | "image") => async (file: File) => {
      if (!userId) return;
      try {
        await updateProfileMutation.mutateAsync({
          userId,
          [field]: file,
        });
        setProfile((p: ProfileState) => ({
          ...p,
          [field]: URL.createObjectURL(file),
        }));
        showToast(`${field} uploaded successfully.`, "success");
      } catch {
        showToast(`Failed to upload ${field}.`, "error");
      }
    };

  const completedCount = [
    isPersonalDataComplete,
    Boolean(profile.college && profile.year),
    Boolean(profile.email),
    Boolean(profile.whatsapp),
    Boolean(profile.collegeIdPic),
    Boolean(profile.govtIdPic),
  ].filter(Boolean).length;
  const totalChecks = 6;
  const score = Math.round((completedCount / totalChecks) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Top Row */}
      <div className="lg:col-span-8">
        <DashboardWidget
          title="Personal information"
          onManage={() =>
            showToast(
              "Profile archival and history logs are currently restricted.",
              "info",
            )
          }
        >
          <div className="flex flex-col">
            <EditableRow
              label="Full Name"
              value={profile.name}
              onChange={set("name")}
              locked
            />
            <EditableRow
              label="Gender"
              value={profile.gender}
              onChange={set("gender")}
              options={["MALE", "FEMALE", "OTHER"]}
              placeholder="Select gender"
            />
            <EditableRow
              label="Phone"
              value={profile.whatsapp}
              onChange={set("whatsapp")}
              placeholder="+91 XXXXX XXXXX"
            />
            <EditableRow
              label="College"
              value={profile.college}
              onChange={set("college")}
              placeholder="Your college"
            />
            <EditableRow
              label="Year of study"
              value={profile.year}
              onChange={set("year")}
              placeholder="e.g. 3rd Year"
            />
            <EditableRow
              label="Email"
              value={profile.email}
              onChange={set("email")}
              locked
            />
            <EditableRow
              label="Address"
              value={`${profile.city}${profile.city && profile.state ? ", " : ""}${profile.state}`}
              onChange={async (value: string) => {
                const [cityPart, ...rest] = value
                  .split(",")
                  .map((s) => s.trim());
                const city = cityPart || "";
                const state = rest.join(", ") || "";

                if (profile.city === city && profile.state === state) return;

                const previousCity = profile.city;
                const previousState = profile.state;
                setProfile((p) => ({ ...p, city, state }));

                if (!userId) return;

                try {
                  await updateProfileMutation.mutateAsync({
                    userId,
                    city,
                    state,
                  });
                  showToast("Profile updated successfully.", "success");
                } catch {
                  setProfile((p) => ({
                    ...p,
                    city: previousCity,
                    state: previousState,
                  }));
                  showToast("Failed to update profile.", "error");
                }
              }}
            />
          </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
        <DashboardWidget
          title="Documents"
          onManage={() =>
            showToast(
              "Document verification engine is running in the background.",
              "info",
            )
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <DocumentCard
              label="College ID"
              type="Card"
              date="Mar 2026"
              onUpload={uploadFile("collegeIdPic")}
              existingUrl={profile.collegeIdPic}
            />
            <DocumentCard
              label="Aadhaar"
              type="Card"
              date="Mar 2026"
              onUpload={uploadFile("govtIdPic")}
              existingUrl={profile.govtIdPic}
            />
          </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-6">
        <DashboardWidget
          title="Identity Card"
          className="flex flex-col justify-center items-center py-10"
          onManage={() =>
            showToast("ID Customization coming soon in v4.0.", "info")
          }
        >
          <div
            className="w-full max-w-70 cursor-pointer active:scale-[0.98] transition-all hover:brightness-110"
            onClick={() => setExpandedID(true)}
          >
            <ProfileCard
              name={profile.name}
              title={profile.college}
              handle={(profile.email || "").split("@")[0] || ""}
              status={profile.year}
              contactText="VIEW FULL ID"
              avatarUrl="/images/bg.jpeg"
              showUserInfo={false}
              enableTilt={true}
              enableMobileTilt={false}
              behindGlowColor="rgba(125, 190, 255, 0.4)"
              iconUrl="https://static.vecteezy.com/system/resources/thumbnails/010/332/153/small_2x/code-flat-color-outline-icon-free-png.png"
              behindGlowEnabled
              innerGradient="linear-gradient(145deg,#2e106510 0%,#1e3a8a20 100%)"
            />
          </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-6">
        <DashboardWidget
          title={`Data completion ${completedCount}/${totalChecks}`}
          onManage={() =>
            showToast(
              "Analysis complete. You are in the top 5% of verified users.",
              "info",
            )
          }
        >
          <div className="space-y-4">
            {[
              {
                label: "Personal data",
                done: isPersonalDataComplete,
              },
              {
                label: "Education",
                done: Boolean(profile.college && profile.year),
              },
              { label: "Email address", done: Boolean(profile.email) },
              { label: "Phone number", done: Boolean(profile.whatsapp) },
              { label: "College ID", done: Boolean(profile.collegeIdPic) },
              { label: "Government ID", done: Boolean(profile.govtIdPic) },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 group cursor-pointer"
                onClick={() =>
                  showToast(
                    `Requirement: ${item.label} (${item.done ? "Fulfilled" : "Pending"})`,
                    "info",
                  )
                }
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.done ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/10 text-white/5 group-hover:border-white/20"}`}
                >
                  {item.done && <CheckCircle2 size={12} strokeWidth={3} />}
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors ${item.done ? "text-white/60" : "text-white/30 group-hover:text-white/50"}`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">
                Profile Score
              </p>
              <p className="text-xl font-bold text-white mt-1">{score}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">
              {score}%
            </div>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function CompetitionsPanel({
  competitions,
  userId,
  onRetryPayment,
  retryingRegistrationId,
  disablePaymentAction,
}: {
  competitions: EnrolledItem[];
  userId: string;
  onRetryPayment: (registrationId: string) => Promise<void>;
  retryingRegistrationId: string | null;
  disablePaymentAction: boolean;
}) {
  const { showToast } = useDashboard();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget
          title="My Competitions"
          onManage={() =>
            showToast("Competition migration logs in progress.", "info")
          }
        >
          <div className="space-y-4">
            {competitions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
                <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest leading-relaxed">
                  No registrations found.
                </p>
                <Link
                  href="/competitions"
                  className="mt-4 inline-block text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all"
                >
                  Explore all &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {competitions.map((c) => (
                  <EnrolledCard
                    key={c.slug}
                    item={{
                      ...c,
                      currentUserId: userId,
                      onRetryPayment,
                      retryingRegistrationId,
                      disablePaymentAction,
                    }}
                    href={`/competitions/${c.slug}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function EventsPanel({ events }: { events: EnrolledItem[] }) {
  const { showToast } = useDashboard();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget
          title="Enrolled Events"
          onManage={() =>
            showToast("Reviewing event enrollment history.", "info")
          }
        >
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
                <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest leading-relaxed">
                  No events found.
                </p>
                <Link
                  href="/events"
                  className="mt-4 inline-block text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all"
                >
                  Browse Events &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <EnrolledCard
                    key={e.slug}
                    item={e}
                    href={`/events/${e.slug}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function CalendarPanel({
  competitions,
  events,
}: {
  competitions: EnrolledItem[];
  events: EnrolledItem[];
}) {
  const { showToast } = useDashboard();
  const [viewMode, setViewMode] = useState<"schedule" | "month">("schedule");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

  const generateGoogleCalLink = (title: string, dateStr: string) => {
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent(title);
    const dayMatch = dateStr.match(/\d+/);
    const day = dayMatch ? dayMatch[0] : "01";
    const isApril = dateStr.toLowerCase().includes("apr");
    const month = isApril ? "04" : "03";
    const dateParam = `2026${month}${day.padStart(2, "0")}T100000Z/2026${month}${day.padStart(2, "0")}T120000Z`;
    return `${baseUrl}&text=${text}&dates=${dateParam}&details=Neutron+Event+Registry`;
  };

  const schedule = [
    ...competitions.map((c) => ({ ...c, type: "Competition" })),
    ...events.map((e) => ({ ...e, type: "Event" })),
  ].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const groupedSchedule = schedule.reduce(
    (acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    },
    {} as Record<string, typeof schedule>,
  );

  const sortedDates = Object.keys(groupedSchedule)
    .filter((dateStr) => {
      const d = new Date(dateStr);
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    })
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, full: null });
    }
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = new Date(year, month, i).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      days.push({ day: i, full: fullDate });
    }
    while (days.length < 42) {
      days.push({ day: null, full: null });
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      if (next.getFullYear() < 2026) return prev;
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      if (next.getFullYear() > 2026) return prev;
      return next;
    });
  };

  const currentMonthName = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget
          title="Schedule Dashboard"
          onManage={() =>
            showToast("Syncing with Google Calendar API...", "info")
          }
        >
          <div className="max-w-5xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 px-4 gap-6">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {viewMode === "schedule" ? "Timeline" : currentMonthName}{" "}
                  <span className="text-white/20 ml-2 font-light">2026</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="hidden md:flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1">
                <button
                  onClick={() => setViewMode("schedule")}
                  className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-extrabold transition-all ${viewMode === "schedule" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"}`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-extrabold transition-all ${viewMode === "month" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"}`}
                >
                  Month
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "schedule" ? (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-16 px-4"
                >
                  <div className="flex items-center gap-4 mb-4 opacity-50">
                    <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent"></div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] font-mono">
                      {currentMonthName} 2026
                    </h3>
                    <div className="h-px flex-1 bg-linear-to-l from-white/10 to-transparent"></div>
                  </div>

                  {sortedDates.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <Calendar size={24} className="text-white/10" />
                      </div>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] font-mono">
                        No events aligned for this month
                      </p>
                      <button
                        onClick={handleNextMonth}
                        className="mt-6 text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
                      >
                        Next Month &rarr;
                      </button>
                    </div>
                  ) : (
                    sortedDates.map((dateStr) => {
                      const dayEvents = groupedSchedule[dateStr];
                      const dateObj = new Date(dateStr);
                      const month = dateObj
                        .toLocaleString("en-US", { month: "short" })
                        .toUpperCase();
                      const day = dateObj.getDate();
                      const isToday = false;

                      return (
                        <div
                          key={dateStr}
                          className="flex flex-col md:flex-row gap-6 md:gap-12 relative group"
                        >
                          <div className="md:w-28 shrink-0 md:text-right md:sticky md:top-24 h-fit">
                            <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0">
                              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.3em] font-mono mb-1">
                                {month}
                              </p>
                              <p className="text-4xl md:text-5xl font-light text-white tracking-tighter leading-none">
                                {day}
                                <span className="text-sm md:text-base ml-1 opacity-20 font-mono">
                                  th
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 space-y-6 pb-4 border-l-2 md:border-l-2 border-white/5 pl-8 md:pl-12 relative">
                            <div className="absolute -left-px top-4 bottom-0 w-0.5 bg-linear-to-b from-white/10 via-white/5 to-transparent"></div>

                            {dayEvents.map((item) => (
                              <div
                                key={item.slug}
                                className="relative group/item"
                              >
                                <div className="absolute -left-9.25 md:-left-13.25 top-5 w-4 h-4 rounded-full border-4 border-[#000000] bg-white/10 group-hover/item:bg-emerald-500 group-hover/item:scale-125 transition-all duration-300 z-10 shadow-[0_0_15px_rgba(16,185,129,0)] group-hover/item:shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>

                                <div className="bg-white/2 border border-white/8 rounded-3xl p-6 md:p-8 hover:border-white/20 hover:bg-white/4 transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group/card overflow-hidden relative">
                                  <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0 group-hover/card:scale-105 transition-transform duration-500">
                                      <img
                                        src="/images/bg.jpeg"
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span
                                          className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${item.type === "Competition" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}
                                        >
                                          {item.type}
                                        </span>
                                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-mono">
                                          <Target
                                            size={12}
                                            className="text-white/20"
                                          />
                                          <span>10:00 — 18:00 IST</span>
                                        </div>
                                      </div>
                                      <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover/card:text-emerald-400 transition-colors duration-300">
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center gap-4 mt-3">
                                        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono">
                                          {item.category}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono">
                                          Global Entry
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 relative z-10">
                                    <button
                                      onClick={() => {
                                        const link = generateGoogleCalLink(
                                          item.title,
                                          item.date,
                                        );
                                        window.open(link, "_blank");
                                        showToast(
                                          "Syncing with Google Calendar...",
                                          "success",
                                        );
                                      }}
                                      className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 group/btn"
                                    >
                                      <Calendar
                                        size={16}
                                        className="group-hover/btn:scale-110 transition-transform"
                                      />
                                      <span className="hidden sm:inline">
                                        Add to Calendar
                                      </span>
                                      <span className="sm:hidden">Sync</span>
                                    </button>
                                    <Link
                                      href={`/${item.type === "Competition" ? "competitions" : "events"}/${item.slug}`}
                                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                      <ChevronRight size={20} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-4"
                >
                  <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div
                          key={d}
                          className="bg-[#050505] p-4 text-center border-b border-white/10"
                        >
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">
                            {d}
                          </span>
                        </div>
                      ),
                    )}
                    {getDaysInMonthGrid(currentDate).map((d, i) => {
                      const hasEvents = d.full ? groupedSchedule[d.full] : null;
                      return (
                        <div
                          key={`${d.full}-${i}`}
                          className={`bg-[#030303] min-h-30 p-4 border-r border-b border-white/5 group hover:bg-white/2 transition-all relative ${d.day ? "cursor-pointer" : "opacity-10 pointer-events-none"}`}
                          onClick={() => hasEvents && setViewMode("schedule")}
                        >
                          <span className="text-sm font-light text-white/20 group-hover:text-white transition-colors">
                            {d.day}
                          </span>
                          <div className="mt-4 space-y-1.5">
                            {hasEvents?.slice(0, 2).map((ev) => (
                              <div
                                key={ev.slug}
                                className={`h-1.5 w-full rounded-full ${ev.type === "Competition" ? "bg-amber-500" : "bg-emerald-500"} opacity-40 group-hover:opacity-100 transition-opacity`}
                              ></div>
                            ))}
                            {(hasEvents?.length || 0) > 2 && (
                              <div className="h-1 text-[8px] font-bold text-white/10 group-hover:text-white/40 font-mono text-center">
                                +{hasEvents!.length - 2} MORE
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function InboxPanel({
  invites,
  onAccept,
  onDecline,
  isMutating,
}: {
  invites: any[];
  onAccept: (inviteToken: string) => void;
  onDecline: (inviteToken: string) => void;
  isMutating: boolean;
}) {
  const { showToast } = useDashboard();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget
          title="Team Invites"
          onManage={() =>
            showToast("Scanning global network for pending invites...", "info")
          }
        >
          <div className="space-y-3 max-w-4xl mx-auto py-4">
            {invites.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
                <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest leading-relaxed">
                  No pending invites.
                </p>
              </div>
            )}
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 sm:items-center justify-between hover:border-white/20 hover:bg-white/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                    <img
                      src="/images/bg.jpeg"
                      alt={inv.user}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">
                      {inv.user}{" "}
                      <span className="text-white/30 font-normal ml-1">
                        invited you to join
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-400 font-bold mt-1 uppercase tracking-wider">
                      {inv.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                        {inv.time}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10"></span>
                      <span className="text-[9px] text-white/50 border border-white/10 rounded-lg px-2 py-0.5 bg-white/5 font-bold uppercase tracking-widest">
                        {inv.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onDecline(inv.inviteToken)}
                    disabled={isMutating}
                    className="h-10 px-5 bg-white/5 border border-white/10 text-white hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAccept(inv.inviteToken)}
                    disabled={isMutating}
                    className="h-10 px-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Accept Invite
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function SidebarNav({
  active,
  setActive,
}: {
  active: any;
  setActive: (v: any) => void;
}) {
  const items = [
    { id: "profile", label: "Profile", icon: User },
    { id: "competitions", label: "Competitions", icon: Award },
    { id: "events", label: "Events", icon: Zap },
    { id: "campus-ambassador", label: "Campus Ambassador", icon: Star },
    { id: "inbox", label: "Inbox", icon: Mail },
  ];

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActive(item.id)}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
            active === item.id
              ? "text-white"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          {active === item.id && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl shadow-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p
                className={`text-[12px] font-extrabold uppercase tracking-widest ${active === item.id ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
              >
                {item.label}
              </p>
            </div>
            {active === item.id && (
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            )}
          </div>
        </button>
      ))}
    </nav>
  );
}

function CampusAmbassadorPanel({
  campusAmbassador,
  profileName,
}: {
  campusAmbassador: Record<string, any> | null;
  profileName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const referralCode = String(campusAmbassador?.referralCode || "").trim();
  const referralLink = referralCode
    ? `${origin || ""}/?ref=${encodeURIComponent(referralCode)}`
    : "";

  const copyLink = async () => {
    if (!referralLink || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <DashboardWidget title="Campus Ambassador" onManage={() => {}}>
        {campusAmbassador ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                  Referral Code
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {referralCode || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                  Approved Registrations
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {campusAmbassador.totalRegistrations || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                  Ambassador
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {profileName || campusAmbassador.name || "User"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                Referral Link
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10"
                >
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-sm text-white/60">
            You are not currently a Campus Ambassador.
          </div>
        )}
      </DashboardWidget>
    </div>
  );
}

const ThreeStarsBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#000000", 0.001);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      2000,
    );
    camera.position.z = 800;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const txLoader = new THREE.TextureLoader();
    const starImg1 = txLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png",
    );
    const starImg2 = txLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/circle.png",
    );
    const starImg3 = txLoader.load(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/snowflake1.png",
    );

    const createLayer = (
      count: number,
      size: number,
      texture: THREE.Texture,
      color: string,
      zRange: number,
    ) => {
      const geo = new THREE.BufferGeometry();
      const pos = [];
      for (let i = 0; i < count; i++) {
        pos.push(
          (Math.random() - 0.5) * 2500,
          (Math.random() - 0.5) * 2500,
          (Math.random() - 0.5) * zRange,
        );
      }
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        color,
        depthWrite: false,
      });
      return new THREE.Points(geo, mat);
    };

    const layer1 = createLayer(800, 3, starImg1, "#88aaff", 1000);
    layer1.position.z = -600;
    scene.add(layer1);

    const layer2 = createLayer(400, 7, starImg2, "#ffd7aa", 800);
    layer2.position.z = -200;
    scene.add(layer2);

    const layer3 = createLayer(150, 14, starImg3, "#ffffff", 600);
    layer3.position.z = 100;
    scene.add(layer3);

    let targetScrollY = 0;
    let currentScrollY = 0;

    if (typeof window !== "undefined") {
      targetScrollY = window.scrollY;
      currentScrollY = window.scrollY;
    }

    const onScroll = () => {
      targetScrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", resize);

    let animFrame = 0;
    let time = 0;
    const tick = () => {
      time += 0.005;
      currentScrollY += (targetScrollY - currentScrollY) * 0.08;

      layer1.position.y = currentScrollY * 0.08;
      layer2.position.y = currentScrollY * 0.25;
      layer3.position.y = currentScrollY * 0.6;

      layer1.rotation.y = time * 0.05;
      layer2.rotation.y = time * 0.08;
      layer3.rotation.y = time * 0.15;

      renderer.render(scene, camera);
      animFrame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full mix-blend-screen opacity-70"
    />
  );
};

export default function ProfilePage() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const authMeQuery = useAuthMe();
  const updateProfileMutation = useUpdateUserProfile();
  const myRegistrationsQuery = useMyRegistrations(Boolean(authMeQuery.data));
  const retryPaymentMutation = useRetryRegistrationPayment();
  const pendingInvitesQuery = usePendingTeamInvites(Boolean(authMeQuery.data));
  const acceptInviteMutation = useAcceptTeamInvite();
  const declineInviteMutation = useDeclineTeamInvite();

  const [active, setActive] = useState<NavItem>("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [retryingRegistrationId, setRetryingRegistrationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) return;

    const normalized = section.toLowerCase();
    if (normalized === "inbox" || normalized === "invites") {
      setActive("inbox");
    } else if (
      normalized === "campus-ambassador" ||
      normalized === "campus ambassador" ||
      normalized === "ca"
    ) {
      setActive("campus-ambassador");
    }
  }, [searchParams]);

  // Toast System
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast(null);
    setTimeout(() => setToast({ message, type }), 10);
  };

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);

  const authUser = ((authMeQuery.data as any)?.data?.user ||
    (authMeQuery.data as any)?.user ||
    authMeQuery.data) as Record<string, any> | undefined;
  const userId = (authUser?.id || authUser?._id || "") as string;
  const isSuperAdmin = String(authUser?.role || "").toUpperCase() === "SA";
  const campusAmbassador = (authUser?.campusAmbassador || null) as Record<
    string,
    any
  > | null;

  useEffect(() => {
    if (!authUser) return;

    setProfile({
      name: authUser.name || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      college: authUser.collegeName || "",
      year: authUser.yearOfStudy || "",
      gender: authUser.gender || "",
      city: authUser.city || "",
      state: authUser.state || "",
      whatsapp: authUser.whatsappNumber || "",
      image: authUser.image || "",
      collegeIdPic: authUser.collegeIdPic || "",
      govtIdPic: authUser.govtIdPic || "",
    });
  }, [authUser]);

  const set = (key: keyof ProfileState) => async (val: string) => {
    let normalized =
      key === "gender" ? normalizeGender(val ?? "") : (val ?? "").trim();

    if (key === "whatsapp") {
      const digitsOnly = normalized.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        showToast("Phone number must be between 10 and 15 digits.", "error");
        return;
      }
    }

    if (profile[key] === normalized) return;

    const previous = profile[key];
    setProfile((p) => ({ ...p, [key]: normalized }));

    if (!userId) return;

    const payloadByField: Partial<
      Record<keyof ProfileState, Record<string, string>>
    > = {
      city: { city: normalized },
      state: { state: normalized },
      college: { collegeName: normalized },
      gender: { gender: normalized },
      whatsapp: { whatsappNumber: normalized },
      year: { yearOfStudy: normalized },
    };

    const payload = payloadByField[key];
    if (!payload) return;
    if (key === "gender" && !normalized) return;

    try {
      await updateProfileMutation.mutateAsync({ userId, ...payload });
      showToast("Profile updated successfully.", "success");
    } catch {
      setProfile((p) => ({ ...p, [key]: previous }));
      showToast("Failed to update profile.", "error");
    }
  };

  const [expandedID, setExpandedID] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const isPersonalDataComplete = Boolean(
    (profile.name || profile.email) &&
    profile.gender &&
    (profile.city || profile.state),
  );
  const isIdentityComplete = Boolean(
    isPersonalDataComplete &&
    profile.college &&
    profile.year &&
    profile.email &&
    profile.whatsapp &&
    profile.collegeIdPic &&
    profile.govtIdPic,
  );
  const myQRCodeQuery = useMyQRCode(expandedID && isIdentityComplete);
  const shouldFlipToQR = isIdentityComplete && Boolean(myQRCodeQuery.data);

  const registrations = Array.isArray(myRegistrationsQuery.data)
    ? myRegistrationsQuery.data
    : [];

  const handleRetryPayment = async (registrationId: string) => {
    if (!registrationId) return;

    setRetryingRegistrationId(registrationId);
    try {
      const result = await retryPaymentMutation.mutateAsync(registrationId);
      const checkoutUrl =
        result?.paymentSession?.checkoutUrl || result?.checkoutUrl || null;

      if (checkoutUrl && typeof window !== "undefined") {
        window.location.assign(checkoutUrl);
        return;
      }

      showToast(
        "Payment session created but checkout URL is missing. Please try again.",
        "error",
      );
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to start payment retry.",
        "error",
      );
    } finally {
      setRetryingRegistrationId(null);
    }
  };

  const enrolledItems: EnrolledItem[] = registrations
    .map((entry: any) => {
      const competition = entry?.competition || {};
      const registration = entry?.registration || {};
      const competitionType = String(
        competition?.eventType || competition?.type || "",
      ).toUpperCase();
      const kind: EnrolledItem["kind"] = competitionType.includes("EVENT")
        ? "event"
        : "competition";

      const id = String(competition?.id || "");
      if (!id) return null;

      return {
        kind,
        id,
        slug: id,
        registrationId: String(registration?.id || ""),
        registrationStatus: String(registration?.status || ""),
        paymentStatus: String(registration?.paymentStatus || ""),
        paymentRequired: Boolean(competition?.isPaid),
        paymentVerifiedAt: registration?.paymentVerifiedAt,
        teamId: entry?.team?.id || entry?.registration?.teamId || undefined,
        title: competition?.title || "",
        image: competition?.posterPath || "",
        category: competition?.category || competition?.type || "",
        date: formatDisplayDate(
          competition?.startTime || competition?.createdAt,
        ),
        status: toDashboardStatus(competition?.status),
        teamSize: formatTeamSize(
          competition?.minTeamSize,
          competition?.maxTeamSize,
        ),
        team: [],
      };
    })
    .filter(Boolean) as EnrolledItem[];

  const competitionItems = enrolledItems.filter(
    (item) => item.kind === "competition",
  );
  const eventItems = enrolledItems.filter((item) => item.kind === "event");

  const pendingInvites = Array.isArray(pendingInvitesQuery.data)
    ? pendingInvitesQuery.data
    : [];
  const inboxInvites = pendingInvites.map((item: any) => ({
    id: item?.invite?.id || item?.invite?.inviteToken,
    inviteToken: item?.invite?.inviteToken,
    title: item?.competition?.title || "",
    user: item?.inviter?.name || item?.inviter?.email || "",
    avatar: item?.inviter?.image || "",
    time: timeAgo(item?.invite?.createdAt),
    role: item?.team?.name || "Team Invite",
  }));

  const isLoadingData =
    authMeQuery.isLoading ||
    myRegistrationsQuery.isLoading ||
    pendingInvitesQuery.isLoading;

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-mono">
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ showToast, setExpandedID }}>
      <div className="min-h-screen bg-black text-white selection:bg-white/20 relative">
        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
          {selectedMember && (
            <MemberProfileModal
              member={selectedMember}
              onClose={() => setSelectedMember(null)}
            />
          )}
          {expandedID && (
            <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpandedID(false)}
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
                transition={{ type: "spring", damping: 20 }}
                className="relative z-10 w-full max-w-md perspective-2000"
              >
                <motion.div
                  animate={{ rotateY: shouldFlipToQR ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="relative w-full"
                >
                  <div style={{ backfaceVisibility: "hidden" }}>
                    <ProfileCard
                      name={profile.name}
                      title={profile.college}
                      handle={(profile.email || "").split("@")[0] || ""}
                      status={profile.year}
                      contactText={
                        isIdentityComplete
                          ? "SCANNABLE ID READY"
                          : "DOWNLOAD ID"
                      }
                      avatarUrl="/images/bg.jpeg"
                      showUserInfo={false}
                      enableTilt={true}
                      enableMobileTilt={true}
                      behindGlowColor="rgba(125, 190, 255, 0.6)"
                      iconUrl="https://static.vecteezy.com/system/resources/thumbnails/010/332/153/small_2x/code-flat-color-outline-icon-free-png.png"
                      behindGlowEnabled
                      innerGradient="linear-gradient(145deg,#2e106520 0%,#1e3a8a40 100%)"
                    />
                  </div>

                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    className="absolute inset-0 rounded-[30px] border border-white/10 bg-[#0a0a0a] p-6 flex flex-col items-center justify-center"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-4">
                      Entry QR
                    </p>
                    {myQRCodeQuery.data ? (
                      <img
                        src={myQRCodeQuery.data}
                        alt="Identity QR"
                        className="w-44 h-44 rounded-xl bg-white p-2"
                      />
                    ) : (
                      <div className="w-44 h-44 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    <p className="text-[10px] text-white/40 mt-4 font-mono uppercase tracking-widest">
                      {isIdentityComplete
                        ? ""
                        : "Complete profile to unlock QR"}
                    </p>
                  </div>
                </motion.div>
                <button
                  onClick={() => setExpandedID(false)}
                  className="mt-12 mx-auto flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-rose-400 uppercase tracking-widest transition-all group"
                >
                  <X
                    size={14}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  Close Identity Viewer
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.65) saturate(1.2) contrast(1.1)",
            scale: 1.1,
            y: bgY,
          }}
        />
        <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-[#030303]/40 via-[#030303]/80 to-[#030303]" />

        <ThreeStarsBackground />

        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/15 backdrop-blur-3xl bg-white/2 flex items-center px-6 gap-4 shadow-2xl">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <img
              src="/neutron.png"
              alt="Neutron"
              className="h-8 w-8 opacity-90"
            />
            <span className="font-bold text-white tracking-wide hidden sm:block">
              Neutron
            </span>
          </Link>
          <div className="flex-1" />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-white/70 hover:text-white rounded-lg active:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2.5">
            {isSuperAdmin ? (
              <Link
                href="/admin/sa/users"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-extrabold uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Admin Users
              </Link>
            ) : null}
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/15">
              <img
                src="/images/bg.jpeg"
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-white/60 hidden sm:block">
              {profile.name}
            </span>
          </div>
        </header>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 top-14 z-40 bg-[#0c0c0c] flex flex-col p-6 overflow-y-auto md:hidden"
            >
              <SidebarNav
                active={active}
                setActive={(v: any) => {
                  setActive(v);
                  setMobileMenuOpen(false);
                }}
              />

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                {isSuperAdmin ? (
                  <Link
                    href="/admin/sa/user"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm font-medium text-white/80">
                      Admin Users
                    </span>
                    <span className="text-white/40">→</span>
                  </Link>
                ) : null}
                <Link
                  href="/competitions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-medium text-white/80">
                    All Competitions
                  </span>
                  <span className="text-white/40">→</span>
                </Link>
                <Link
                  href="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm font-medium text-white/80">
                    All Events
                  </span>
                  <span className="text-white/40">→</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex pt-14 relative z-10 w-full min-h-[calc(100vh-3.5rem)]">
          <aside className="w-64 shrink-0 h-[calc(100vh-3.5rem)] border-r border-white/15 bg-white/1 backdrop-blur-3xl hidden md:flex flex-col px-4 py-8 sticky top-14 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 px-3 pb-8 mb-6 border-b border-white/10">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                  <img
                    src="/images/bg.jpeg"
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {profile.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <p className="text-[9px] uppercase tracking-widest text-white/30 font-mono">
                      Verified
                    </p>
                  </div>
                </div>
              </div>

              <SidebarNav active={active} setActive={setActive} />

              <div className="mt-auto flex flex-col gap-1.5 pt-6 border-t border-white/6">
                <button
                  onClick={async () => {
                    if (isLoggingOut) return;
                    setIsLoggingOut(true);
                    try {
                      await logout();
                    } finally {
                      setIsLoggingOut(false);
                    }
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-mono text-white/20 hover:text-rose-400 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M16 17l5-5-5-5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 12H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 w-full overflow-x-hidden min-h-screen bg-[#030303]/20">
            <div className="max-w-400 mx-auto px-6 lg:px-12 py-10 w-full">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white capitalize">
                    {active}
                  </h1>
                  <p className="text-xs text-white/30 mt-1.5 font-mono uppercase tracking-widest">
                    Dashboard &bull; {active}
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {active === "profile" && (
                    <ProfilePanel
                      profile={profile}
                      set={set}
                      userId={userId}
                      updateProfileMutation={updateProfileMutation}
                      setProfile={setProfile}
                    />
                  )}
                  {active === "competitions" && (
                    <CompetitionsPanel
                      competitions={competitionItems}
                      userId={userId}
                      onRetryPayment={handleRetryPayment}
                      retryingRegistrationId={retryingRegistrationId}
                      disablePaymentAction={retryPaymentMutation.isPending}
                    />
                  )}
                  {active === "events" && <EventsPanel events={eventItems} />}
                  {active === "campus-ambassador" && (
                    <CampusAmbassadorPanel
                      campusAmbassador={campusAmbassador}
                      profileName={profile.name}
                    />
                  )}
                  {active === "inbox" && (
                    <InboxPanel
                      invites={inboxInvites}
                      onAccept={async (inviteToken) => {
                        if (!inviteToken) {
                          showToast("Invalid invite token.", "error");
                          return;
                        }

                        try {
                          const data = await acceptInviteMutation.mutateAsync({
                            inviteToken,
                          });
                          const competitionId = data?.competition?.id;
                          const teamId = data?.team?.id;

                          showToast("Invite accepted.", "success");

                          if (competitionId && teamId) {
                            router.push(
                              `/competitions/${competitionId}/register?mode=member&teamId=${teamId}`,
                            );
                          }
                        } catch {
                          showToast("Failed to accept invite.", "error");
                        }
                      }}
                      onDecline={(inviteToken) => {
                        if (!inviteToken) {
                          showToast("Invalid invite token.", "error");
                          return;
                        }

                        declineInviteMutation.mutate(
                          { inviteToken },
                          {
                            onSuccess: () =>
                              showToast("Invite declined.", "info"),
                            onError: () =>
                              showToast("Failed to decline invite.", "error"),
                          },
                        );
                      }}
                      isMutating={
                        acceptInviteMutation.isPending ||
                        declineInviteMutation.isPending
                      }
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
