"use client";

import React, { useState } from "react";
import { useDashboard } from "./dashboard-context";

interface Credential {
  id: string;
  label: string;
  type: "text" | "password" | "email";
  value: string;
  placeholder: string;
}

function CredentialField({
  credential,
  onUpdate,
  onDelete,
}: {
  credential: Credential;
  onUpdate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(credential.value);

  const handleSave = () => {
    if (tempValue.trim()) {
      onUpdate(credential.id, tempValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(credential.value);
    setIsEditing(false);
  };

  return (
    <div className="bg-white/3 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
          {credential.label}
        </label>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-[0.1em]"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-[9px] font-bold text-white/30 hover:text-white/60 uppercase tracking-[0.1em]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[9px] font-bold text-white/30 hover:text-white/60 uppercase tracking-[0.1em]"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(credential.id)}
              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-[0.1em]"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <input
          type={credential.type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder={credential.placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-colors"
          autoFocus
        />
      ) : (
        <div className="font-mono text-white/50">
          {credential.type === "password" ? (
            <span className="select-none">
              {"•".repeat(credential.value.length)}
            </span>
          ) : (
            <span className="break-all">{credential.value}</span>
          )}
        </div>
      )}
    </div>
  );
}

export function CredentialsPanel() {
  const { showToast } = useDashboard();
  const [credentials, setCredentials] = useState<Credential[]>([
    {
      id: "api-key",
      label: "API Key",
      type: "password",
      value: "sk-1234567890abcdef",
      placeholder: "Enter API key",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      value: "user@example.com",
      placeholder: "Enter email",
    },
  ]);

  const handleUpdate = (id: string, value: string) => {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value } : c)),
    );
    showToast("Credential updated successfully.", "success");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      showToast("Credential deleted.", "success");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white/3 border border-white/5 rounded-3xl overflow-hidden">
        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-white/5">
          <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">
            Credentials & API Keys
          </h2>
          <p className="text-[10px] text-white/40 mt-2 font-mono">
            Securely manage authentication tokens and credentials
          </p>
        </div>

        <div className="px-6 md:px-8 py-6 md:py-8">
          {credentials.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/5 py-12 text-center">
              <p className="text-sm text-white/20 italic font-mono uppercase tracking-widest">
                No credentials added yet.
              </p>
              <button
                onClick={() =>
                  showToast("Credential creation dialog coming soon.", "info")
                }
                className="mt-4 inline-block text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-[0.2em] transition-all"
              >
                Add Credential →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <CredentialField
                  key={credential.id}
                  credential={credential}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}

              <button
                onClick={() =>
                  showToast("Credential creation dialog coming soon.", "info")
                }
                className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
              >
                + Add New Credential
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
          ⚠ Security Notice
        </p>
        <p className="text-[9px] text-white/40 mt-2 leading-relaxed">
          Never share your credentials or API keys. Treat them as passwords. If
          compromised, delete immediately and regenerate.
        </p>
      </div>
    </div>
  );
}
