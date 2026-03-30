import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PlanetDestination from "@/components/planet-destination";
import { PLANET_RECORD_BY_SLUG, PLANET_RECORDS } from "@/lib/planet-data";

export function generateStaticParams() {
  return PLANET_RECORDS.map((planet) => ({
    slug: planet.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const planet = PLANET_RECORD_BY_SLUG[slug];

  if (!planet) {
    return {
      title: "Planet Not Found",
    };
  }

  return {
    title: `${planet.name} | Neutron Flight Deck`,
    description: planet.summary,
  };
}

export default async function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const planet = PLANET_RECORD_BY_SLUG[slug];

  if (!planet) {
    notFound();
  }

  return <PlanetDestination planet={planet} />;
}
