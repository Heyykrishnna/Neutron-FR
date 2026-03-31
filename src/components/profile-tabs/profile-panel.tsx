"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { ProfileState } from "./types";
import { useDashboard } from "./dashboard-context";
import { useUpdateUserProfile } from "@/src/hooks/api/useUserProfile";

// These should be imported from the main profile-page.tsx or extracted separately
function DashboardWidget({
  title,
  onManage,
  children,
  className,
}: {
  title: string;
  onManage?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white/3 border border-white/5 rounded-3xl overflow-hidden ${className || ""}`}
    >
      <div className="flex items-center justify-between px-6 md:px-8 py-5 md:py-6 border-b border-white/5">
        <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">
          {title}
        </h3>
        {onManage && (
          <button
            onClick={onManage}
            className="text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors"
          >
            Manage
          </button>
        )}
      </div>
      <div className="px-6 md:px-8 py-6 md:py-8">{children}</div>
    </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white outline-none focus:border-white/40 transition-all font-mono"
            />
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
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15H9v-3L18.5 2.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

function DocumentCard({
  label,
  type,
  date,
  onUpload,
}: {
  label: string;
  type: string;
  date: string;
  onUpload: (name: string) => void;
}) {
  return (
    <div
      onClick={() => onUpload(label)}
      className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center aspect-video cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 mb-2 group-hover:text-white/60 group-hover:bg-white/10 transition-all">
        <Plus size={16} />
      </div>
      <p className="text-[10px] font-bold text-white/60 text-center">{label}</p>
      <p className="text-[8px] text-white/30 mt-1">{type}</p>
      <p className="text-[8px] text-white/20 mt-2">{date}</p>
    </div>
  );
}

export function ProfilePanel({
  profile,
  set,
  onViewMember,
  teamMembers,
  userId,
}: {
  profile: ProfileState;
  set: (key: keyof ProfileState) => (val: string) => void;
  onViewMember: (m: any) => void;
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    isMe?: boolean;
  }>;
  userId?: string;
}) {
  const { showToast, setExpandedID } = useDashboard();
  const updateProfileMutation = useUpdateUserProfile();

  // Helper to update profile fields with the hook
  const updateField = (key: keyof ProfileState) => async (value: string) => {
    if (!userId) return;

    const fieldMap: Record<keyof ProfileState, string> = {
      name: "name",
      email: "email",
      bio: "bio",
      college: "collegeName",
      year: "yearOfStudy",
      gender: "gender",
      city: "city",
      state: "state",
      whatsapp: "whatsappNumber",
      image: "image",
      collegeIdPic: "collegeIdPic",
      govtIdPic: "govtIdPic",
    };

    const apiField = fieldMap[key];

    try {
      await updateProfileMutation.mutateAsync({
        userId,
        [apiField]: value,
      });
      showToast(`${key} updated successfully.`, "success");
      // Also update local state via the set function
      set(key)(value);
    } catch (error) {
      showToast(`Failed to update ${key}.`, "error");
    }
  };

  const completedCount = [
    Boolean(profile.name && profile.gender && profile.city && profile.state),
    Boolean(profile.college && profile.year),
    Boolean(profile.email),
    Boolean(profile.whatsapp),
    Boolean(profile.govtIdPic),
    Boolean(profile.collegeIdPic),
  ].filter(Boolean).length;
  const totalChecks = 6;
  const score = Math.round((completedCount / totalChecks) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
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
              label="Date of birth"
              value="March 15th, 2004"
              onChange={() => showToast("DOB updated successfully.")}
            />
            <EditableRow
              label="Gender"
              value={profile.gender}
              onChange={updateField("gender")}
            />
            <EditableRow
              label="Phone"
              value={profile.whatsapp}
              onChange={updateField("whatsapp")}
              placeholder="+91 XXXXX XXXXX"
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
              onChange={(val) => {
                if (val.includes(",")) {
                  const [city, state] = val.split(",").map((s) => s.trim());
                  updateField("city")(city);
                  updateField("state")(state);
                } else {
                  updateField("city")(val);
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
              onUpload={(name) => showToast(`College ID "${name}" uploaded.`)}
            />
            <DocumentCard
              label="Aadhaar"
              type="Card"
              date="Mar 2026"
              onUpload={(name) => showToast(`Aadhaar "${name}" uploaded.`)}
            />
            <DocumentCard
              label="Certificate"
              type="PDF"
              date="Feb 2026"
              onUpload={(name) => showToast(`Certificate "${name}" uploaded.`)}
            />
            <div
              onClick={() =>
                showToast(
                  "Additional slots will be available after verification.",
                  "info",
                )
              }
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
          title="Data completion"
          className="flex flex-col justify-center items-center py-10"
          onManage={() =>
            showToast(
              "Analysis complete. You are in the top 5% of verified users.",
              "info",
            )
          }
        >
          <div className="w-full max-w-xs space-y-4">
            {[
              {
                label: "Personal data",
                done: Boolean(
                  profile.name &&
                  profile.gender &&
                  profile.city &&
                  profile.state,
                ),
              },
              {
                label: "Education",
                done: Boolean(profile.college && profile.year),
              },
              { label: "Email address", done: Boolean(profile.email) },
              { label: "Phone number", done: Boolean(profile.whatsapp) },
              { label: "Government ID", done: Boolean(profile.govtIdPic) },
              { label: "College ID", done: Boolean(profile.collegeIdPic) },
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
          </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
        <DashboardWidget
          title="Team structure"
          onManage={() =>
            showToast("Synchronizing team roles with global registry.", "info")
          }
        >
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${member.isMe ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5 hover:bg-white/8 hover:scale-[1.02]"}`}
                onClick={() => onViewMember(member)}
              >
                <img
                  src="/images/bg.jpeg"
                  alt={member.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <p className="text-[12px] font-bold text-white leading-tight">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono mt-0.5">
                    {member.role}
                  </p>
                </div>
                {member.isMe && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                )}
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
