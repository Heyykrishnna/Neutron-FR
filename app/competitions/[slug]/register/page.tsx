"use client";

import React, { use } from "react";
import Link from "next/link";
import CompetitionRegistration from "@/src/components/competition-registration";
import { useCompetition } from "@/hooks/api/useCompetitions";
import { ReturnButton } from "@/components/return-button";

const buildTeamSizeLabel = (competition: any): string => {
  if (competition?.minTeamSize && competition?.maxTeamSize) {
    return `${competition.minTeamSize}-${competition.maxTeamSize} Members`;
  }
  if (competition?.maxTeamSize) {
    return `${competition.maxTeamSize} Members`;
  }
  if (competition?.teamSize) {
    return String(competition.teamSize);
  }
  return "1 Member";
};

export default function CompetitionRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const {
    data: competition,
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
            Unable to load registration
          </h1>
          <button
            onClick={() => refetch()}
            className="mt-6 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-6">
        <div className="max-w-xl text-center border border-white/20 bg-white/5 rounded-2xl p-10">
          <h1 className="text-2xl font-bold mb-3">Competition not found</h1>
          <Link
            href="/competitions"
            className="text-white/70 hover:text-white underline"
          >
            Back to competitions
          </Link>
        </div>
      </div>
    );
  }

  const competitionId = String(competition.id || competition._id || slug);

  return (
    <div className="min-h-screen bg-[#030303] text-white px-6 py-16">
      <ReturnButton href={`/competitions/${competitionId}`} />
      <div className="max-w-4xl mx-auto pt-20">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
          Registration
        </h1>
        <p className="text-white/60 mb-12">
          {competition.title || competition.name}
        </p>

        <CompetitionRegistration
          competitionId={competitionId}
          competitionTitle={String(
            competition.title || competition.name || "Competition",
          )}
          teamSize={buildTeamSizeLabel(competition)}
        />
      </div>
    </div>
  );
}
