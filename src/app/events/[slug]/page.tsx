import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events-data";
import Link from "next/link";
import React from "react";
import EventSectionWrapper from "@/components/event-section-wrapper";
import { ScrollRevealCards } from "@/components/scroll-reveal-cards";
import EventRegistration from "@/components/event-registration";

export default async function EventSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
      <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative font-sans text-pretty">
        
        <div 
          className="fixed top-0 left-0 w-full h-screen z-0 overflow-hidden pointer-events-none" 
          style={{ perspective: "1000px" }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay z-20"></div>
          
          <div
            className="w-full h-[120%] bg-cover bg-center -mt-10 animate-[slow-pan_30s_ease-in-out_infinite_alternate]"
            style={{
              backgroundImage: `url(${event.image})`,
              filter: "brightness(0.2) contrast(1.2) grayscale(70%) blur(4px)",
              transform: "translateZ(-100px) scale(1.3)",
            }}
          />

          <div className="absolute inset-0 bg-linear-to-b from-[#030303]/20 via-[#030303]/80 to-[#030303] z-10" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)] z-10 opacity-70" />
        </div>

        <div className="fixed top-8 left-8 z-50 pointer-events-auto">
          <Link href="/planets/venus">
            <div className="flex items-center space-x-4 group cursor-pointer relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-500">
               <div className="flex items-center justify-center bg-black/50 w-8 h-8 rounded-full group-hover:bg-white transition-colors duration-500">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white group-hover:text-black transition-colors duration-500">
                   <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </div>
               <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/70 group-hover:text-white transition-colors">Return</span>
            </div>
          </Link>
        </div>

        <main className="relative z-20 mx-auto px-6 md:px-12 lg:px-24 pt-48 pb-40">
          <EventSectionWrapper event={event} />
        </main>

        <section className="relative z-20 hidden md:block">
           <ScrollRevealCards 
             prizePool={event.prizePool}
             location={event.location}
             teamSize={event.teamSize}
           />
        </section>

        <section className="relative pt-64 z-30 bg-[#030303] overflow-hidden">
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
        </section>

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
