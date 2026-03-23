import { Metadata } from "next";
import CompetitionsPage from "@/components/competitions-page";

export const metadata: Metadata = {
  title: "Competitions | Neutron Spaceport",
  description: "Start your online journey at Spaceport Academy.",
};

export default function CompetiPage() {
  return <CompetitionsPage />;
}
