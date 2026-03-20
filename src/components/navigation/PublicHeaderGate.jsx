"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import PublicHeader from "@/src/components/navigation/PublicHeader";

const PUBLIC_HEADER_PREFIXES = ["/competitions", "/users", "/team-invite"];

function shouldShowHeader(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname === "/") return true;

  return PUBLIC_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function PublicHeaderGate({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showHeader = useMemo(() => shouldShowHeader(pathname), [pathname]);

  return (
    <>
      {mounted && showHeader ? <PublicHeader /> : null}
      {children}
    </>
  );
}
