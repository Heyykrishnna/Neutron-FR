"use client";

import React, { use } from "react";
import Link from "next/link";
import SectionWrapper from "@/components/competition-section-wrapper";
import { ScrollRevealCards } from "@/components/scroll-reveal-cards";
import AudioController from "@/components/audio-controller";
import { ScrollProgressIndicator } from "@/components/scroll-progress-indicator";
import { ParallaxBackground } from "@/components/parallax-background";
import { ReturnButton } from "@/components/return-button";
import { SectionTransition } from "@/components/section-transition";
import { useCompetition } from "@/hooks/api/useCompetitions";

const buildTeamSizeLabel = (event: any): string => {
  if (event?.minTeamSize && event?.maxTeamSize) {
    return `${event.minTeamSize}-${event.maxTeamSize} Members`;
  }
  if (event?.maxTeamSize) {
    return `${event.maxTeamSize} Members`;
  }
  if (event?.teamSize) {
    return String(event.teamSize);
  }
  return "";
};

const formatDateTime = (value: any): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const buildLocationLabel = (event: any): string => {
  const parts = [
    event?.venueName,
    event?.venueRoom,
    event?.venueFloor,
  ]
    .map((part) => toDisplayText(part))
    .filter(Boolean);

  if (parts.length > 0) return parts.join(", ");
  return toDisplayText(event?.location || event?.venue);
};

const buildPrizePoolLabel = (prizePool: any): string => {
  if (!Array.isArray(prizePool)) return toDisplayText(prizePool);

  return prizePool
    .map((entry) => {
      const rank = toDisplayText(entry?.rank);
      const label = toDisplayText(entry?.label);
      const cash = formatCurrency(entry?.cash);

      const prefix = rank ? `Rank ${rank}` : label || "Prize";
      if (cash) return `${prefix}: ${cash}`;
      return prefix;
    })
    .filter(Boolean)
    .join(" • ");
};

const toDisplayText = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter(Boolean)
      .join(" • ");
  }

  if (typeof value === "object") {
    if (value.label) return String(value.label);
    if (value.cash) {
      return value.rank ? `${value.cash} (${value.rank})` : String(value.cash);
    }

    return Object.values(value)
      .map((item) => toDisplayText(item))
      .filter(Boolean)
      .join(" ");
  }

  return "";
};

export default function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const {
    data: event,
    isLoading,
    isError,
    refetch,
  } = useCompetition(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center border border-rose-500/30 bg-rose-500/10 rounded-2xl p-10">
          <h1 className="text-2xl font-bold mb-3">
            Unable to load event
          </h1>
          <p className="text-white/70 mb-8">
            Please try fetching this page again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center border border-white/20 bg-white/5 rounded-2xl p-10">
          <h1 className="text-2xl font-bold mb-3">Event not found</h1>
          <p className="text-white/70">
            The requested event does not exist.
          </p>
        </div>
      </div>
    );
  }

  const eventId = String(event.id || event._id || slug);

  const normalizedEvent = {
    ...event,
    image:
      event.bannerPath ||
      event.bannerMediaPath ||
      "",
    title: toDisplayText(event.title || event.name),
    teamSize: buildTeamSizeLabel(event),
    about:
      event.about ||
      event.description ||
      event.shortDescription ||
      "",
    status: String(event.status || "").toUpperCase(),
    date: formatDateTime(
      event.startTime ||
        event.startDate ||
        event.date ||
        event.createdAt,
    ),
    prizePool: buildPrizePoolLabel(event.prizePool),
    location: buildLocationLabel(event),
    category: toDisplayText(event.category),
    eventType: toDisplayText(event.eventType),
    registrationFee: formatCurrency(event.registrationFee),
    registrationDeadline: formatDateTime(event.registrationDeadline),
    rules: Array.isArray(event.rules)
      ? event.rules
      : typeof event.rules === "string" && event.rules.trim().length
        ? [event.rules]
        : [],
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative font-sans text-pretty">
      <ParallaxBackground imageUrl={normalizedEvent.image} />
      <AudioController />
      <ScrollProgressIndicator />

      <ReturnButton href="/planets/venus" />

      <main className="relative z-20 mx-auto px-6 md:px-12 lg:px-24 pt-48 pb-40">
        <SectionWrapper competition={normalizedEvent} />
      </main>

      <SectionTransition className="relative z-20 hidden md:block">
        <ScrollRevealCards
          prizePool={normalizedEvent.prizePool}
          location={normalizedEvent.location}
          teamSize={normalizedEvent.teamSize}
        />
      </SectionTransition>

      <SectionTransition className="relative pt-64 z-30 bg-[#030303] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-transparent to-[#030303] pointer-events-none -translate-y-full"></div>
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <div className="mb-24 text-center">
            <div className="h-px w-32 bg-white/10 mx-auto mb-12" />
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase">
              Launch Initiation
            </h2>
            <p className="text-white/40 text-xl font-light tracking-wide">
              Confirm your mission parameters for{" "}
              <span className="text-white">{normalizedEvent.title}</span>
            </p>
          </div>
          <Link
            href={`/events/${eventId}/register`}
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Continue To Registration
          </Link>
        </div>
        <div className="h-[20vh]" />
      </SectionTransition>

      <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes slow-pan {
            0% { transform: translateY(0) scale(1.1); }
            100% { transform: translateY(-5%) scale(1.2); }
          }
        `}</style>
    </div>
  );
}
