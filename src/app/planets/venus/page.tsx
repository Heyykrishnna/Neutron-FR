import { Metadata } from "next";
import EventsPage from "@/components/events-page";

export const metadata: Metadata = {
  title: "Events | Neutron Spaceport",
  description: "Explore the cosmic events and journeys at Spaceport Academy.",
};

export default function EventsPlanetPage() {
  return <EventsPage />;
}
