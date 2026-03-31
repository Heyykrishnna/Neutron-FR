"use client";

import React from "react";
import Link from "next/link";
import { EnrolledItem } from "./types";
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

export function CompetitionsPanel({
  competitions,
}: {
  competitions: EnrolledItem[];
}) {
  const { showToast } = useDashboard();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8">
        <DashboardWidget
          title="My Competitions"
          onManage={() =>
            showToast("Competition migration logs in progress.", "info")
          }
        >
          <div className="space-y-3">
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
                    item={c}
                    href={`/competitions/${c.slug}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DashboardWidget>
      </div>

      <div className="lg:col-span-4">
        <DashboardWidget
          title="Stats & Filters"
          onManage={() =>
            showToast("Custom analytics views are being built.", "info")
          }
        >
          <div className="space-y-4">
            {[
              { label: "Active", value: "3", color: "emerald-400" },
              { label: "Completed", value: "2", color: "blue-400" },
              { label: "Rank", value: "Top 1%", color: "amber-400" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/5 transition-colors hover:border-white/10"
                onClick={() =>
                  showToast(
                    `Detailed stats for ${stat.label} coming soon.`,
                    "info",
                  )
                }
              >
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest font-mono">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-1.5 h-6 rounded-full bg-${stat.color} opacity-40 shadow-[0_0_12px_rgba(255,255,255,0.1)] group-hover:opacity-100 transition-opacity`}
                ></div>
              </div>
            ))}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
