"use client";

import AboutHero from "@/components/AboutHero";
import AboutStory from "@/components/AboutStory";
import AboutImpact from "@/components/AboutImpact";
import AboutGallery from "@/components/AboutGallery";
import AboutTeam from "@/components/AboutTeam";
import AboutFooter from "@/components/AboutFooter";

export default function AboutPage() {
  return (
    <main className="relative text-white min-h-screen">
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "brightness(0.3) contrast(1.1)",
        }}
      />
      
      <AboutHero />
      <AboutStory />
      <AboutImpact />
      <AboutGallery />
      <AboutTeam />
      <AboutFooter />
    </main>
  );
}
