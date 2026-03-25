"use client";

import React, { useState } from "react";
import { Modal } from "./modal";
import { motion } from "framer-motion";

interface RulesSectionProps {
  rules: string[];
  title?: string;
}

export default function RulesSection({ rules, title = "Rules & Guidelines" }: RulesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const previewRules = rules.slice(0, 3);

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-px bg-white/40"></div>
        <h2 className="text-2xl tracking-widest uppercase font-medium text-white/80">{title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {previewRules.map((rule, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-4 group"
          >
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors" />
            <p className="text-lg font-light text-white/60 leading-relaxed group-hover:text-white/90 transition-colors">
              {rule}
            </p>
          </motion.div>
        ))}
      </div>

      {rules.length > 3 && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-fit underline text-sm font-mono uppercase tracking-[0.2em] text-white/70 hover:text-white/40 transition-all duration-300 group"
        >
          <span className="flex items-center cursor-pointer">
            View All Rules
            <svg 
              className="ml-3 group-hover:translate-x-1 transition-transform" 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
      >
        <div className="space-y-10 py-4">
          <div className="grid grid-cols-1 gap-x-12 gap-y-10">
            {rules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ease: "easeOut" }}
                className="flex items-start space-x-6 group"
              >
                <div className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-white/30 group-hover:bg-white group-hover:scale-125 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Protocol {String(index + 1).padStart(2, '0')}</span>
                  <p className="text-xl md:text-2xl text-white/70 leading-relaxed font-light group-hover:text-white transition-colors duration-500">
                    {rule}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="pt-16 mt-16 border-t border-white/5 flex flex-col items-center space-y-4">
             <div className="flex items-center space-x-4 opacity-20">
               <div className="h-px w-8 bg-white" />
               <p className="text-[10px] font-mono text-white uppercase tracking-[0.5em]">
                 Neutron Space Protocol
               </p>
               <div className="h-px w-8 bg-white" />
             </div>
             <p className="text-[8px] font-mono text-white/10 uppercase tracking-[1em]">
               System Integrity Verified • Access Granted
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
