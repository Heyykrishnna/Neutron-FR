"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Search, 
  X, 
  ChevronRight, 
  Bell, 
  Settings, 
  HelpCircle, 
  FileText, 
  CreditCard, 
  Layout, 
  User, 
  Users, 
  Target, 
  Mail, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Upload
} from "lucide-react";
import Link from "next/link";
import { COMPETITIONS_DATA } from "@/lib/competitions-data";
import { EVENTS_DATA } from "@/lib/events-data";
import ProfileCard from "./ProfileCard";

type NavItem = "profile" | "competitions" | "events" | "inbox";

const DashboardContext = React.createContext<{
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  setExpandedID: (val: boolean) => void;
}>({ 
  showToast: () => {}, 
  setExpandedID: () => {} 
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

function Toast({ message, type, onClose }: { message: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-1000 px-4 py-2.5 rounded-xl border border-white/10 bg-[#080808]/90 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 min-w-[200px] max-w-[320px]"
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
        type === "success" ? "bg-emerald-500/10 text-emerald-400" : 
        type === "error" ? "bg-rose-500/10 text-rose-400" : 
        "bg-blue-500/10 text-blue-400"
      }`}>
        {type === "success" && <CheckCircle2 size={14} />}
        {type === "error" && <AlertCircle size={14} />}
        {type === "info" && <Bell size={14} />}
      </div>
      <p className="text-[10px] font-bold text-white tracking-wide truncate flex-1">{message}</p>
      <button onClick={onClose} className="text-white/20 hover:text-white transition-colors p-1">
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
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  locked?: boolean;
  type?: string;
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
          <div className="flex items-center gap-2 w-full max-w-[240px]">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              autoFocus
              className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-white/40 transition-all font-mono"
            />
            <button onClick={save} className="text-emerald-400 hover:text-emerald-300 transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
             <span className={`text-[12px] font-medium leading-none ${locked ? "text-white/40" : "text-white/80"}`}>
              {value || placeholder || "—"}
            </span>
            {!locked && (
              <button
                onClick={() => { setDraft(value); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/50"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
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

function DocumentCard({ 
  label, 
  type, 
  date, 
  onUpload 
}: { 
  label: string; 
  type: string; 
  date: string; 
  onUpload: (name: string) => void 
}) {
  const { showToast } = useDashboard();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    setUploading(true);
    setTimeout(() => {
      setFile(f);
      setUploading(false);
      onUpload(f.name);
    }, 1500);
  };

  return (
    <div className={`bg-white/2 border border-white/8 rounded-2xl p-4 flex flex-col gap-3 group/doc hover:border-white/20 hover:bg-white/5 transition-all duration-300 relative ${file ? "border-emerald-500/20" : ""}`}>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      <div className="w-full aspect-video rounded-xl bg-[#111] border border-white/5 overflow-hidden relative cursor-pointer" onClick={() => !uploading && inputRef.current?.click()}>
        <div className="absolute inset-0 flex items-center justify-center">
            {uploading ? (
               <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Uploading...</p>
               </div>
            ) : file ? (
               <div className="w-full h-full bg-linear-to-br from-emerald-500/10 to-teal-500/10 flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 size={24} className="text-emerald-400 mb-2" />
                  <p className="text-[8px] text-white/50 truncate w-full font-mono">{file.name}</p>
               </div>
            ) : (
               <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/doc:bg-white/10 transition-all">
                  <Upload size={18} className="text-white/20 group-hover/doc:text-white" />
               </div>
            )}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
           <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">{label}</h4>
           <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>
              
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-100" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute bottom-full right-0 mb-2 w-32 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl z-101 overflow-hidden"
                    >
                      {[
                        { label: "View", icon: Layout, action: () => showToast("Viewer restricted in beta.", "info") },
                        { label: "Download", icon: Download, action: () => showToast("Download started...", "success") },
                        { label: "Delete", icon: Trash2, action: () => { setFile(null); showToast("File deleted."); }, destructive: true }
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={(e) => { e.stopPropagation(); item.action(); setMenuOpen(false); }}
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
            {file ? (file.size / 1024 / 1024).toFixed(1) + " MB" : type} &bull; {file ? "Just now" : date}
          </p>
          {file && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
        </div>
      </div>
    </div>
  );
}

function DashboardWidget({ 
  title, 
  children, 
  className = "", 
  onManage 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  onManage: () => void;
}) {
  return (
    <div className={`bg-white/3 border border-white/8 rounded-3xl p-6 backdrop-blur-2xl transition-all duration-300 hover:border-white/15 h-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 font-mono">{title}</h3>
        <button 
          onClick={onManage}
          className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-all hover:bg-white/5 px-2.5 py-1 rounded-full border border-transparent hover:border-white/10 active:translate-y-px"
        >
          Manage
        </button>
      </div>
      {children}
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
  const { showToast } = useDashboard();
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState<TeamMember[]>(item.team || []);

  const maxStr = item.teamSize.match(/\d+/g);
  const maxMembers = maxStr ? parseInt(maxStr[maxStr.length - 1]) : 1;
  const canAdd = members.length < maxMembers;

  const [inviteError, setInviteError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

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
      showToast(`Invited ${selectedUser.name} to the team.`, "success");
      return;
    }

    const val = inviteEmail.trim();
    if (!val || !canAdd) return;
    
    if (members.some((m) => m.email.toLowerCase() === val.toLowerCase() || m.name.toLowerCase() === val.toLowerCase())) {
      setInviteError("User is already in your team.");
      return;
    }
    
    showToast(`Invite sent to ${val}.`, "success");
    setInviteEmail("");
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
            <h2 className="text-2xl font-bold text-white tracking-tight">{item.title}</h2>
            <p className="text-xs text-white/30 mt-1 font-mono uppercase tracking-widest">Team Management &bull; {members.length}/{maxMembers} Slots</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto overflow-x-visible custom-scrollbar">
          {/* Members List */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 font-mono">Active Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/5 group hover:border-white/10 transition-all">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono mt-0.5">{member.role}</p>
                  </div>
                  {member.role !== "leader" && (
                    <button 
                      onClick={() => setMemberToRemove(member)}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

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
                  <h4 className="text-lg font-bold text-white">Remove {memberToRemove.name}?</h4>
                  <p className="text-xs text-white/40 mt-2 leading-relaxed">This will revoke their access to this project immediately.</p>
                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setMemberToRemove(null)}
                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
                        showToast(`${memberToRemove.name} removed.`, "info");
                        setMemberToRemove(null);
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
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20 font-mono">Invite Peers</h3>
                <span className={`text-[9px] uppercase tracking-widest font-mono ${canAdd ? "text-emerald-400" : "text-rose-400"}`}>
                  {canAdd ? "Available Slots Open" : "Limit Reached"}
                </span>
             </div>

             <div className="relative">
                <div className={`p-1.5 rounded-2.5xl border transition-all flex items-center gap-2 ${isFocused ? "bg-white/5 border-white/20" : "bg-white/3 border-white/5"}`}>
                   <div className="pl-3 text-white/20"><Mail size={18} /></div>
                   <input 
                      type="text"
                      placeholder="Enter name or email..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                      disabled={!canAdd}
                      className="bg-transparent border-none outline-none flex-1 py-3 text-sm text-white placeholder:text-white/10 font-medium"
                   />
                   <button 
                      onClick={() => handleInvite()}
                      disabled={!canAdd || !inviteEmail.trim()}
                      className="h-10 px-6 rounded-2xl bg-white text-black text-[10px] font-extrabold uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20 disabled:grayscale"
                   >
                      Send
                   </button>
                </div>

                <AnimatePresence>
                  {isFocused && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 right-0 mb-3 z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden divide-y divide-white/5"
                    >
                       {suggestions.map((user) => (
                         <button 
                           key={user.id}
                           onClick={() => handleInvite(user)}
                           className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
                         >
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl border border-white/10" />
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{user.name}</p>
                               <p className="text-[10px] text-white/30 truncate mt-0.5">{user.email}</p>
                            </div>
                            <div className="text-white/20 group-hover:text-emerald-400 transition-colors">
                               <Plus size={16} />
                            </div>
                         </button>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
             {inviteError && <p className="text-[10px] text-rose-400 font-mono ml-2">{inviteError}</p>}
          </div>
        </div>

        <div className="px-8 py-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
           <p className="text-[9px] text-white/10 font-mono uppercase tracking-[0.3em]">Integrity verified &bull; 2m ago</p>
           <button onClick={onClose} className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Done</button>
        </div>
      </motion.div>
    </div>
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
               <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#080808]"></div>
          </div>
          
          <h2 className="text-2xl font-bold text-white tracking-tight">{member.name}</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono mt-2">{member.role || "Member"}</p>
          
          <div className="w-full h-px bg-white/5 my-8"></div>
          
          <div className="w-full space-y-5 text-left">
             <div>
                <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono mb-2">About & Bio</p>
                <p className="text-xs text-white/50 leading-relaxed font-medium">Expert in {member.role || "this field"} with a focus on collaborative problem solving and innovative design thinking.</p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono mb-3">Presence</p>
                <div className="flex gap-3">
                   {["Github", "X", "LinkedIn"].map(sn => (
                     <div key={sn} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] text-white/40 font-mono uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all cursor-pointer">
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
  onViewMember 
}: { 
  profile: any, 
  set: (key: any) => (val: string) => void,
  onViewMember: (m: any) => void
}) {
  const { showToast, setExpandedID } = useDashboard();

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Top Row */}
      <div className="lg:col-span-8">
        <DashboardWidget 
          title="Personal information" 
          onManage={() => showToast("Profile archival and history logs are currently restricted.", "info")}
        >
           <div className="flex flex-col">
              <EditableRow label="Full Name" value={profile.name} onChange={set("name")} locked />
              <EditableRow label="Date of birth" value="March 15th, 2004" onChange={() => showToast("DOB updated successfully.")} />
              <EditableRow label="Gender" value={profile.gender} onChange={set("gender")} />
              <EditableRow label="Phone" value={profile.whatsapp} onChange={set("whatsapp")} placeholder="+91 XXXXX XXXXX" />
              <EditableRow label="Email" value={profile.email} onChange={set("email")} locked />
              <EditableRow label="Address" value={profile.city + ", " + profile.state} onChange={() => {}} />
           </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
        <DashboardWidget 
          title="Documents" 
          onManage={() => showToast("Document verification engine is running in the background.", "info")}
        >
           <div className="grid grid-cols-2 gap-4">
              <DocumentCard label="College ID" type="Card" date="Mar 2026" onUpload={(name) => showToast(`College ID "${name}" uploaded.`)} />
              <DocumentCard label="Aadhaar" type="Card" date="Mar 2026" onUpload={(name) => showToast(`Aadhaar "${name}" uploaded.`)} />
              <DocumentCard label="Certificate" type="PDF" date="Feb 2026" onUpload={(name) => showToast(`Certificate "${name}" uploaded.`)} />
              <div 
                onClick={() => showToast("Additional slots will be available after verification.", "info")}
                className="border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center aspect-video group cursor-pointer hover:border-white/10 transition-all"
              >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-all">
                     <Plus size={14} />
                  </div>
              </div>
           </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
         <DashboardWidget 
          title="Identity Card" 
          className="flex flex-col justify-center items-center py-10"
          onManage={() => showToast("ID Customization coming soon in v4.0.", "info")}
         >
            <div className="w-full max-w-[280px] cursor-pointer active:scale-[0.98] transition-all hover:brightness-110" onClick={() => setExpandedID(true)}>
              <ProfileCard
                name={profile.name}
                title={profile.college}
                handle="yatharth.k"
                status={profile.year}
                contactText="VIEW FULL ID"
                avatarUrl="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
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

      <div className="lg:col-span-4">
         <DashboardWidget 
          title="Team structure" 
          onManage={() => showToast("Synchronizing team roles with global registry.", "info")}
         >
            <div className="space-y-4">
               {[
                 { id: 't1', name: "Arjun Mehta", role: "Frontend Lead", avatar: "https://i.pravatar.cc/150?img=11" },
                 { id: 't2', name: "Priya Sen", role: "AI Research", avatar: "https://i.pravatar.cc/150?img=47" },
                 { id: 't3', name: "Yatharth K.", role: "Full Stack", avatar: "https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg", isMe: true },
                 { id: 't4', name: "Karan Tiwari", role: "UI Designer", avatar: "https://i.pravatar.cc/150?img=33" },
               ].map((member, i) => (
                 <div key={member.name} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${member.isMe ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:bg-white/8 hover:scale-[1.02]"}`} onClick={() => onViewMember(member)}>
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    <div>
                       <p className="text-[12px] font-bold text-white leading-tight">{member.name}</p>
                       <p className="text-[10px] text-white/30 font-mono mt-0.5">{member.role}</p>
                    </div>
                    {member.isMe && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    )}
                 </div>
               ))}
            </div>
         </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
         <DashboardWidget 
          title="Data completion 2/5" 
          onManage={() => showToast("Analysis complete. You are in the top 5% of verified users.", "info")}
         >
            <div className="space-y-4">
               {[
                 { label: "Personal data & resume", done: true },
                 { label: "Education", done: true },
                 { label: "Email address", done: true },
                 { label: "Work experience", done: true },
                 { label: "Personal statement and consent", done: false },
                 { label: "Certification", done: false },
               ].map((item) => (
                 <div key={item.label} className="flex items-center gap-3 group cursor-pointer" onClick={() => showToast(`Requirement: ${item.label} (${item.done ? "Fulfilled" : "Pending"})`, "info")}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${item.done ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-white/5 border-white/10 text-white/5 group-hover:border-white/20"}`}>
                       {item.done && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${item.done ? "text-white/60" : "text-white/30 group-hover:text-white/50"}`}>{item.label}</span>
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                   <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">Profile Score</p>
                   <p className="text-xl font-bold text-white mt-1">85%</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">85%</div>
            </div>
         </DashboardWidget>
      </div>
    </div>
  );
}

function CompetitionsPanel() {
  const { showToast } = useDashboard();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8">
        <DashboardWidget 
          title="My Competitions" 
          onManage={() => showToast("Competition migration logs in progress.", "info")}
        >
           <div className="space-y-4">
              {MOCK_COMPETITIONS.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
                  <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest leading-relaxed">No registrations found.</p>
                  <Link href="/competitions" className="mt-4 inline-block text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Explore all &rarr;</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_COMPETITIONS.map((c) => (
                    <EnrolledCard key={c.slug} item={c} href={`/competitions/${c.slug}`} />
                  ))}
                </div>
              )}
           </div>
        </DashboardWidget>
      </div>
      
      <div className="lg:col-span-4">
        <DashboardWidget 
          title="Stats & Filters" 
          onManage={() => showToast("Custom analytics views are being built.", "info")}
        >
           <div className="space-y-4">
              {[
                { label: "Active", value: "3", color: "emerald-400" },
                { label: "Completed", value: "2", color: "blue-400" },
                { label: "Rank", value: "Top 1%", color: "amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/5 transition-colors" onClick={() => showToast(`Detailed stats for ${stat.label} coming soon.`, "info")}>
                   <div>
                      <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">{stat.label}</p>
                      <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                   </div>
                   <div className={`w-1.5 h-6 rounded-full bg-${stat.color} opacity-40 shadow-[0_0_12px_rgba(255,255,255,0.1)] group-hover:opacity-100 transition-opacity`}></div>
                </div>
              ))}
           </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function EventsPanel() {
  const { showToast } = useDashboard();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8">
        <DashboardWidget 
          title="Enrolled Events" 
          onManage={() => showToast("Reviewing event enrollment history.", "info")}
        >
           <div className="space-y-4">
              {MOCK_EVENTS.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
                  <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest leading-relaxed">No events found.</p>
                  <Link href="/events" className="mt-4 inline-block text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all">Browse Events &rarr;</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_EVENTS.map((e) => (
                    <EnrolledCard key={e.slug} item={e} href={`/events/${e.slug}`} />
                  ))}
                </div>
              )}
           </div>
        </DashboardWidget>
      </div>
      
      <div className="lg:col-span-4">
        <DashboardWidget 
          title="Calendar View" 
          onManage={() => showToast("Syncing with Google Calendar...", "info")}
        >
           <div className="aspect-square bg-white/3 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => showToast("Viewing upcoming schedule...", "info")}>
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-4">
                 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">MAR</p>
                 <p className="text-2xl font-bold text-white uppercase tracking-tighter">30</p>
              </div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">No Events Today</p>
              <p className="text-[10px] text-white/20 mt-2 font-mono uppercase tracking-[0.2em]">Next: Web3 Summit (Apr 4)</p>
           </div>
        </DashboardWidget>
      </div>
    </div>
  );
}

function InboxPanel() {
  const { showToast } = useDashboard();
  const invites = [
    { id: 1, type: "received", title: "Global Hackathon 2026", user: "Arjun Mehta", time: "2h ago", role: "Frontend Dev" },
    { id: 2, type: "received", title: "AI Ideathon", user: "Priya Sen", time: "1d ago", role: "AI Engineer" },
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget 
          title="Team Invites" 
          onManage={() => showToast("Scanning global network for pending invites...", "info")}
        >
           <div className="space-y-3 max-w-4xl mx-auto py-4">
              {invites.map((inv) => (
                <div key={inv.id} className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 sm:items-center justify-between hover:border-white/20 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                      <img src={`https://i.pravatar.cc/150?u=${inv.user}`} alt={inv.user} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">{inv.user} <span className="text-white/30 font-normal ml-1">invited you to join</span></p>
                      <p className="text-[11px] text-amber-400 font-bold mt-1 uppercase tracking-wider">{inv.title}</p>
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">{inv.time}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                        <span className="text-[9px] text-white/50 border border-white/10 rounded-lg px-2 py-0.5 bg-white/5 font-bold uppercase tracking-widest">{inv.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => showToast(`Successfully declined ${inv.user}'s invite.`, "error")}
                      className="h-10 px-5 bg-white/5 border border-white/10 text-white hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >Decline</button>
                    <button 
                      onClick={() => showToast(`Welcome to the team! Accepted ${inv.user}'s invite.`, "success")}
                      className="h-10 px-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >Accept Invite</button>
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
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActive(item.id)}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${
            active === item.id ? "text-white" : "text-white/30 hover:text-white/60"
          }`}
        >
          {active === item.id && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              <span className="text-[9px] text-white/20 mt-0.5 font-mono">{item.sub}</span>
            </div>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center justify-center border border-rose-500/20">
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
  
  // Toast System
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast(null);
    setTimeout(() => setToast({ message, type }), 10);
  };

  // Profile State (Lifted for global access)
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

  // Header Button States
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedID, setExpandedID] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      showToast("Profile exported as PDF successfully.");
    }, 2500);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("All changes have been saved.");
    }, 1800);
  };

  return (
    <DashboardContext.Provider value={{ showToast, setExpandedID }}>
      <div className="min-h-screen bg-black text-white selection:bg-white/20 relative">
        <AnimatePresence>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          {selectedMember && <MemberProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
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
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] font-mono">Digital Identity Explorer</p>
                   <div className="h-4 w-px bg-white/20 mt-2"></div>
                </div>
                <ProfileCard
                  name={profile.name}
                  title={profile.college}
                  handle="yatharth.k"
                  status={profile.year}
                  contactText="DOWNLOAD ID"
                  avatarUrl="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
                  showUserInfo={true}
                  enableTilt={true}
                  enableMobileTilt={true}
                  behindGlowColor="rgba(125, 190, 255, 0.6)"
                  iconUrl="https://static.vecteezy.com/system/resources/thumbnails/010/332/153/small_2x/code-flat-color-outline-icon-free-png.png"
                  behindGlowEnabled
                  innerGradient="linear-gradient(145deg,#2e106520 0%,#1e3a8a40 100%)"
                />
                <button 
                  onClick={() => setExpandedID(false)}
                  className="mt-12 mx-auto flex items-center gap-2 text-[10px] font-bold text-white/20 hover:text-rose-400 uppercase tracking-widest transition-all group"
                >
                  <X size={14} className="group-hover:rotate-90 transition-transform" />
                  Close Identity Viewer
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none fixed inset-0 z-0 bg-[#000000]">
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

      <div className="flex pt-14 relative z-10 w-full min-h-[calc(100vh-3.5rem)]">
        <aside className="w-64 shrink-0 h-[calc(100vh-3.5rem)] border-r border-white/6 bg-[#030303]/40 backdrop-blur-3xl hidden md:flex flex-col px-4 py-8 sticky top-14">
          <div className="flex items-center gap-3 px-3 pb-8 mb-6 border-b border-white/6">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              <img
                src="https://ik.imagekit.io/YatharthKhandelwal/AVAT.jpeg"
                alt="Yatharth"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">Yatharth K.</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-mono">Verified</p>
              </div>
            </div>
          </div>

          <SidebarNav active={active} setActive={setActive} />

          <div className="mt-auto flex flex-col gap-1.5 pt-6 border-t border-white/6">
            {[
              { href: "/competitions", label: "Dashboard" },
              { href: "/settings", label: "Settings" },
              { href: "/help", label: "Help Center" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-mono text-white/20 hover:text-white/60 transition-all duration-300"
              >
                {label}
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 w-full overflow-x-hidden min-h-screen bg-[#030303]/20">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10 w-full">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{active}</h1>
                <p className="text-xs text-white/30 mt-1.5 font-mono uppercase tracking-widest">Dashboard &bull; {active}</p>
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
                {active === "profile" && <ProfilePanel profile={profile} set={set} onViewMember={(m) => setSelectedMember(m)} />}
                {active === "competitions" && <CompetitionsPanel />}
                {active === "events" && <EventsPanel />}
                {active === "inbox" && <InboxPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  </DashboardContext.Provider>
);
}
