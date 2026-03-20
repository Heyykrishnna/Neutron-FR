"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  FileText,
  Clock,
  Trophy,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetition } from "@/src/hooks/api/useCompetitions";
import { usePublicCompetitionFormFields } from "@/src/hooks/api/usePublicRegistration";

/* ─────────────── tiny atoms ─────────────── */

function Tag({ children }) {
  return (
    <span className="inline-block rounded px-2.5 py-0.75 text-[10px] uppercase tracking-[0.12em] border border-violet-400/40 bg-violet-500/10 text-violet-300 font-mono">
      {children}
    </span>
  );
}

function Pill({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-white/10 bg-white/5 px-4 py-3.5">
      <span className="mt-px shrink-0 text-violet-500">{icon}</span>
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-widest text-white/35 font-mono">
          {label}
        </div>
        <div className="text-[13px] leading-[1.4] text-white/75">{value}</div>
      </div>
    </div>
  );
}

function PrizeCard({ prize, index }) {
  const theme = [
    {
      border: "border-violet-400/20",
      bg: "bg-violet-500/10",
      label: "text-violet-300",
      watermark: "text-violet-500/10",
    },
    {
      border: "border-indigo-400/20",
      bg: "bg-indigo-500/10",
      label: "text-indigo-300",
      watermark: "text-indigo-500/10",
    },
    {
      border: "border-sky-400/20",
      bg: "bg-sky-500/10",
      label: "text-sky-300",
      watermark: "text-sky-500/10",
    },
  ][index % 3];

  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border px-5 py-4 ${theme.border} ${theme.bg}`}
    >
      <div
        className={`pointer-events-none absolute right-3 top-1/2 select-none text-[56px] font-bold leading-none -translate-y-1/2 font-mono ${theme.watermark}`}
      >
        {index + 1}
      </div>
      <div
        className={`mb-1.5 text-[10px] uppercase tracking-widest font-mono ${theme.label}`}
      >
        {prize.label || prize.rank}
      </div>
      {prize.cash > 0 && (
        <div className="text-[22px] font-bold tracking-[-0.02em] text-zinc-100 font-mono">
          ₹{prize.cash.toLocaleString()}
        </div>
      )}
      {prize.inkind?.length > 0 && (
        <div className="mt-1.5 text-xs text-white/40">
          + {prize.inkind.join(", ")}
        </div>
      )}
    </div>
  );
}

const toAbsoluteUrl = (base, path) => {
  if (!base || !path) return null;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const buildPosterCandidates = (posterPath) => {
  if (!posterPath) return [];

  const candidates = [];
  const add = (value) => {
    if (!value) return;
    if (!candidates.includes(value)) {
      candidates.push(value);
    }
  };

  const normalizedPath = posterPath.startsWith("/")
    ? posterPath
    : `/${posterPath}`;

  if (/^https?:\/\//i.test(posterPath)) {
    add(posterPath);
  }

  add(normalizedPath);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (apiBase) {
    add(toAbsoluteUrl(apiBase, normalizedPath));

    const baseWithoutApiPrefix = apiBase.replace(/\/api\/v\d+\/?$/i, "");
    add(toAbsoluteUrl(baseWithoutApiPrefix, normalizedPath));
  }

  if (typeof window !== "undefined") {
    add(toAbsoluteUrl(window.location.origin, normalizedPath));

    const host = window.location.hostname;
    const protocol = window.location.protocol;
    add(`${protocol}//${host}:8080${normalizedPath}`);
    add(`${protocol}//${host}:3001${normalizedPath}`);
  }

  return candidates;
};

/* ─────────────── main page ─────────────── */

