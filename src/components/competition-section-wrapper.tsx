"use client";

import React from "react";
import { useScroll, motion, useTransform } from "framer-motion";
import BlurHeading from "./blur-heading";
import CompetitionRegistration from "./competition-registration";
import { StickyScrollCards } from "./sticky-scroll-cards";
import ScrollReveal from "./ScrollReveal";
import RulesSection from "./rules-section";
import { MobileStackedCards } from "./mobile-stacked-cards";
import { SectionTransition } from "./section-transition";
export default function SectionWrapper({ competition }: { competition: any }) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });
  
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const yPos = useTransform(scrollYProgress, [0, 0.4], [0, -500]);
  const opacityVal = useTransform(scrollYProgress, [0.35, 0.45], [1, 0]);
  const dataOpacity = useTransform(scrollYProgress, [0.7, 0.8], [0, 0.5]);
  const dataY = useTransform(scrollYProgress, [0.7, 0.8], [50, 0]);
  if(!competition){
    return(
      <h1>Hello</h1>
    )
  }

  return (
    
    <div className="flex flex-col space-y-32">
      <SectionTransition className="relative group/header">
        <div className="absolute -inset-x-24 -top-48 -bottom-24 z-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 opacity-40 mix-blend-screen animate-[slow-pan_40s_linear_infinite_alternate]"
            style={{ 
              backgroundImage: `url('https://wallpapercave.com/wp/wp3837811.jpg')`,
              maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent z-10"></div>
        </div>

        <div className="absolute -inset-12 bg-white/5 border border-white/10 blur-3xl rounded-[4rem] -z-10 opacity-30"></div>
        <div className="relative z-10 max-w-[1400px] pt-40 md:pt-60">
          <div className="flex items-center space-x-4 mb-8 md:mb-12 overflow-hidden">
            <div className="h-px w-12 bg-white/20"></div>
            <span className="text-white/70 font-mono text-xs tracking-widest uppercase">{competition.date}</span>
          </div>

          <BlurHeading 
            text={competition.title} 
            className="text-5xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter leading-[0.8] mb-16 md:mb-12 uppercase"
            spanClassName="bg-clip-text text-transparent bg-linear-to-b from-white via-white to-white/20 drop-shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
          />
          
          <div className="relative max-w-3xl group pt-4">
            {/* <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-white/10 transition-all duration-700"></div> */}
            <div className="pl-8 space-y-8">
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-white/50 font-mono backdrop-blur-md">
                  {competition.category}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.2em] text-white/50 font-mono backdrop-blur-md">
                  {competition.teamSize}
                </span>
                <span className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-[0.2em] font-mono backdrop-blur-md ${
                  competition.status === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  competition.status === 'closed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  competition.status === 'postponed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-white/5 border-white/10 text-white/30'
                }`}>
                  {competition.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionTransition>
      <div ref={targetRef} className="relative h-auto lg:h-[400vh] w-full">
        <div className="relative lg:sticky lg:top-0 lg:h-screen flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-40 w-full items-start">
            <div className="relative h-auto lg:h-screen px-4 py-12 md:py-32 overflow-hidden">
               <motion.div 
                 style={{ 
                   y: isMobile ? 0 : yPos,
                   opacity: isMobile ? 1 : opacityVal
                 }}
                 className="flex flex-col space-y-12"
               >
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-px bg-white"></div>
                  <h2 className="text-3xl tracking-wide uppercase font-semibold text-white/90">Mission Briefing</h2>
                </div>
                <div className="flex flex-col space-y-12 pr-12">
                  <ScrollReveal
                    baseOpacity={0}
                    blurStrength={10}
                    textClassName="text-lg md:text-xl font-light leading-relaxed text-white/80"
                    containerClassName="mb-8"
                  >
                    {competition.about}
                  </ScrollReveal>

                  <br/>
                  <br/>

                  <ScrollReveal
                    baseOpacity={0}
                    blurStrength={10}
                    textClassName="text-md md:text-lg font-light leading-relaxed text-white/60"
                  >
                    As you venture deeper into the mission parameters, the gravity of the challenge becomes clear. Every decision counts, every calculation matters. We are looking for the elite, those who can survive the vacuum of space and the isolation of distant worlds.
                  </ScrollReveal>

                  <ScrollReveal
                    baseOpacity={0}
                    blurStrength={10}
                    textClassName="text-md md:text-lg font-light leading-relaxed text-white/40"
                    containerClassName="mb-8"
                  >
                    The mission lifecycle demands endurance and high cognitive function. You will be pushed to your limits, but the data harvested will pave the way for future generations. Prepare for launch sequence initiation.
                  </ScrollReveal>

                  <div className="pt-12">
                    <RulesSection rules={competition.rules} />
                  </div>

                  <p className="opacity-30 italic font-mono text-xs tracking-[0.3em] pt-12 uppercase border-t border-white/5">
                    End of Briefing • Awaiting Commander Input
                  </p>
                </div>
               </motion.div>
               
               <motion.div
                 style={{ 
                   opacity: isMobile ? 0.2 : dataOpacity,
                   y: isMobile ? 0 : dataY
                 }}
                 className="absolute inset-x-0 bottom-24 flex items-center justify-start px-4 text-white/20 pointer-events-none"
               >
                 <div className="flex flex-col space-y-4">
                   <div className="text-8xl font-black uppercase tracking-tighter opacity-10">Data</div>
                   <div className="text-8xl font-black uppercase tracking-tighter opacity-10 leading-[0.8]">Analysis</div>
                   <div className="text-xs font-mono uppercase tracking-[0.4em] pt-8">System Syncing... Keep Scrolling</div>
                 </div>
               </motion.div>
            </div>

            <div className="hidden lg:flex flex-col justify-center h-full pr-12">
              <StickyScrollCards 
                progress={scrollYProgress}
                prizePool={competition.prizePool}
                location={competition.location}
                teamSize={competition.teamSize}
                competitionTitle={competition.title}
                category={competition.category}
                eventType={competition.eventType}
              />
            </div>

            <div className="block lg:hidden mt-0">
               <MobileStackedCards 
                 prizePool={competition.prizePool}
                 location={competition.location}
                 teamSize={competition.teamSize}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
