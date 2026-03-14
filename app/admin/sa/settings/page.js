"use client";

import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Configure system settings and preferences
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-4">
            <SettingsIcon className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">System Settings</h3>
          <p className="text-gray-400">This feature is under development</p>
        </div>
      </div>
    </div>
  );
}
