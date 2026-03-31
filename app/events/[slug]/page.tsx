import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events-data";
import Link from "next/link";
import React from "react";
import EventSectionWrapper from "@/components/event-section-wrapper";
import { ScrollRevealCards } from "@/components/scroll-reveal-cards";
import EventRegistration from "@/components/event-registration";
import AudioController from "@/components/audio-controller";
import { ScrollProgressIndicator } from "@/components/scroll-progress-indicator";
import { ParallaxBackground } from "@/components/parallax-background";
import { ReturnButton } from "@/components/return-button";
import { SectionTransition } from "@/components/section-transition";
export default async function EventSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
      <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative font-sans text-pretty">
        
        <ParallaxBackground imageUrl={event.image} />
        <AudioController />
        <ScrollProgressIndicator />

        <ReturnButton href="/planets/venus" />

        <main className="relative z-20 mx-auto px-6 md:px-12 lg:px-24 pt-48 pb-40">
          <EventSectionWrapper event={event} />
        </main>

        <SectionTransition className="relative z-20 hidden md:block">
           <ScrollRevealCards 
             prizePool={event.prizePool}
             location={event.location}
             teamSize={event.teamSize}
           />
        </SectionTransition>

        <SectionTransition className="relative pt-64 z-30 bg-[#030303] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-transparent to-[#030303] pointer-events-none -translate-y-full"></div>
          <div className="max-w-4xl mx-auto px-6 relative">
             <div className="mb-24 text-center">
               <div className="h-px w-32 bg-white/10 mx-auto mb-12" />
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 uppercase">Launch Initiation</h2>
               <p className="text-white/40 text-xl font-light tracking-wide">Confirm your mission parameters for <span className="text-white">{event.title}</span></p>
             </div>
             <EventRegistration eventTitle={event.title} teamSize={event.teamSize} />
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
