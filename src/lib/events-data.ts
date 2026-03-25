export type EventRecord = {
  slug: string;
  title: string;
  description: string;
  image: string;
  heightClass: string;
  delay: number;
  isPaid: boolean;
  price?: number;
  location: string;
  date: string;
  prizePool: string;
  about: string;
  teamSize: string;
  category: string;
  eventType: string;
  status: "open" | "closed" | "cancelled" | "postponed";
  rules: string[];
};

export const EVENTS_DATA: EventRecord[] = [
  {
    slug: "explorers-guide",
    title: "Explorer's Guide to Space",
    description: "Exploring the Solar System? How does life look like onboard the biggest spacecraft ever built? The of future space exploration: Where are we going next - Moon, Mars, asteroids and beyond.",
    image: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1600&q=80",
    heightClass: "h-[750px] md:h-[900px]",
    delay: 0.1,
    isPaid: true,
    price: 499,
    location: "Main Auditorium, Campus Hub",
    date: "April 15, 2026",
    prizePool: "₹50,000",
    about: "Embark on an interactive journey through the cosmos. This event will test your knowledge of space exploration history and future trajectories. Participants will analyze mission parameters for hypothetical crewed missions to Mars and asteroid mining operations. Prepare for deep-dive trivia and problem-solving scenarios based on real astrophysics. This is not just a test of knowledge, but a test of vision. We are looking for those who can see beyond the horizon and imagine the future of humanity among the stars. The challenges will be tough, but the rewards are infinite.",
    teamSize: "1-3 Members",
    category: "Astronomy & Research",
    eventType: "Hackathon / Quiz",
    status: "open",
    rules: [
      "Maximum of 3 members per team.",
      "All participants must carry a valid student ID.",
      "Laptops and research materials are permitted.",
      "Plagiarism will lead to immediate disqualification.",
      "The judge's decision is final and binding.",
      "Use of AI tools is permitted only for brainstorming, not for final solutions."
    ]
  },
  {
    slug: "orbital-mechanics-101",
    title: "Orbital Mechanics 101",
    description: "Master the physics of celestial rendezvous, planetary transfers, and complex docking procedures in a zero-G environment.",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
    heightClass: "h-[500px] md:h-[600px]",
    delay: 0.3,
    isPaid: false,
    location: "Mechanical Block Seminar Hall",
    date: "April 16, 2026",
    prizePool: "₹25,000",
    about: "A rigorous competition focusing on the mathematical and physical principles of spaceflight. From calculating Hohmann transfer orbits to executing precision docking simulations, this is the ultimate test for aspiring astrodynamicists. Use provided tools and data sets to optimize trajectories with minimal delta-v. The competition requires a deep understanding of physics, mathematics, and high-performance computation to solve real-world orbital problems. Only the most precise calculations will survive the gravity wells of distant worlds.",
    teamSize: "2 Members",
    category: "Physics & Engineering",
    eventType: "Simulation Challenge",
    status: "open",
    rules: [
      "Teams must consist of exactly 2 members.",
      "Scientific calculators are allowed.",
      "Simulation software will be provided on-site.",
      "Late entries will not be entertained.",
      "Solutions must be submitted in the specified format.",
      "Resource optimization is a key judging criterion."
    ]
  },
  {
    slug: "the-final-frontier",
    title: "The Final Frontier",
    description: "How do satellites stay in Space? What does it take to fly a spacecraft? 16 sunsets in a single day. Really? How? Space is closer than you think!",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
    heightClass: "h-[550px] md:h-[650px]",
    delay: 0.2,
    isPaid: true,
    price: 299,
    location: "Open Air Theatre",
    date: "April 17, 2026",
    prizePool: "₹35,000",
    about: "An immersive multi-stage hackathon where teams must design a complete satellite mission architecture. You will select orbital parameters, design payload constraints, and develop a long-term sustainability plan for a LEO constellation. Judged by industry experts from leading space agencies. This mission demands creativity, technical expertise, and a sharp focus on mission success in the harsh environment of orbit. Are you ready to lead the next generation of satellite designers into the final frontier?",
    teamSize: "3-4 Members",
    category: "Satellite Design",
    eventType: "Hackathon",
    status: "closed",
    rules: [
      "Minimum 3 and maximum 4 members per team.",
      "Prior knowledge of satellite subsystems is recommended.",
      "Teams must bring their own hardware if required for prototypes.",
      "Final presentations are limited to 10 minutes.",
      "Design documentation must be submitted 2 hours before the finale.",
      "Collaboration between teams is strictly prohibited."
    ]
  },
  {
    slug: "mission-phoenix",
    title: "Mission: Phoenix",
    description: "Join the elite crew traversing the martian surface. Manage resources, survey alien terrain, and establish the very first deep space outpost.",
    image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1600&q=80",
    heightClass: "h-[600px] md:h-[750px]",
    delay: 0.4,
    isPaid: true,
    price: 799,
    location: "Virtual / Computer Science Labs",
    date: "April 18, 2026",
    prizePool: "₹1,00,000",
    about: "The flagship event of Neutron. A 24-hour resource management and survival simulation set on Mars. Teams must balance power, oxygen, and water generation using custom software while dealing with random catastrophic events like dust storms and equipment failures. Keep the colony alive to win. This is the ultimate crucible for survivalists and engineers. The desert is unforgiving, and the atmosphere is thin. Only the most resourceful teams will plant the flag and thrive in the iron-rich dust of the Red Planet. Your mission starts now.",
    teamSize: "4 Members",
    category: "Survival Simulation",
    eventType: "24-Hour Challenge",
    status: "postponed",
    rules: [
      "Strictly 4 members per team.",
      "The competition lasts for 24 continuous hours.",
      "Sleeping arrangements will be provided in shifts.",
      "Stable internet connection is required for the virtual component.",
      "Real-time event handling is mandatory.",
      "Base failure results in immediate elimination."
    ]
  }
];

export const getEventBySlug = (slug: string) => {
  return EVENTS_DATA.find((event) => event.slug === slug);
};
