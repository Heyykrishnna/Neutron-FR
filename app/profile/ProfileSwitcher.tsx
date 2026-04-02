"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProfilePage from "@/src/components/profile-page";
import ProfileMobPage from "@/src/components/Profile-Mob";

export default function ProfileSwitcher() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || user) return;

    const query = searchParams.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(
      `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }, [loading, user, pathname, searchParams, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (loading || !user || isMobile === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return isMobile ? <ProfileMobPage /> : <ProfilePage />;
}
