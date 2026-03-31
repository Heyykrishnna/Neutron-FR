"use client";

import React, { useState } from "react";
import { useDashboard } from "./dashboard-context";

interface PreferenceSetting {
  id: string;
  label: string;
  description: string;
  type: "toggle" | "select" | "radio";
  value: string | boolean;
  options?: { label: string; value: string }[];
}

function PreferenceToggle({
  setting,
  onUpdate,
}: {
  setting: PreferenceSetting;
  onUpdate: (id: string, value: boolean) => void;
}) {
  const isEnabled = setting.value as boolean;

  return (
    <div className="bg-white/3 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">{setting.label}</h3>
          <p className="text-[10px] text-white/40 mt-1">
            {setting.description}
          </p>
        </div>
        <button
          onClick={() => onUpdate(setting.id, !isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? "bg-emerald-500" : "bg-white/10"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function PreferenceSelect({
  setting,
  onUpdate,
}: {
  setting: PreferenceSetting;
  onUpdate: (id: string, value: string) => void;
}) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">{setting.label}</h3>
          <p className="text-[10px] text-white/40 mt-1">
            {setting.description}
          </p>
        </div>
        <select
          value={setting.value as string}
          onChange={(e) => onUpdate(setting.id, e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-colors"
        >
          {setting.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function PreferencesPanel() {
  const { showToast } = useDashboard();
  const [preferences, setPreferences] = useState<PreferenceSetting[]>([
    {
      id: "email-notifications",
      label: "Email Notifications",
      description: "Receive email updates about competitions and events",
      type: "toggle",
      value: true,
    },
    {
      id: "push-notifications",
      label: "Push Notifications",
      description: "Get real-time notifications on your devices",
      type: "toggle",
      value: true,
    },
    {
      id: "profile-visibility",
      label: "Profile Visibility",
      description: "Control who can view your profile",
      type: "select",
      value: "public",
      options: [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
        { label: "Friends Only", value: "friends" },
      ],
    },
    {
      id: "show-badges",
      label: "Show Achievement Badges",
      description: "Display your badges publicly",
      type: "toggle",
      value: true,
    },
    {
      id: "color-mode",
      label: "Color Mode",
      description: "Choose your preferred color theme",
      type: "select",
      value: "dark",
      options: [
        { label: "Dark", value: "dark" },
        { label: "Light", value: "light" },
        { label: "Auto", value: "auto" },
      ],
    },
    {
      id: "data-collection",
      label: "Analytics",
      description: "Help us improve by sharing anonymous usage data",
      type: "toggle",
      value: false,
    },
  ]);

  const handleUpdate = (id: string, value: string | boolean) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p)),
    );
    showToast("Preference updated successfully.", "success");
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Settings Sections */}
      <div>
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
          Notifications
        </h2>
        <div className="space-y-3">
          {preferences
            .filter((p) =>
              ["email-notifications", "push-notifications"].includes(p.id),
            )
            .map((pref) =>
              pref.type === "toggle" ? (
                <PreferenceToggle
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ) : (
                <PreferenceSelect
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ),
            )}
        </div>
      </div>

      <div className="border-t border-white/5" />

      <div>
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
          Privacy & Visibility
        </h2>
        <div className="space-y-3">
          {preferences
            .filter((p) =>
              ["profile-visibility", "show-badges", "data-collection"].includes(
                p.id,
              ),
            )
            .map((pref) =>
              pref.type === "toggle" ? (
                <PreferenceToggle
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ) : (
                <PreferenceSelect
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ),
            )}
        </div>
      </div>

      <div className="border-t border-white/5" />

      <div>
        <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
          Display
        </h2>
        <div className="space-y-3">
          {preferences
            .filter((p) => ["color-mode"].includes(p.id))
            .map((pref) =>
              pref.type === "toggle" ? (
                <PreferenceToggle
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ) : (
                <PreferenceSelect
                  key={pref.id}
                  setting={pref}
                  onUpdate={handleUpdate}
                />
              ),
            )}
        </div>
      </div>

      <div className="border-t border-white/5" />

      <div className="space-y-3">
        <button
          onClick={() => showToast("Preferences saved.", "success")}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest text-sm transition-colors active:scale-95"
        >
          Save All Changes
        </button>
        <button
          onClick={() => {
            showToast("Preferences reset to defaults.", "info");
          }}
          className="w-full py-3 rounded-2xl border border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-sm transition-colors active:scale-95"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
