"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

export function CalendarPanel({
  competitions,
  events,
}: {
  competitions: EnrolledItem[];
  events: EnrolledItem[];
}) {
  const { showToast } = useDashboard();
  const [viewMode, setViewMode] = useState<"schedule" | "month">("schedule");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));

  const generateGoogleCalLink = (title: string, dateStr: string) => {
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent(title);
    const dayMatch = dateStr.match(/\d+/);
    const day = dayMatch ? dayMatch[0] : "01";
    const isApril = dateStr.toLowerCase().includes("apr");
    const month = isApril ? "04" : "03";
    const dateParam = `2026${month}${day.padStart(2, "0")}T100000Z/2026${month}${day.padStart(2, "0")}T120000Z`;
    return `${baseUrl}&text=${text}&dates=${dateParam}&details=Neutron+Event+Registry`;
  };

  const schedule = [
    ...competitions.map((c) => ({ ...c, type: "Competition" })),
    ...events.map((e) => ({ ...e, type: "Event" })),
  ].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const groupedSchedule = schedule.reduce(
    (acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    },
    {} as Record<string, typeof schedule>,
  );

  const sortedDates = Object.keys(groupedSchedule)
    .filter((dateStr) => {
      const d = new Date(dateStr);
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    })
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, full: null });
    }
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = new Date(year, month, i).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      days.push({ day: i, full: fullDate });
    }
    while (days.length < 42) {
      days.push({ day: null, full: null });
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      if (next.getFullYear() < 2026) return prev;
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      if (next.getFullYear() > 2026) return prev;
      return next;
    });
  };

  const currentMonthName = currentDate.toLocaleString("en-US", {
    month: "long",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-12">
        <DashboardWidget
          title="Schedule Dashboard"
          onManage={() =>
            showToast("Syncing with Google Calendar API...", "info")
          }
        >
          <div className="max-w-5xl mx-auto py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 px-4 gap-6">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {viewMode === "schedule" ? "Timeline" : currentMonthName}{" "}
                  <span className="text-white/20 ml-2 font-light">2026</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="hidden md:flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 gap-1">
                <button
                  onClick={() => setViewMode("schedule")}
                  className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-extrabold transition-all ${viewMode === "schedule" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"}`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-extrabold transition-all ${viewMode === "month" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"}`}
                >
                  Month
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "schedule" ? (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-16 px-4"
                >
                  <div className="flex items-center gap-4 mb-4 opacity-50">
                    <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent"></div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] font-mono">
                      {currentMonthName} 2026
                    </h3>
                    <div className="h-px flex-1 bg-linear-to-l from-white/10 to-transparent"></div>
                  </div>

                  {sortedDates.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <Calendar size={24} className="text-white/10" />
                      </div>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] font-mono">
                        No events aligned for this month
                      </p>
                      <button
                        onClick={handleNextMonth}
                        className="mt-6 text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
                      >
                        Next Month &rarr;
                      </button>
                    </div>
                  ) : (
                    sortedDates.map((dateStr) => {
                      const dayEvents = groupedSchedule[dateStr];
                      const dateObj = new Date(dateStr);
                      const month = dateObj
                        .toLocaleString("en-US", { month: "short" })
                        .toUpperCase();
                      const day = dateObj.getDate();

                      return (
                        <div
                          key={dateStr}
                          className="flex flex-col md:flex-row gap-6 md:gap-12 relative group"
                        >
                          <div className="md:w-28 shrink-0 md:text-right md:sticky md:top-24 h-fit">
                            <div className="flex md:flex-col items-baseline md:items-end gap-2 md:gap-0">
                              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.3em] font-mono mb-1">
                                {month}
                              </p>
                              <p className="text-4xl md:text-5xl font-light text-white tracking-tighter leading-none">
                                {day}
                                <span className="text-sm md:text-base ml-1 opacity-20 font-mono">
                                  th
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 space-y-6 pb-4 border-l-2 md:border-l-2 border-white/5 pl-8 md:pl-12 relative">
                            <div className="absolute -left-px top-4 bottom-0 w-0.5 bg-linear-to-b from-white/10 via-white/5 to-transparent"></div>

                            {dayEvents.map((item) => (
                              <div
                                key={item.slug}
                                className="relative group/item"
                              >
                                <div className="absolute -left-[37px] md:-left-[53px] top-5 w-4 h-4 rounded-full border-4 border-[#000000] bg-white/10 group-hover/item:bg-emerald-500 group-hover/item:scale-125 transition-all duration-300 z-10 shadow-[0_0_15px_rgba(16,185,129,0)] group-hover/item:shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>

                                <div className="bg-white/2 border border-white/8 rounded-3xl p-6 md:p-8 hover:border-white/20 hover:bg-white/4 transition-all duration-500 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group/card overflow-hidden relative">
                                  <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0 group-hover/card:scale-105 transition-transform duration-500">
                                      <img
                                        src="/images/bg.jpeg"
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span
                                          className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${item.type === "Competition" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}
                                        >
                                          {item.type}
                                        </span>
                                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-mono">
                                          <Target
                                            size={12}
                                            className="text-white/20"
                                          />
                                          <span>10:00 — 18:00 IST</span>
                                        </div>
                                      </div>
                                      <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight group-hover/card:text-emerald-400 transition-colors duration-300">
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center gap-4 mt-3">
                                        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono">
                                          {item.category}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono">
                                          Global Entry
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 relative z-10">
                                    <button
                                      onClick={() => {
                                        const link = generateGoogleCalLink(
                                          item.title,
                                          item.date,
                                        );
                                        window.open(link, "_blank");
                                        showToast(
                                          "Syncing with Google Calendar...",
                                          "success",
                                        );
                                      }}
                                      className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 group/btn"
                                    >
                                      <Calendar
                                        size={16}
                                        className="group-hover/btn:scale-110 transition-transform"
                                      />
                                      <span className="hidden sm:inline">
                                        Add to Calendar
                                      </span>
                                      <span className="sm:hidden">Sync</span>
                                    </button>
                                    <Link
                                      href={`/${item.type === "Competition" ? "competitions" : "events"}/${item.slug}`}
                                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                      <ChevronRight size={20} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="month"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-4"
                >
                  <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div
                          key={d}
                          className="bg-[#050505] p-4 text-center border-b border-white/10"
                        >
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest font-mono">
                            {d}
                          </span>
                        </div>
                      ),
                    )}
                    {getDaysInMonthGrid(currentDate).map((d, i) => {
                      const hasEvents = d.full ? groupedSchedule[d.full] : null;
                      return (
                        <div
                          key={`${d.full}-${i}`}
                          className={`bg-[#030303] min-h-[120px] p-4 border-r border-b border-white/5 group hover:bg-white/2 transition-all relative ${d.day ? "cursor-pointer" : "opacity-10 pointer-events-none"}`}
                          onClick={() => hasEvents && setViewMode("schedule")}
                        >
                          <span className="text-sm font-light text-white/20 group-hover:text-white transition-colors">
                            {d.day}
                          </span>
                          <div className="mt-4 space-y-1.5">
                            {hasEvents?.slice(0, 2).map((ev) => (
                              <div
                                key={ev.slug}
                                className={`h-1.5 w-full rounded-full ${ev.type === "Competition" ? "bg-amber-500" : "bg-emerald-500"} opacity-40 group-hover:opacity-100 transition-opacity`}
                              ></div>
                            ))}
                            {(hasEvents?.length || 0) > 2 && (
                              <div className="h-1 text-[8px] font-bold text-white/10 group-hover:text-white/40 font-mono text-center">
                                +{hasEvents!.length - 2} MORE
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
