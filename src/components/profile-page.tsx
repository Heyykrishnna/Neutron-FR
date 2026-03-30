"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { COMPETITIONS_DATA } from "@/lib/competitions-data";
import { EVENTS_DATA } from "@/lib/events-data";
import ProfileCard from "./ProfileCard";

type NavItem = "profile" | "competitions" | "events" | "inbox";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "leader" | "member";
  status: "confirmed" | "pending";
  avatar: string;
}

interface EnrolledItem {
  slug: string;
  title: string;
  image: string;
  category: string;
  date: string;
  status: "open" | "closed" | "cancelled" | "postponed";
  teamSize: string; // e.g. "1-3 Members" or "4 Members"
  team?: TeamMember[];
}

const MOCK_COMPETITIONS: EnrolledItem[] = COMPETITIONS_DATA.slice(0, 3).map((c, i) => ({
  slug: c.slug,
  title: c.title,
  image: c.image,
  category: c.category,
  date: c.date,
  status: c.status,
  teamSize: c.teamSize,
  team:
    i === 0
      ? [
          { id: "u1", name: "Yatharth Khandelwal", email: "yatharth@neutron.in", role: "leader", status: "confirmed", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg" },
          { id: "u2", name: "Arjun Mehta", email: "arjun@neutron.in", role: "member", status: "confirmed", avatar: "https://i.pravatar.cc/150?img=11" },
          { id: "u3", name: "Priya Sen", email: "priya@neutron.in", role: "member", status: "pending", avatar: "https://i.pravatar.cc/150?img=47" },
        ]
      : i === 1
      ? [
          { id: "u1", name: "Yatharth Khandelwal", email: "yatharth@neutron.in", role: "leader", status: "confirmed", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg" },
        ]
      : [
          { id: "u1", name: "Yatharth Khandelwal", email: "yatharth@neutron.in", role: "leader", status: "confirmed", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg" },
          { id: "u4", name: "Karan Tiwari", email: "karan@neutron.in", role: "member", status: "confirmed", avatar: "https://i.pravatar.cc/150?img=33" },
        ],
}));

const MOCK_EVENTS: EnrolledItem[] = EVENTS_DATA.slice(0, 2).map((e, i) => ({
  slug: e.slug,
  title: e.title,
  image: e.image,
  category: e.category,
  date: e.date,
  status: e.status,
  teamSize: e.teamSize,
  team:
    i === 0
      ? [
          { id: "u1", name: "Yatharth Khandelwal", email: "yatharth@neutron.in", role: "leader", status: "confirmed", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg" },
          { id: "u5", name: "Meera Joshi", email: "meera@neutron.in", role: "member", status: "pending", avatar: "https://i.pravatar.cc/150?img=21" },
        ]
      : [
          { id: "u1", name: "Yatharth Khandelwal", email: "yatharth@neutron.in", role: "leader", status: "confirmed", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg" },
        ],
}));

const MOCK_GLOBAL_USERS = [
  { id: "u-99", name: "Riya Sharma", email: "riya@neutron.in", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "u-98", name: "Kabir Singh", email: "kabir@neutron.in", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "u-97", name: "Ananya Patel", email: "ananya@neutron.in", avatar: "https://i.pravatar.cc/150?img=20" },
  { id: "u-96", name: "Vikram Reddy", email: "vikram@neutron.in", avatar: "https://i.pravatar.cc/150?img=33" },
  { id: "u-95", name: "Neha Gupta", email: "neha@neutron.in", avatar: "https://i.pravatar.cc/150?img=41" },
];

function isTeamEvent(teamSize: string): boolean {
  const match = teamSize.match(/\d+/g);
  if (!match) return false;
  const max = parseInt(match[match.length - 1]);
  return max > 1;
}

function EditableField({
  label,
  value,
  onChange,
  locked = false,
  type = "text",
  placeholder = "",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-mono">
          {label}
        </label>
        {!locked && !editing && (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
            </svg>
            Edit
          </button>
        )}
        {locked && (
          <span className="text-[9px] text-white/15 font-mono">locked</span>
        )}
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
            placeholder={placeholder}
            className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 focus:bg-white/8 transition-all"
          />
          <button
            onClick={save}
            className="px-3 py-2 bg-white text-black text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors shrink-0"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <p className={`text-sm mt-0.5 ${locked ? "text-white/40" : "text-white/80"} ${!value ? "text-white/25 italic" : ""}`}>
          {value || placeholder || "—"}
        </p>
      )}
      {hint && <p className="text-[10px] text-white/20 mt-1">{hint}</p>}
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
        <label className="text-[10px] uppercase tracking-wider text-white/25 font-mono">{label}</label>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
            </svg>
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            autoFocus
            className="flex-1 bg-[#111] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-all"
          >
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={() => setEditing(false)} className="px-3 py-2 bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg hover:bg-white/10 transition-colors shrink-0">✕</button>
        </div>
      ) : (
        <p className={`text-sm mt-0.5 ${value ? "text-white/80" : "text-white/25 italic"}`}>{value || "—"}</p>
      )}
    </div>
  );
}

function IdUploadField({ label, hint }: { label: string; hint?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-white/25 font-mono block mb-2">{label}</label>
      {hint && <p className="text-[10px] text-white/20 mb-2">{hint}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative border border-dashed border-white/15 rounded-xl overflow-hidden cursor-pointer hover:border-white/30 transition-colors group"
        style={{ height: preview ? "auto" : "90px" }}
      >
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="w-full max-h-40 object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs text-white">Change</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-white/25 group-hover:text-white/40 transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px]">Click to upload</span>
            <span className="text-[9px]">JPG, PNG or PDF</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamModal({
  item,
  onClose,
}: {
  item: EnrolledItem;
  onClose: () => void;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState<TeamMember[]>(item.team || []);

  const maxStr = item.teamSize.match(/\d+/g);
  const maxMembers = maxStr ? parseInt(maxStr[maxStr.length - 1]) : 1;
  const canAdd = members.length < maxMembers;

  const [inviteError, setInviteError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = MOCK_GLOBAL_USERS.filter(u => 
    inviteEmail.trim() && 
    (u.name.toLowerCase().includes(inviteEmail.toLowerCase()) || 
     u.email.toLowerCase().includes(inviteEmail.toLowerCase()))
  );

  const handleInvite = (selectedUser?: typeof MOCK_GLOBAL_USERS[0]) => {
    setInviteError("");

    if (selectedUser && 'id' in selectedUser) {
      if (members.some((m) => m.email.toLowerCase() === selectedUser.email.toLowerCase())) {
        setInviteError("User is already in your team.");
        return;
      }
      const newMember: TeamMember = {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: "member",
        status: "pending",
        avatar: selectedUser.avatar,
      };
      setMembers((prev) => [...prev, newMember]);
      setInviteEmail("");
      setIsFocused(false);
      return;
    }

    const val = inviteEmail.trim();
    if (!val || !canAdd) return;
    
    if (members.some((m) => m.email.toLowerCase() === val.toLowerCase() || m.name.toLowerCase() === val.toLowerCase())) {
      setInviteError("User is already in your team.");
      return;
    }
    
    const isGlobal = !val.includes("@");
    const newMember: TeamMember = {
      id: `u-${Date.now()}`,
      name: isGlobal ? val : val.split("@")[0],
      email: isGlobal ? `${val}@neutron.in` : val,
      role: "member",
      status: "pending",
      avatar: `https://i.pravatar.cc/150?u=${val}`,
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setIsFocused(false);
  };

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id || m.role === "leader"));
    setConfirmRemoveId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-3xl shadow-2xl relative"
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-3xl p-6 pb-5 border-b border-white/6">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px]" />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-1">Team Management</p>
                <h3 className="text-lg font-semibold text-white leading-tight">{item.title}</h3>
                <p className="text-xs text-white/40 mt-1">{item.teamSize}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-white/30 font-mono mb-1.5">
                <span>{members.length} / {maxMembers} members</span>
                <span>{canAdd ? "slots available" : "team full"}</span>
              </div>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${(members.length / maxMembers) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="p-5 space-y-2 max-h-60 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6 group">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                  <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{m.name}</p>
                  <p className="text-[11px] text-white/35 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.role === "leader" ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-widest font-mono">
                      Leader
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-mono ${
                        m.status === "confirmed"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/30"
                      }`}
                    >
                      {m.status}
                    </span>
                  )}
                  {m.role !== "leader" && (
                    <button
                      onClick={() => setConfirmRemoveId(m.id)}
                      className="text-white/20 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Invite input */}
          <div className="p-5 pt-4 border-t border-white/5 mt-2">
            <div className={`transition-opacity ${!canAdd ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-white/25 font-mono">Invite to Team</p>
                <span className="text-[9px] text-white/20 font-mono bg-white/5 px-2 py-0.5 rounded-full">Global Search Enabled</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3" strokeLinecap="round"/></svg>
                  </div>
                  <input
                    type="text"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError("");
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="Email or Neutron ID..."
                    className={`w-full bg-white/5 border ${inviteError ? "border-rose-500/50" : "border-white/10"} rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/25 focus:bg-white/10 transition-all`}
                  />
                  
                  {/* Autocomplete Dropdown */}
                  <AnimatePresence>
                    {isFocused && inviteEmail.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full mt-1.5 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col"
                      >
                        {suggestions.length > 0 ? (
                          suggestions.map(s => (
                            <button
                              key={s.id}
                              onClick={() => handleInvite(s)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                            >
                              <img src={s.avatar} alt={s.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-white truncate leading-tight">{s.name}</p>
                                <p className="text-[10px] text-white/40 truncate leading-tight">{s.email}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center">
                            <p className="text-xs text-white/40">No user found matching &quot;{inviteEmail}&quot;</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={() => handleInvite()}
                  className="px-4 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/90 transition-colors shrink-0 h-[42px]"
                >
                  Invite
                </button>
              </div>
              {inviteError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-rose-400 mt-2 pl-2"
                >
                  {inviteError}
                </motion.p>
              )}
            </div>
            {!canAdd && (
              <p className="text-[11px] text-amber-400/70 mt-2 text-center">Team is full. Remove a member to invite someone new.</p>
            )}
          </div>
          
          {/* Confirm Overlay */}
          <AnimatePresence>
            {confirmRemoveId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-xs text-center shadow-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Remove Member?</h4>
                  <p className="text-[11px] text-white/50 mb-6 leading-relaxed">
                    Are you sure you want to remove this member? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => removeMember(confirmRemoveId)}
                      className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EnrolledCard({
  item,
  href,
}: {
  item: EnrolledItem;
  href: string;
}) {
  const [showTeam, setShowTeam] = useState(false);
  const hasTeam = isTeamEvent(item.teamSize);

  const statusColor: Record<string, string> = {
    open: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    closed: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    postponed: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    cancelled: "bg-white/5 border-white/10 text-white/30",
  };

  return (
    <>
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/14 transition-all duration-200 group">
        {/* Top row */}
        <div className="flex gap-4 items-center p-4">
          <div
            className="w-14 h-14 rounded-xl shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${item.image})` }}
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
              <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-wider font-mono ${statusColor[item.status]}`}>
                {item.status}
              </span>
              <span className="text-[10px] text-white/25 font-mono">
                {item.teamSize}
              </span>
            </div>
          </div>
        </div>

        {hasTeam && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Avatar stack */}
                <div className="flex -space-x-2">
                  {(item.team || []).slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full overflow-hidden border-2 border-[#0c0c0c]"
                      title={m.name}
                    >
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-white/35">
                  {(item.team || []).length} member{(item.team || []).length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() => setShowTeam(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200 font-medium"
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
                Manage Team
              </button>
            </div>
          </div>
        )}
      </div>

      {showTeam && <TeamModal item={item} onClose={() => setShowTeam(false)} />}
    </>
  );
}

function ProfilePanel() {
  const [profile, setProfile] = useState({
    name: "Yatharth Khandelwal",
    email: "yatharth@neutron.in",
    bio: "Building at the intersection of space tech & software.",
    college: "Rishihood University",
    year: "1st Year · CS & AI",
    gender: "Male",
    city: "Sonipat",
    state: "Haryana",
    whatsapp: "",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
  });

  const set = (key: keyof typeof profile) => (val: string) =>
    setProfile((p) => ({ ...p, [key]: val }));

  const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Ladakh", "Jammu & Kashmir",
  ];

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5 pb-10"
    >

      <div className="w-full flex justify-center py-4">
        <div className="w-full max-w-[320px] sm:max-w-sm">
          <ProfileCard
            name={profile.name}
            title={profile.college + " · " + profile.year}
            handle="yatharth.k"
            status="Online"
            contactText="Contact Me"
            avatarUrl="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
            showUserInfo={false}
            enableTilt={true}
            enableMobileTilt={false}
            onContactClick={() => {}}
            behindGlowColor="rgba(125, 190, 255, 0.67)"
            iconUrl="https://static.vecteezy.com/system/resources/thumbnails/010/332/153/small_2x/code-flat-color-outline-icon-free-png.png"
            behindGlowEnabled
            innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Competitions", value: "5", sub: "Registered" },
          { label: "Events", value: "3", sub: "Enrolled" },
          { label: "Shortlisted", value: "2", sub: "This season" },
        ].map(({ label, value, sub }, i) => (
          <div 
            key={label} 
            className={`bg-white/3 border border-white/8 rounded-2xl p-4 ${
              i === 2 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <span className="text-[10px] uppercase tracking-widest text-white/25 font-mono block">{label}</span>
            <span className="text-2xl font-bold text-white mt-1 block">{value}</span>
            <span className="text-xs text-white/35">{sub}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-xs uppercase tracking-widest text-white/25 font-mono mb-5">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <EditableField label="Full Name" value={profile.name} onChange={set("name")} locked />
          <EditableField label="Email Address" value={profile.email} onChange={set("email")} locked />
          <EditableField label="Bio" value={profile.bio} onChange={set("bio")} placeholder="Tell us about yourself…" />
          <SelectField label="Gender" value={profile.gender} options={GENDERS} onChange={set("gender")} />
          <EditableField label="WhatsApp Number" value={profile.whatsapp} onChange={set("whatsapp")} type="tel" placeholder="+91 XXXXX XXXXX" hint="Used for competition notifications only" />
          <EditableField label="City" value={profile.city} onChange={set("city")} placeholder="e.g. Bengaluru" />
          <SelectField label="State" value={profile.state} options={INDIAN_STATES} onChange={set("state")} />
          <div /> 
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-xs uppercase tracking-widest text-white/25 font-mono mb-5">Academic Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <EditableField label="College / University" value={profile.college} onChange={set("college")} placeholder="e.g. IIT Delhi" />
          <EditableField label="Year & Branch" value={profile.year} onChange={set("year")} placeholder="e.g. 2nd Year · ECE" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-xs uppercase tracking-widest text-white/25 font-mono mb-1">Identity Documents</h3>
        <p className="text-[11px] text-white/25 mb-5">Required for prize disbursement verification. All uploads are encrypted.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <IdUploadField label="College ID Card" hint="Front side of your college-issued identity card" />
          <IdUploadField label="Government ID" hint="Aadhaar, PAN, Passport or Driving License" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-xs uppercase tracking-widest text-white/25 font-mono mb-5">Social Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <EditableField label="GitHub" value={profile.github} onChange={set("github")} type="url" placeholder="https://github.com/username" />
          <EditableField label="LinkedIn" value={profile.linkedin} onChange={set("linkedin")} type="url" placeholder="https://linkedin.com/in/username" />
          <EditableField label="Twitter / X" value={profile.twitter} onChange={set("twitter")} type="url" placeholder="https://x.com/username" />
        </div>
      </div>
    </motion.div>
  );
}

function CompetitionsPanel() {
  return (
    <motion.div
      key="competitions"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4 pb-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">My Competitions</h2>
          <p className="text-xs text-white/30 mt-0.5">Competitions you&apos;ve registered for</p>
        </div>
        <Link href="/competitions" className="text-xs text-white/40 hover:text-white transition-colors">
          Browse all →
        </Link>
      </div>

      {MOCK_COMPETITIONS.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-white/30">You haven&apos;t registered for any competitions yet.</p>
          <Link href="/competitions" className="mt-3 inline-block text-xs text-white/50 hover:text-white transition-colors">
            Explore competitions →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_COMPETITIONS.map((c) => (
            <EnrolledCard key={c.slug} item={c} href={`/competitions/${c.slug}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EventsPanel() {
  return (
    <motion.div
      key="events"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4 pb-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">My Events</h2>
          <p className="text-xs text-white/30 mt-0.5">Events you&apos;ve enrolled in</p>
        </div>
        <Link href="/events" className="text-xs text-white/40 hover:text-white transition-colors">
          Browse all →
        </Link>
      </div>

      {MOCK_EVENTS.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-white/30">You haven&apos;t enrolled in any events yet.</p>
          <Link href="/events" className="mt-3 inline-block text-xs text-white/50 hover:text-white transition-colors">
            Explore events →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_EVENTS.map((e) => (
            <EnrolledCard key={e.slug} item={e} href={`/events/${e.slug}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function InboxPanel() {
  const invites = [
    { id: 1, type: "received", title: "Global Hackathon 2026", user: "Arjun Mehta", time: "2h ago", role: "Frontend Dev" },
    { id: 2, type: "received", title: "AI Ideathon", user: "Priya Sen", time: "1d ago", role: "AI Engineer" },
  ];
  
  const sent = [
    { id: 3, type: "sent", title: "Neutron 3.0", user: "Meera Joshi", time: "3d ago", status: "pending" },
    { id: 4, type: "sent", title: "Global Hackathon 2026", user: "Karan Tiwari", time: "1w ago", status: "accepted" },
  ];

  return (
    <motion.div
      key="inbox"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8 pb-10"
    >
      <div className="flex items-center justify-between pl-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Invites & Messages</h2>
          <p className="text-xs text-white/30 mt-0.5">Manage your team invitations</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">Received Invites</h3>
        {invites.map((inv) => (
          <div key={inv.id} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-white/15 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <img src={`https://i.pravatar.cc/150?u=${inv.user}`} alt={inv.user} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{inv.user} <span className="text-white/40 font-normal">invited you to join</span></p>
                <p className="text-xs text-amber-400 font-medium mt-0.5">{inv.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/20 capitalize">{inv.time}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10"></span>
                  <span className="text-[10px] text-white/40 border border-white/10 rounded-md px-1.5 py-0.5 bg-white/5">{inv.role}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-4 py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-colors">Decline</button>
              <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold transition-colors">Accept</button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1 mt-6">Sent Invites</h3>
        {sent.map((inv) => (
          <div key={inv.id} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10 opacity-70">
                <img src={`https://i.pravatar.cc/150?u=${inv.user}`} alt={inv.user} className="w-full h-full object-cover grayscale" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">You invited <span className="text-white">{inv.user}</span></p>
                <p className="text-[11px] text-white/30 mt-0.5">{inv.title} · {inv.time}</p>
              </div>
            </div>
            <div className="shrink-0">
              {inv.status === "pending" && <span className="text-[9px] uppercase tracking-widest font-mono text-white/40 border border-white/10 bg-white/5 px-2 py-1 rounded-full">{inv.status}</span>}
              {inv.status === "accepted" && <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded-full">{inv.status}</span>}
              {inv.status === "declined" && <span className="text-[9px] uppercase tracking-widest font-mono text-rose-400 border border-rose-500/20 bg-rose-500/10 px-2 py-1 rounded-full">{inv.status}</span>}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SidebarNav({
  active,
  setActive,
}: {
  active: NavItem;
  setActive: (v: NavItem) => void;
}) {
  const items: { id: NavItem; label: string; sub: string; badge?: number }[] = [
    { id: "profile", label: "Profile", sub: "Personal details" },
    { id: "competitions", label: "Competitions", sub: "Your registrations" },
    { id: "events", label: "Events", sub: "Your enrollments" },
    { id: "inbox", label: "Invites & Messages", sub: "Pending invitations", badge: 2 },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActive(item.id)}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 relative group ${
            active === item.id ? "bg-white/8 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          {active === item.id && (
            <motion.div
              layoutId="sidebar-pill"
              className="absolute inset-0 rounded-xl border border-white/10 bg-white/5"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-[10px] text-white/25 mt-0.5">{item.sub}</span>
            </div>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center justify-center border border-rose-500/20">
                {item.badge}
              </span>
            )}
          </div>
        </button>
      ))}
    </nav>
  );
}

export default function ProfilePage() {
  const [active, setActive] = useState<NavItem>("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-900/8 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%,white,transparent),radial-gradient(1px 1px at 80% 10%,white,transparent),radial-gradient(1px 1px at 50% 70%,white,transparent),radial-gradient(1px 1px at 10% 80%,white,transparent),radial-gradient(1px 1px at 90% 60%,white,transparent),radial-gradient(1px 1px at 65% 25%,white,transparent),radial-gradient(1px 1px at 75% 85%,white,transparent)",
          }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/6 backdrop-blur-xl bg-[#030303]/70 flex items-center px-6 gap-4">
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <img src="/neutron.png" alt="Neutron" className="h-8 w-8 opacity-90" />
          <span className="font-bold text-white tracking-wide hidden sm:block">Neutron</span>
        </Link>
        <div className="flex-1" />
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 -mr-2 text-white/70 hover:text-white rounded-lg active:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/15">
            <img
              src="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
              alt="Yatharth"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-white/60 hidden sm:block">Yatharth Khandelwal</span>
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
            <SidebarNav active={active} setActive={(v) => { setActive(v); setMobileMenuOpen(false); }} />
            
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
              <Link href="/competitions" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium text-white/80">All Competitions</span>
                <span className="text-white/40">→</span>
              </Link>
              <Link href="/events" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium text-white/80">All Events</span>
                <span className="text-white/40">→</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen pt-14 relative z-10 w-full">
        <aside className="w-56 shrink-0 h-full border-r border-white/6 bg-[#030303]/60 backdrop-blur-xl hidden md:flex flex-col px-3 py-6 overflow-y-auto">
          <div className="flex items-center gap-3 px-3 pb-5 mb-4 border-b border-white/6">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shrink-0">
              <img
                src="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
                alt="Yatharth"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Yatharth Khandelwal</p>
              <p className="text-[10px] text-white/30 truncate">1st Year · CS & AI</p>
            </div>
          </div>

          <SidebarNav active={active} setActive={setActive} />

          <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-white/6">
            {[
              { href: "/competitions", label: "All Competitions" },
              { href: "/events", label: "All Events" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs text-white/25 hover:text-white/55 hover:bg-white/5 transition-all duration-200"
              >
                {label}
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8 w-full">
            <AnimatePresence mode="wait">
              {active === "profile" && <ProfilePanel />}
              {active === "competitions" && <CompetitionsPanel />}
              {active === "events" && <EventsPanel />}
              {active === "inbox" && <InboxPanel />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
