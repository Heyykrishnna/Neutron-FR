export type PlanetRecord = {
  slug: string;
  name: string;
  accent: string;
  size: number;
  kind: "glb" | "obj";
  model: string;
  texture?: string;
  rotationOffset?: number;
  eyebrow: string;
  headline: string;
  summary: string;
  stats: Array<{ label: string; value: string }>;
};

export const PLANET_RECORDS: PlanetRecord[] = [
  {
    slug: "mars",
    name: "About Us",
    accent: "#e48eff",
    size: 2,
    kind: "glb",
    model: "/3D/planets/purple_planet.glb",
    rotationOffset: Math.PI * 0.22,
    eyebrow: "Red frontier",
    headline: "A harsher orbit, cut for propulsion tests and long-range landings.",
    summary:
      "Mars is presented as the first aggressive route in the sequence: fast entry, strong contrast, and a sharper atmospheric palette.",
    stats: [
      { label: "Route", value: "Ares-07" },
      { label: "Velocity", value: "18.4 km/s" },
      { label: "Window", value: "142 days" },
    ],
  },
  {
    slug: "jupiter",
    name: "Competitions",
    accent: "#f5c37d",
    size: 2.7,
    kind: "glb",
    model: "/3D/planets/planet_earth.glb",
    rotationOffset: Math.PI * -0.3,
    eyebrow: "Storm system",
    headline: "A heavy outer lane built for wide turns, slow drift, and dense atmospheres.",
    summary:
      "Jupiter anchors the wider field. The page shifts into a deeper camera arc here so the route feels massive instead of decorative.",
    stats: [
      { label: "Route", value: "Zephyr-19" },
      { label: "Velocity", value: "11.8 km/s" },
      { label: "Window", value: "311 days" },
    ],
  },
  {
    slug: "venus",
    name: "Events",
    accent: "#ffd56e",
    size: 2,
    kind: "obj",
    model: "/3D/planets/venus/source/jupiter.obj",
    texture: "/3D/planets/venus/textures/venmap.jpg",
    eyebrow: "Golden haze",
    headline: "A hotter corridor with a warmer visual signature and tighter orbital passes.",
    summary:
      "Venus brings a denser, warmer tone into the system so the sequence never collapses into one cold blue scene.",
    stats: [
      { label: "Route", value: "Helios-04" },
      { label: "Velocity", value: "13.2 km/s" },
      { label: "Window", value: "96 days" },
    ],
  },
  // {
  //   slug: "pluto",
  //   name: "Our Sponsors",
  //   accent: "#9fd5ff",
  //   size: 2.1,
  //   kind: "glb",
  //   model: "/3D/planets/planet_earth.glb",
  //   texture: "/3D/planets/pluto/textures/pluto.jpeg",
  //   eyebrow: "Outer drift",
  //   headline: "A colder transfer line where the motion opens up and the scene starts to breathe.",
  //   summary:
  //     "Pluto is deliberately lighter and farther in the composition so it feels like the route slips out of the crowded inner system.",
  //   stats: [
  //     { label: "Route", value: "Drift-32" },
  //     { label: "Velocity", value: "9.1 km/s" },
  //     { label: "Window", value: "402 days" },
  //   ],
  // },
  {
    slug: "moon",
    name: "Profile",
    accent: "#dfe7ff",
    size: 2,
    kind: "obj",
    model: "/3D/planets/moon/source/earth.obj",
    texture: "/3D/planets/moon/textures/2k_moon.jpeg",
    eyebrow: "Close pass",
    headline: "A near-field orbit with faster motion, tighter framing, and cleaner surface reads.",
    summary:
      "The Moon page is the closest and most familiar route, so the visual system tightens up and feels more immediate.",
    stats: [
      { label: "Route", value: "Luna-01" },
      { label: "Velocity", value: "7.8 km/s" },
      { label: "Window", value: "21 days" },
    ],
  },
];

export const PLANET_RECORD_BY_SLUG = Object.fromEntries(
  PLANET_RECORDS.map((planet) => [planet.slug, planet]),
) as Record<string, PlanetRecord>;
