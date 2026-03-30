"use client";

import React from "react";
import SubPageLayout from "@/components/SubPageLayout";
import { motion } from "framer-motion";

const termsGroups = [
  {
    title: "01 Eligibility",
    content: [
      "All students currently enrolled in recognized degree programs are eligible to participate.",
      "A valid college ID and registration confirmation are mandatory for official contest entry.",
      "Neutron Mission Control reserves the right to verify credentials at any time during the mission."
    ]
  },
  {
    title: "02 Conduct",
    content: [
      "We enforce a zero-tolerance policy for harassment or discrimination. Participants must maintain a professional and respectful cosmic etiquette.",
      "Fair play is mandatory. Plagiarism, cheating, or any technological malpractice in competitions will lead to immediate disqualification.",
      "Participants are responsible for any equipment or property they bring to the venue."
    ]
  },
  {
    title: "03 Liability",
    content: [
      "Neutron and NST are not responsible for any personal injuries, loss of data, or equipment damage sustained during the fest.",
      "Basic first aid is available on-site, but extensive medical needs are the participant's responsibility.",
      "By participating, you consent to being filmed and photographed for official promotional relays."
    ]
  },
  {
    title: "04 Privacy",
    content: [
      "Your registration data is used only for logistics and communication regarding Neutron 3.0. We do not sell your personal transmission data to third-party entities.",
      "We prioritize the security of your information and encrypt all inbound registration signals.",
      "You have the right to request the deletion of your data once the mission archive is closed (12 months post-fest)."
    ]
  },
  {
    title: "05 Refunds",
    content: [
      "If applicable, registration fees for competitions are non-refundable unless the specific event mission is canceled by the organizers.",
      "In the event of a full fest cancellation, refunds will be processed via original payment orbital within 14 Earth days."
    ]
  }
];

export default function TermsPage() {
  return (
    <SubPageLayout 
      title="Terms" 
      subtitle="Operational protocols and legal framework for the Neutron 3.0 technology and innovation festival."
    >
      <div className="max-w-4xl space-y-24 md:space-y-32 mb-64">
        {termsGroups.map((group, idx) => (
          <motion.section 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
          >
            <div className="border-l border-white/10 pl-6 md:pl-10">
               <h2 className="text-xl md:text-2xl font-bold tracking-widest text-white mb-6 uppercase italic leading-none">
                 {group.title}
               </h2>
               <div className="grid gap-4">
                {group.content.map((point, pIdx) => (
                  <p key={pIdx} className="text-xs md:text-sm text-white/30 leading-relaxed font-mono uppercase tracking-wide hover:text-white/60 transition-colors duration-500">
                    {point}
                  </p>
                ))}
               </div>
            </div>
          </motion.section>
        ))}

        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 1 }}
           className="pt-16 border-t border-white/5"
        >
          <div className="max-w-2xl">
            <h4 className="text-[0.6rem] font-mono tracking-[0.5em] text-white/20 uppercase mb-6">
              Legal Transmission Finalized
            </h4>
            <p className="text-xs text-white/30 font-mono uppercase tracking-widest leading-relaxed italic">
              By initiating a registration or entering the Neutron 3.0 zone, you are formally acknowledging these mission parameters as binding protocols for the duration of your orbit within the festival.
            </p>
          </div>
        </motion.div>
      </div>
    </SubPageLayout>
  );
}
