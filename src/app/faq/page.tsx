"use client";

import React, { useState } from "react";
import SubPageLayout from "@/components/SubPageLayout";
import { motion, AnimatePresence } from "framer-motion";

const faqData = [
  {
    id: "01",
    question: "What is Neutron 3.0?",
    answer: "Neutron 3.0 is the flagship technology and innovation festival organized by graduates and undergraduate students at NST. It blends specialized tech competitions, experimental workshops, and disruptive cultural showcases into a cohesive vision of the future."
  },
  {
    id: "02",
    question: "Who can participate?",
    answer: "The festival is open to all university and college students (UG & PG). Individual eligibility may vary per event orbit, but the general cosmos is open to all builders, designers, and thinkers."
  },
  {
    id: "03",
    question: "Are there registration fees?",
    answer: "General access to the fest is free. Flagship contests and specialized events may carry a nominal registration fee to cover resource allocation. Details are listed on each event card."
  },
  {
    id: "04",
    question: "Can I join multiple events?",
    answer: "Yes. The schedule is optimized to allow participation in multiple tracks, provided there are no overlapping time blocks in the mission parameters."
  },
  {
    id: "05",
    question: "Is accommodation available?",
    answer: "Yes, limited accommodation is provided for outstation participants on a request basis. You can indicate your requirement during the registration process."
  },
  {
    id: "06",
    question: "Where is the venue?",
    answer: "The main mission is hosted at the NST Campus. Detailed transit instructions and shuttle coordinates will be shared with all registered participants."
  }
];

function FAQItem({ item, isOpen, onClick }: { item: typeof faqData[0], isOpen: boolean, onClick: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onClick}
      className={`group border-b border-white/5 last:border-0 overflow-hidden transition-colors ${isOpen ? 'bg-white/1' : ''}`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-6 md:py-8 text-left outline-none"
      >
        <div className="flex-1 max-w-2xl">
          <h3 className="text-lg md:text-xl font-bold tracking-tight text-white/80 group-hover:text-white transition-all uppercase leading-none">
            {item.question}
          </h3>
        </div>
        <div>
           <span className={`text-[0.55rem] font-mono tracking-[0.3em] uppercase transition-all duration-300 ${isOpen ? 'text-amber-500' : 'text-white/10 group-hover:text-white/30'}`}>
              {isOpen ? "[ CLOSE ]" : "[ OPEN ]"}
           </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pb-8 md:pb-12 max-w-2xl">
               <p className="text-xs md:text-sm text-white/40 leading-relaxed font-mono tracking-wide uppercase">
                 {item.answer}
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <SubPageLayout 
      title="FAQ" 
      subtitle="Critical mission parameters and frequently asked questions regarding the Neutron 3.0 mission orbits."
    >
      <div className="mb-24 scale-up-hover">
        {faqData.map((item) => (
          <FAQItem 
            key={item.id} 
            item={item} 
            isOpen={openId === item.id} 
            onClick={() => setOpenId(item.id)} 
          />
        ))}
      </div>

      <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         transition={{ duration: 1 }}
         className="pt-16 border-t border-white/5 mb-32 flex flex-col md:flex-row justify-between items-start gap-8"
      >
         <div className="max-w-sm">
            <h4 className="text-[0.5rem] font-mono tracking-[0.5em] text-white/20 uppercase mb-4">
              Still Need Data?
            </h4>
            <p className="text-sm text-white/30 leading-relaxed font-mono uppercase">
              If your inquiry remains unresolved, please establish a direct link with mission control.
            </p>
         </div>
         <a 
          href="/contact" 
          className="text-xl font-bold tracking-widest uppercase text-white hover:text-amber-500 transition-colors border-b border-white/10 hover:border-amber-500 pb-1"
        >
          Contact Mission Control
        </a>
      </motion.div>
    </SubPageLayout>
  );
}
