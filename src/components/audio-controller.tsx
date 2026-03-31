"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const playSciFiClick = () => {
  if (typeof window !== 'undefined' && (window as any).NeutronMuted) return;
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/science_fiction/sci_fi_beep.ogg");
    audio.volume = 0.2;
    audio.play().catch(() => {});
  } catch (e) {}
};

export default function AudioController() {
  const [isMuted, setIsMuted] = useState(true);
  const humRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (window as any).NeutronMuted = isMuted;
    if (!isMuted && humRef.current) {
      humRef.current.play().catch(() => {});
      humRef.current.volume = 0.05; 
    } else if (isMuted && humRef.current) {
      humRef.current.pause();
    }
  }, [isMuted]);

  return (
    <>
      <audio
        ref={humRef}
        src="https://actions.google.com/sounds/v1/science_fiction/space_room_hum.ogg"
        loop
        playsInline
      />
      <button
        onClick={() => {
          setIsMuted(!isMuted);
          if (isMuted) {
            setTimeout(playSciFiClick, 50);
          }
        }}
        className="fixed bottom-8 right-8 z-100 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] group cursor-pointer"
        aria-label="Toggle Sound"
      >
        {isMuted ? (
          <VolumeX size={20} className="group-hover:scale-110 transition-transform" />
        ) : (
          <Volume2 size={20} className="group-hover:scale-110 transition-transform" />
        )}
      </button>
    </>
  );
}
