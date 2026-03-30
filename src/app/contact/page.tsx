"use client";

import React, { useState } from "react";
import SubPageLayout from "@/components/SubPageLayout";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const contactFaqs = [
  {
    question: "How soon will I receive a reply?",
    answer: "Our communications team typically processes all incoming signals within 24-48 hours. During peak mission phases, timing may vary slightly."
  },
  {
    question: "Can I visit the NST Campus?",
    answer: "Yes, visitors are welcome during operational hours. Please ensure you have a valid visitor transmission pass or invitation."
  },
  {
    question: "How do I request sponsorship information?",
    answer: "Sponsorship inquiries should be directed to our strategic partnerships orbit at partners@neutronfest.com."
  }
];

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <SubPageLayout title="Contact" showHero={false}>
      <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center -mt-12 mb-24 md:mb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <Image 
            src="https://ik.imagekit.io/yatharth/INTE.jpg" 
            alt="Contact Hero" 
            fill 
            className="object-cover brightness-40"
          />
        </div>
        
        <div className="relative z-20 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-[12rem] font-black tracking-tighter leading-none uppercase mix-blend-difference"
          >
            GET IN <span className="text-white/20">TOUCH</span>
          </motion.h1>
          <motion.p
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1, delay: 0.8 }}
             className="text-[0.6rem] md:text-xs font-mono tracking-[0.6em] text-amber-500 uppercase mt-4 italic"
          >
             Establishing Interstellar Connection
          </motion.p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 md:gap-32 mb-48 md:mb-64">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="space-y-16"
        >
          <div className="space-y-4">
            <h3 className="text-3xl md:text-[3.5rem] font-black tracking-tighter text-white uppercase italic leading-none hover:text-amber-500 transition-colors cursor-pointer">
              INFO@<br />NEUTRONFEST.COM
            </h3>
          </div>

          <div className="space-y-6">
            <span className="text-[0.6rem] font-mono tracking-widest text-white/30 uppercase">Mission Coordinates</span>
            <p className="text-lg md:text-xl text-white font-mono uppercase tracking-widest leading-relaxed">
              Newton School of Technology<br />
              Rishihood University, Sonipat, Haryana<br />
              PIN: 131021
            </p>
          </div>

          <div className="pt-12">
            <div className="h-px w-24 bg-white/20 mb-8" />
            <div className="flex flex-col gap-4 text-[0.7rem] font-mono tracking-widest text-white/40 uppercase">
               <a href="https://www.instagram.com/neutronfest/" className="hover:text-white transition-colors">Instagram</a>
               <a href="https://www.linkedin.com/company/neutronfest" className="hover:text-white transition-colors">LinkedIn</a>
               <a href="https://x.com/neutronfest" className="hover:text-white transition-colors">X / Twitter</a>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto mb-64 px-4">
         <div className="space-y-4">
            {contactFaqs.map((faq, i) => (
              <div key={i} className="border-b border-white/10" onMouseEnter={() => setOpenFaq(i)}>
                 <div className="w-full flex justify-between items-center py-8 text-left group cursor-pointer">
                    <span className="text-xs md:text-sm font-bold tracking-widest text-white/60 group-hover:text-white uppercase transition-colors">
                      {faq.question}
                    </span>
                    <span className="text-xl font-light text-white/20 transition-transform duration-300" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                      +
                    </span>
                 </div>
                 <AnimatePresence>
                   {openFaq === i && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                     >
                        <p className="pb-8 text-xs text-white/40 font-mono tracking-widest uppercase leading-relaxed max-w-2xl">
                          {faq.answer}
                        </p>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            ))}
         </div>
      </section>

      <section className="mb-64">
         <div className="px-6 md:px-12">
            <div className="h-px w-full bg-white/5 mb-16" />
            <div className="flex flex-col md:flex-row justify-between items-end gap-12">
               <div className="space-y-4">
                  <span className="text-[0.6rem] font-mono tracking-widest text-white/20 uppercase">Location Hub</span>
                  <h4 className="text-2xl font-black tracking-tighter text-white uppercase italic">NST CAMPUS COORDINATES</h4>
               </div>
               <div className="text-[0.6rem] font-mono tracking-[0.4em] text-white/40 uppercase">
                  LAT: 28.9832025 N / LNG: 77.0903573 E.
               </div>
            </div>
            
            <div className="mt-12 h-[400px] md:h-[600px] w-full relative overflow-hidden group">
               <iframe 
                  title="NST Campus Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3490.1503215831763!2d77.08754637615984!3d28.982916268082043!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390db15c164f0a91%3A0xcab7be79bc1b3bac!2sNewton%20School%20of%20Technology%2C%20Delhi%20NCR!5e0!3m2!1sen!2sin!4v1774876773387!5m2!1sen!2sin"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) grayscale(100%) contrast(1.2) brightness(0.6)" }} 
                  allowFullScreen={false} 
                  loading="lazy" 
               />
               <div className="absolute inset-0 pointer-events-none border border-white/5" />
            </div>
         </div>
      </section>
    </SubPageLayout>
  );
}
