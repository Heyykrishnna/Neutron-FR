"use client";

import { ShieldCheck } from "lucide-react";

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Approvals</h1>
        <p className="text-gray-400">Review and manage pending approvals</p>
      </div>

      {/* Coming Soon */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Approval System</h3>
          <p className="text-gray-400">This feature is under development</p>
        </div>
      </div>
    </div>
  );
}
