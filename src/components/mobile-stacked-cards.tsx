"use client";

import React from "react";
import { motion } from "framer-motion";

interface MobileStackedCardsProps {
  prizePool?: string;
  location?: string;
  teamSize?: string;
}

export const MobileStackedCards: React.FC<MobileStackedCardsProps> = ({ 
  prizePool = "₹50,000", 
  location = "Rishihood University", 
  teamSize = "Up to 4 Members" 
}) => {
  const cards = [
    {
      title: "Deployment Zone",
      value: location,
      color: "bg-[#252525]",
      textColor: "text-white",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
      rotate: -4,
      x: -10,
    },
    {
      title: "Mission Bounty",
      value: prizePool,
      color: "bg-[#b70000]",
      textColor: "text-white",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      ),
      rotate: 2,
      x: 10,
    },
    {
      title: "Crew Formation",
      value: teamSize,
      color: "bg-[#0a0a0a]",
      textColor: "text-white",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      rotate: -1,
      x: 0,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 space-y-[-160px] md:hidden">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ y: 100, opacity: 0, rotate: card.rotate * 2 }}
          whileInView={{ y: 0, opacity: 1, rotate: card.rotate }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ 
            duration: 1, 
            delay: i * 0.1, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className={`relative w-full max-w-[340px] aspect-4/5 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ${card.color} flex flex-col justify-between`}
          style={{ 
            zIndex: i,
            marginLeft: `${card.x}px`
          }}
        >
          <div className="flex justify-between items-start">
             {card.icon}
             <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
             </div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-4xl font-bold tracking-tighter leading-tight mb-4 text-white uppercase wrap-break-words">
              {card.value}
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
              {card.title}
            </p>
          </div>
          
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay rounded-[2.5rem]"></div>
        </motion.div>
      ))}
    </div>
  );
};
