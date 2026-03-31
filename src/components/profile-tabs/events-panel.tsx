"use client";

import React from "react";
import Link from "next/link";
import { EnrolledItem } from "./types";
import { useDashboard } from "./dashboard-context";

type NavItem = "profile" | "competitions" | "events" | "calendar" | "inbox";

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

function EnrolledCard({ item, href }: { item: EnrolledItem; href: string }) {
  const statusColor: Record<string, string> = {
    open: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    closed: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    postponed: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    cancelled: "bg-white/5 border-white/10 text-white/30",
  };

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/14 transition-all duration-200 group">
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
            <span className="text-[10px] text-white/25 font-mono">
              {item.teamSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventsPanel({
  setActive,
  events,
}: {
  setActive?: (v: NavItem) => void;
  events: EnrolledItem[];
}) {
  const { showToast } = useDashboard();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8">
        <DashboardWidget
          title="Enrolled Events"
          onManage={() =>
            showToast("Reviewing event enrollment history.", "info")
          }
        >
          <div className="space-y-3">
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

      <div className="lg:col-span-4">
        <DashboardWidget
          title="Calendar View"
          onManage={() => showToast("Syncing with Google Calendar...", "info")}
        >
          <div
            className="aspect-square bg-white/3 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setActive?.("calendar")}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center mb-4">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest font-mono">
                MAR
              </p>
              <p className="text-2xl font-bold text-white uppercase tracking-tighter">
                30
              </p>
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-widest">
              No Events Today
            </p>
            <p className="text-[10px] text-white/20 mt-2 font-mono uppercase tracking-[0.2em]">
              Next: Web3 Summit (Apr 4)
            </p>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
