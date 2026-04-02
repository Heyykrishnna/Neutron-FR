import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import LoaderWrapper from "@/components/LoaderWrapper";

import Noise from "@/components/Noise";
import SmoothScroll from "@/components/smooth-scroll";
import { AppProviders } from "@/src/providers/AppProviders";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const arcSpace = localFont({
  src: "./fonts/arc-space-font (1)/arc-space.ttf",
  variable: "--font-arc-space",
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
    <html
      lang="en"
      className={cn(
        "antialiased",
        spaceGrotesk.variable,
        arcSpace.variable,
      )}
    >
      <body
        className={`${spaceGrotesk.className} bg-[#0d0a08] text-white selection:bg-orange-500/30 overflow-x-hidden`}
      >
        <AppProviders>
          <Noise
            patternAlpha={10}
            className="fixed inset-0 z-100 pointer-events-none opacity-40"
          />
          <LoaderWrapper>
            <SmoothScroll>
              <div className="relative z-1">{children}</div>
            </SmoothScroll>
          </LoaderWrapper>
        </AppProviders>
      </body>
    </html>
  );
}
