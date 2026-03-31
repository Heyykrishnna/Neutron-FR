"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

function parseTeamSize(sizeStr: string): number[] {
  const match = sizeStr.match(/(\d+)(?:-(\d+))?/);
  if (!match) return [1];
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  const options = [];
  for(let i=min; i<=max; i++) {
    options.push(i);
  }
  return options;
}

type MemberData = {
  name: string;
  email: string;
  phone: string;
};

export default function EventRegistration({
  eventTitle,
  teamSize,
}: {
  eventTitle: string;
  teamSize: string;
}) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const teamOptions = useMemo(() => parseTeamSize(teamSize), [teamSize]);

  const [formData, setFormData] = useState({
    college: "",
    teamSize: teamOptions[0].toString(),
    members: [{ name: "", email: "", phone: "" }] as MemberData[],
  });

  useEffect(() => {
    setFormData((prev) => {
      const defaultSize = teamOptions[0];
      const newMembers = [...prev.members];
      while (newMembers.length < defaultSize) {
        newMembers.push({ name: "", email: "", phone: "" });
      }
      return { 
        ...prev, 
        teamSize: defaultSize.toString(),
        members: newMembers.slice(0, defaultSize)
      };
    });
  }, [teamOptions]);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setFormData((prev) => {
      const newMembers = [...prev.members];
      while (newMembers.length < newSize) {
        newMembers.push({ name: "", email: "", phone: "" });
      }
      return {
        ...prev,
        teamSize: e.target.value,
        members: newMembers.slice(0, newSize)
      };
    });
  };

  const handleMemberChange = (index: number, field: keyof MemberData, value: string) => {
    setFormData((prev) => {
      const newMembers = [...prev.members];
      newMembers[index] = { ...newMembers[index], [field]: value };
      return { ...prev, members: newMembers };
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto transform transition-all hover:border-white/20">
        <svg
          className="w-16 h-16 mx-auto mb-6 text-white/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h3 className="text-2xl font-semibold mb-4 text-white">Authentication Required</h3>
        <p className="text-white/60 mb-8 font-light">
          You must be signed in to your Neutron account to register for {eventTitle}.
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
          className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform duration-300 w-full md:w-auto cursor-pointer"
        >
          Initiate Launch Sequence
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto"
      >
        <svg
          className="w-20 h-20 mx-auto mb-6 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-3xl font-bold mb-4 text-white">Registration Complete</h3>
        <p className="text-white/60 mb-8 font-light">
          Your team is successfully registered for {eventTitle}. Briefing documents have been sent.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setFormData({ 
              college: "", 
              teamSize: teamOptions[0].toString(), 
              members: Array(teamOptions[0]).fill({ name: "", email: "", phone: "" }) 
            });
          }}
          className="border border-white/20 text-white px-8 py-3 rounded-full hover:bg-white/5 transition-colors duration-300 cursor-pointer"
        >
          Register Another Team
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 max-w-2xl mx-auto shadow-2xl"
    >
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Secure Your Spot</h3>
        <p className="text-white/50 text-sm">
          Complete the form below to finalize your registration. All fields are required.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-8 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">Team Size</label>
            {teamOptions.length === 1 ? (
              <div className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white/60">
                {teamOptions[0] === 1 ? "1 (Solo)" : `${teamOptions[0]} Members`}
              </div>
            ) : (
              <select
                name="teamSize"
                value={formData.teamSize}
                onChange={handleTeamSizeChange}
                className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-hidden focus:border-white/40 cursor-pointer appearance-none"
              >
                {teamOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-black text-white">
                    {opt === 1 ? "1 (Solo)" : `${opt} Members`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">College/University</label>
            <input
              required
              name="college"
              value={formData.college}
              onChange={handleGeneralChange}
              type="text"
              placeholder="SpaceX Academy"
              className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {formData.members.map((member, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
                className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] mr-2 text-white/70">
                    {index + 1}
                  </span>
                  {index === 0 ? "Team Leader Details" : `Member ${index + 1} Details`}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">Full Name</label>
                    <input
                      required
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                      type="text"
                      placeholder="Commander Shepard"
                      className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">Email Address</label>
                    <input
                      required
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                      type="email"
                      placeholder="shepard@normandy.com"
                      className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col space-y-2 md:col-span-2">
                    <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">Phone Number</label>
                    <input
                      required
                      value={member.phone}
                      onChange={(e) => handleMemberChange(index, "phone", e.target.value)}
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>Confirm Registration</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
