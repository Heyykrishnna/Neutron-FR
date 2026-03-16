"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JudgePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/judge/competitions");
  }, [router]);
  return null;
}
