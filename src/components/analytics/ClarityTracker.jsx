"use client";

import { useEffect, useRef } from "react";
import Clarity from "@microsoft/clarity";
import { useAuth } from "@/contexts/AuthContext";

export default function ClarityTracker() {
  const { user, loading } = useAuth();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId || hasInitializedRef.current) return;

    Clarity.init(projectId);
    hasInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (loading || !hasInitializedRef.current) return;

    if (!user?.id) {
      Clarity.setTag("auth_state", "anonymous");
      return;
    }

    const friendlyName = user.email || user.name || user.id;
    Clarity.identify(user.id, undefined, undefined, friendlyName);
    Clarity.setTag("auth_state", "authenticated");
    if (user.email) {
      Clarity.setTag("user_email", user.email);
    }
    if (user.role) {
      Clarity.setTag("user_role", user.role);
    }
  }, [loading, user]);

  return null;
}
