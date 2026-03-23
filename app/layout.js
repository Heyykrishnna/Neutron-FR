import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/src/providers/AppProviders";
import PublicHeaderGate from "@/src/components/navigation/PublicHeaderGate";
import NeutronBanner from "@/src/components/NeutronBanner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Neutron 3.0",
  description: "Event Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NeutronBanner />
        <AppProviders>
          <PublicHeaderGate>{children}</PublicHeaderGate>
        </AppProviders>
      </body>
    </html>
  );
}
