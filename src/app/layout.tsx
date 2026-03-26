import type { Metadata } from "next";
import { Sora, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LoaderWrapper from "@/components/LoaderWrapper";

import Noise from "@/components/Noise";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({
  subsets: ["latin"], 
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Neutron",
  description: "Neutron.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", sora.variable, "font-sans", geist.variable)}>
      <body className={`${sora.className} bg-[#0d0a08] text-white selection:bg-orange-500/30 overflow-x-hidden`}>
        <Noise patternAlpha={10} className="fixed inset-0 z-100 pointer-events-none opacity-40" />
        <LoaderWrapper>
          <div className="relative z-1">
            {children}
          </div>
        </LoaderWrapper>
      </body>
    </html>
  );
}

