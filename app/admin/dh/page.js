"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DHPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dh/registrations");
  }, [router]);

  return null;
}
