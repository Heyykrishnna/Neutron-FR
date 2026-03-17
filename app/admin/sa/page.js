"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SAPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/sa/users");
  }, [router]);

  return null;
}
