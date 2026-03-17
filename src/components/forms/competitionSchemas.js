import { z } from "zod";

export const EVENT_TYPES = ["COMPETITION", "WORKSHOP", "EVENT"];
export const COMPETITION_TYPES = ["SOLO", "TEAM"];
export const STATUS_OPTS = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "ARCHIVED",
  "CANCELLED",
  "POSTPONED",
];

// Fields validated per step (indices map to STEP_LABELS in modal)
export const STEP_FIELDS = [
  ["title", "shortDescription", "category", "eventType", "type", "status"],
  [
    "startTime",
    "endTime",
    "registrationDeadline",
    "venueName",
    "venueRoom",
    "venueFloor",
    "subVenues",
  ],
  ["rulesRichText"],
  [
    "registrationFee",
    "maxRegistrations",
    "minTeamSize",
    "maxTeamSize",
    "registrationsOpen",
    "requiresApproval",
    "autoApproveTeams",
    "attendanceRequired",
    "isPaid",
    "perPerson",
    "prizePool",
    "promoCodes",
  ],
  [], // poster validated separately in the step component
];

const optCoercedInt = z
  .union([z.literal(""), z.string(), z.number()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    return isNaN(n) ? undefined : n;
  })
  .optional();

export const competitionSchema = z.object({
  // ── Step 1: Basic Info
  title: z.string().min(1, "Title is required"),
  shortDescription: z.string().optional(),
  category: z.string().optional(),
  eventType: z.enum(["COMPETITION", "WORKSHOP", "EVENT"]),
  type: z.enum(["SOLO", "TEAM"]),
  status: z.enum([
    "DRAFT",
    "OPEN",
    "CLOSED",
    "ARCHIVED",
    "CANCELLED",
    "POSTPONED",
  ]),

  // ── Step 2: Schedule & Venue
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  registrationDeadline: z.string().optional(),
  venueName: z.string().optional(),
  venueRoom: z.string().optional(),
  venueFloor: z.string().optional(),
  subVenues: z
    .array(
      z.object({
        name: z.string().min(1, "Sub venue name is required"),
        room: z.string().optional(),
        floor: z.string().optional(),
        capacity: z
          .union([z.literal(""), z.string(), z.number()])
          .transform((v) => {
            if (v === "" || v === null || v === undefined) return undefined;
            const n = typeof v === "number" ? v : parseInt(String(v), 10);
            return Number.isNaN(n) ? undefined : n;
          })
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .optional(),

  // ── Step 3: Rules
  rulesRichText: z.string().optional(),

  // ── Step 4: Registration Config
  registrationFee: z
    .union([z.literal(""), z.string(), z.number()])
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return 0;
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      return isNaN(n) ? 0 : n;
    }),
  maxRegistrations: optCoercedInt,
  minTeamSize: optCoercedInt,
  maxTeamSize: optCoercedInt,
  registrationsOpen: z.boolean(),
  requiresApproval: z.boolean(),
  autoApproveTeams: z.boolean(),
  attendanceRequired: z.boolean(),
  isPaid: z.boolean(),
  perPerson: z.boolean(),

  // ── Prize Pool (flexible array of ranked/named prizes)
  // Each entry: { rank: string, label: string, cash: number|null, inkind: string[] }
  prizePool: z
    .array(
      z.object({
        rank: z.string().optional(),
        label: z.string().min(1, "Prize label is required"),
        cash: z
          .union([z.number(), z.string(), z.literal(""), z.null()])
          .transform((v) => {
            if (v === "" || v === null || v === undefined) return undefined;
            const n = typeof v === "number" ? v : Number(v);
            return Number.isNaN(n) ? undefined : n;
          })
          .optional(),
        inkind: z.string().optional(),
      }),
    )
    .optional(),

  promoCodes: z
    .array(
      z.object({
        code: z.string().min(1, "Promo code is required"),
        discountType: z.enum(["PERCENT", "FLAT"]),
        discountValue: z
          .union([z.number(), z.string(), z.literal("")])
          .transform((v) => {
            if (v === "" || v === undefined || v === null) return undefined;
            const n = typeof v === "number" ? v : Number(v);
            return Number.isNaN(n) ? undefined : n;
          }),
        maxUses: z
          .union([z.literal(""), z.string(), z.number()])
          .transform((v) => {
            if (v === "" || v === null || v === undefined) return undefined;
            const n = typeof v === "number" ? v : parseInt(String(v), 10);
            return Number.isNaN(n) ? undefined : n;
          })
          .optional(),
        isActive: z.boolean(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export const DEFAULT_VALUES = {
  title: "",
  shortDescription: "",
  category: "",
  eventType: "COMPETITION",
  type: "SOLO",
  status: "DRAFT",
  startTime: "",
  endTime: "",
  registrationDeadline: "",
  venueName: "",
  venueRoom: "",
  venueFloor: "",
  subVenues: [],
  rulesRichText: "",
  registrationFee: 0,
  maxRegistrations: "",
  minTeamSize: "",
  maxTeamSize: "",
  registrationsOpen: true,
  requiresApproval: true,
  autoApproveTeams: false,
  attendanceRequired: false,
  isPaid: false,
  perPerson: false,
  prizePool: [],
  promoCodes: [],
};

/** Build default values pre-filled from an existing competition object */
export function getEditDefaults(c) {
  const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");
  return {
    title: c.title ?? "",
    shortDescription: c.shortDescription ?? "",
    category: c.category ?? "",
    eventType: c.eventType ?? "COMPETITION",
    type: c.type ?? "SOLO",
    status: c.status ?? "DRAFT",
    startTime: fmt(c.startTime),
    endTime: fmt(c.endTime),
    registrationDeadline: fmt(c.registrationDeadline),
    venueName: c.venueName ?? "",
    venueRoom: c.venueRoom ?? "",
    venueFloor: c.venueFloor ?? "",
    subVenues: Array.isArray(c.subVenues)
      ? c.subVenues.map((v) => ({
          name: v.name ?? "",
          room: v.room ?? "",
          floor: v.floor ?? "",
          capacity: v.capacity ?? "",
          notes: v.notes ?? "",
        }))
      : [],
    rulesRichText: c.rulesRichText ?? "",
    registrationFee: c.registrationFee ?? 0,
    maxRegistrations: c.maxRegistrations ?? "",
    minTeamSize: c.minTeamSize ?? "",
    maxTeamSize: c.maxTeamSize ?? "",
    registrationsOpen: c.registrationsOpen ?? true,
    requiresApproval: c.requiresApproval ?? true,
    autoApproveTeams: c.autoApproveTeams ?? false,
    attendanceRequired: c.attendanceRequired ?? false,
    isPaid: c.isPaid ?? false,
    perPerson: c.perPerson ?? false,
    prizePool: Array.isArray(c.prizePool)
      ? c.prizePool.map((p) => ({
          rank: p.rank ?? "",
          label: p.label ?? "",
          cash: p.cash ?? "",
          inkind: Array.isArray(p.inkind)
            ? p.inkind.join(", ")
            : (p.inkind ?? ""),
        }))
      : [],
    promoCodes: Array.isArray(c.promoCodes)
      ? c.promoCodes.map((pc) => ({
          code: pc.code ?? "",
          discountType: pc.discountType ?? "PERCENT",
          discountValue: pc.discountValue ?? "",
          maxUses: pc.maxUses ?? "",
          isActive: pc.isActive ?? true,
          description: pc.description ?? "",
        }))
      : [],
  };
}
