"use client";

import React from "react";
import { useDashboard } from "./dashboard-context";

function DashboardWidget({
  title,
  onManage,
  children,
}: {
  title: string;
  onManage?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-3xl overflow-hidden">
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

interface InboxInvite {
  id: string;
  inviteToken: string;
  title: string;
  user: string;
  avatar: string;
  time: string;
  role: string;
}

export function InboxPanel({
  invites,
  onAccept,
  onDecline,
  isMutating,
}: {
  invites: InboxInvite[];
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