export default function PublicCompetitionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const competitionId = params?.competitionId;
  const [posterCandidateIndex, setPosterCandidateIndex] = useState(0);

  const {
    data: competition,
    isLoading,
    isError,
    error,
  } = useCompetition(competitionId);
  const { data: formInfo, isLoading: formLoading } =
    usePublicCompetitionFormFields(competitionId);

  const registerEnabled = useMemo(() => {
    if (!competition) return false;
    const beforeDeadline =
      !competition.registrationDeadline ||
      new Date(competition.registrationDeadline) > new Date();
    return (
      competition.status === "OPEN" &&
      competition.registrationsOpen &&
      beforeDeadline &&
      Boolean(formInfo?.formId) &&
      (formInfo?.fields || []).length > 0
    );
  }, [competition, formInfo]);

  const posterCandidates = useMemo(
    () => buildPosterCandidates(competition?.posterPath),
    [competition?.posterPath],
  );
  const posterUrl = posterCandidates[posterCandidateIndex] || null;

  useEffect(() => {
    setPosterCandidateIndex(0);
  }, [competition?.posterPath]);

  const handlePosterError = () => {
    setPosterCandidateIndex((current) => {
      if (current >= posterCandidates.length - 1) return current;
      return current + 1;
    });
  };

  const hasDynamicForm = (formInfo?.fields || []).length > 0;
  const hasPrizes = (competition?.prizePool || []).length > 0;

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const handleRegister = () => {
    const target = `/competitions/${competitionId}/register`;
    if (!user) {
      router.push(`/auth/login?next=${encodeURIComponent(target)}`);
      return;
    }
    router.push(target);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <CircularProgress size={22} sx={{ color: "#7c3aed" }} />
      </div>
    );
  }

  if (isError || !competition) {
    return (
      <div className="min-h-screen bg-[#050505] p-8">
        <p className="text-red-400 text-[13px] font-mono">
          {error?.response?.data?.message ||
            error?.message ||
            "Competition not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      {posterUrl ? (
        <div className="relative h-50 sm:h-80 w-full overflow-hidden bg-[#0a0a0a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={competition.title}
            onError={handlePosterError}
            className="h-full w-full object-cover opacity-55 saturate-75"
          />
          <div className="absolute inset-0 bg-linear-to-r from-violet-700/20 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#050505]" />
        </div>
      ) : (
        <div className="h-1.5 w-full bg-linear-to-r from-violet-700 via-indigo-700 to-violet-600" />
      )}

      <div className="mx-auto max-w-215 px-6 pb-20">
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 py-5 text-[11px] uppercase tracking-[0.08em] text-white/35 hover:text-white/65 transition-colors font-mono"
        >
          <ArrowLeft size={12} />
          Competitions
        </Link>

        <div className="mb-7">
          <h1 className="mb-3 text-[clamp(32px,6vw,54px)] leading-[1.08] tracking-[-0.01em] text-zinc-100 italic font-serif">
            {competition.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{competition.status}</Tag>
            {competition.type && <Tag>{competition.type}</Tag>}
            {competition.category && <Tag>{competition.category}</Tag>}
            {competition.isPaid ? (
              <Tag>Paid · ₹{competition.registrationFee}</Tag>
            ) : (
              <Tag>Free Entry</Tag>
            )}
          </div>
        </div>

        {competition.shortDescription && (
          <p className="mb-9 max-w-155 text-[15px] leading-[1.75] text-white/45">
            {competition.shortDescription}
          </p>
        )}

        <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/25 font-mono">
          Details
        </div>
        <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {competition.type === "TEAM" && (
            <Pill
              icon={<Users size={14} />}
              label="Team Size"
              value={
                competition.minTeamSize && competition.maxTeamSize
                  ? `${competition.minTeamSize} – ${competition.maxTeamSize} members`
                  : competition.minTeamSize
                    ? `Min ${competition.minTeamSize}`
                    : "—"
              }
            />
          )}
          <Pill
            icon={<Clock size={14} />}
            label="Starts"
            value={formatDate(competition.startTime) || "TBA"}
          />
          <Pill
            icon={<Clock size={14} />}
            label="Ends"
            value={formatDate(competition.endTime) || "TBA"}
          />
          <Pill
            icon={<Calendar size={14} />}
            label="Registration Deadline"
            value={formatDate(competition.registrationDeadline) || "Open"}
          />
          <Pill
            icon={<MapPin size={14} />}
            label="Venue"
            value={
              [
                competition.venueName,
                competition.venueFloor,
                competition.venueRoom,
              ]
                .filter(Boolean)
                .join(", ") || "TBA"
            }
          />
          <Pill
            icon={<FileText size={14} />}
            label="Registration Form"
            value={
              formLoading
                ? "Checking…"
                : hasDynamicForm
                  ? `${formInfo.fields.length} fields`
                  : "Not configured"
            }
          />
          {competition.maxRegistrations && (
            <Pill
              icon={<Layers size={14} />}
              label="Max Registrations"
              value={competition.maxRegistrations}
            />
          )}
        </div>

        {(competition.subVenues || []).length > 0 && (
          <>
            <hr className="my-9 border-0 border-t border-white/10" />
            <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/25 font-mono">
              Sub Venues
            </div>
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              {competition.subVenues.map((sv, i) => (
                <Pill
                  key={i}
                  icon={<MapPin size={14} />}
                  label={sv.notes || `Venue ${i + 1}`}
                  value={[
                    sv.name,
                    sv.floor,
                    sv.room,
                    sv.capacity ? `Cap. ${sv.capacity}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </div>
          </>
        )}

        {hasPrizes && (
          <>
            <hr className="my-9 border-0 border-t border-white/10" />
            <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/25 font-mono">
              <Trophy size={10} />
              Prize Pool
            </div>
            <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {competition.prizePool.map((p, i) => (
                <PrizeCard key={i} prize={p} index={i} />
              ))}
            </div>
          </>
        )}

        {competition.rulesRichText && (
          <>
            <hr className="my-9 border-0 border-t border-white/10" />
            <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/25 font-mono">
              Rules
            </div>
            <div
              className="text-sm leading-8 text-white/55 [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xs [&_h1]:uppercase [&_h1]:tracking-[0.08em] [&_h1]:text-white/70 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xs [&_h2]:uppercase [&_h2]:tracking-[0.08em] [&_h2]:text-white/70 [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-[0.08em] [&_h3]:text-white/70 [&_ol]:pl-5 [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: competition.rulesRichText }}
            />
          </>
        )}

        <div className="h-20" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-100 flex items-center justify-between gap-4 border-t border-white/10 bg-[#050505]/90 px-6 py-4 backdrop-blur-md">
        <span className="hidden sm:block truncate text-base italic text-white/50 font-serif">
          {competition.title}
        </span>
        <button
          className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-6 py-2.75 text-[11px] uppercase tracking-[0.12em] font-mono transition-opacity ${
            registerEnabled
              ? "bg-linear-to-br from-violet-600 to-indigo-700 text-white hover:opacity-85"
              : "bg-white/10 text-white/35 cursor-not-allowed"
          }`}
          onClick={handleRegister}
          disabled={!registerEnabled}
        >
          {registerEnabled ? (
            <>
              Register Now <ChevronRight size={13} />
            </>
          ) : (
            "Registration Unavailable"
          )}
        </button>
      </div>
    </div>
  );
}
