import { notFound } from "next/navigation";
import { getCompetitionBySlug } from "@/lib/competitions-data";
import CompetitionRegistration from "@/components/competition-registration";
import ScratchToReveal from "@/components/scratch-to-reveal";
import SmoothScroll from "@/components/smooth-scroll";
import { ScrollRevealCards } from "@/components/scroll-reveal-cards";
import Link from "next/link";
import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import BlurHeading from "@/components/blur-heading";

export default async function CompetitionSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    notFound();
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative font-sans">
        
        <div 
          className="fixed top-0 left-0 w-full h-screen z-0 overflow-hidden pointer-events-none" 
          style={{ perspective: "1000px" }}
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay z-20"></div>
          
          <div
            className="w-full h-[120%] bg-cover bg-center -mt-10 animate-[slow-pan_30s_ease-in-out_infinite_alternate]"
            style={{
              backgroundImage: `url(${competition.image})`,
              filter: "brightness(0.2) contrast(1.2) grayscale(70%) blur(4px)",
              transform: "translateZ(-100px) scale(1.3)",
            }}
          />

          <div className="absolute inset-0 bg-linear-to-b from-[#030303]/20 via-[#030303]/80 to-[#030303] z-10" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)] z-10 opacity-70" />
        </div>

        <div className="fixed top-8 left-8 z-50 pointer-events-auto">
          <Link href="/planets/jupiter">
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
          
          <div className="mb-32 relative animate-fade-in-up group/header">
            <div className="absolute -inset-x-24 -top-48 -bottom-24 z-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center scale-110 opacity-40 mix-blend-screen animate-[slow-pan_40s_linear_infinite_alternate]"
                style={{ 
                  backgroundImage: `url('https://wallpapercave.com/wp/wp3837811.jpg')`,
                  maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-transparent to-transparent z-10"></div>
            </div>

            <div className="absolute -inset-12 bg-white/5 border border-white/10 blur-3xl rounded-[4rem] -z-10 opacity-30"></div>
            <div className="relative z-10 max-w-[1400px]">
              <div className="flex items-center space-x-4 mb-10 overflow-hidden">
                <div className="h-px w-12 bg-white/20"></div>
                <span className="text-white/70 font-mono text-xs tracking-widest uppercase">{competition.date}</span>
              </div>

              <BlurHeading 
                text={competition.title} 
                className="text-7xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter leading-[0.8] mb-12 uppercase"
                spanClassName="bg-clip-text text-transparent bg-linear-to-b from-white via-white to-white/20 drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              />
              
              <div className="relative max-w-3xl group pt-4">
                <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-white/10 transition-all duration-700"></div>
                <p className="text-lg md:text-2xl font-light text-white/60 leading-relaxed pl-8 tracking-wide">
                  {competition.description}
                </p>
                <div className="mt-8 flex items-center space-x-3 text-white/30 font-mono text-[10px] uppercase tracking-[0.2em] pl-8">
                  <span className="w-1 h-1 rounded-full bg-white/40"></span>
                  <span>Mission Objective</span>
                </div>
              </div>
            </div>
          </div>

            <div className="lg:col-span-8 order-2 lg:order-1 flex flex-col space-y-24">
              
              <div className="animate-fade-in-up max-w-3xl" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-px bg-white/30"></div>
                  <h2 className="text-3xl tracking-wide uppercase font-light text-white/90">Mission Briefing</h2>
                </div>
                <div className="prose prose-invert max-w-none text-white/60 font-light leading-loose text-lg lg:text-xl">
                  <p>{competition.about}</p>
                </div>
              </div>

              <div className="relative z-30">
          <ScrollRevealCards 
            prizePool={competition.prizePool} 
            location={competition.location} 
            teamSize={competition.teamSize} 
          />
        </div>
              

              <div className="pt-16 relative">
                <div className="absolute top-0 left-0 w-1/3 h-px bg-linear-to-r from-white/30 to-transparent"></div>
                <CompetitionRegistration competitionTitle={competition.title} teamSize={competition.teamSize} />
              </div>
            </div>
        </main>

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
    </SmoothScroll>
  );
}
