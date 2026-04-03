import { z } from "zod";
import {
  toDateTimeLocalInput,
  toIsoFromDateTimeLocal,
} from "@/src/lib/datetime";

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
    "unstopLink",
    "maxRegistrations",
    "maxTeamsPerCollege",
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
  [],
];

const trimOrUndefined = (value: any) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const trimOrEmptyString = (value: any) => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return String(value);
  return value.trim();
};

const toIntegerOrUndefined = (value: any) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const toMoneyOrZero = (value: any) => {
  if (value === "" || value === undefined || value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
};

const toMoneyOrUndefined = (value: any) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const toDateTimeStringOrUndefined = (value: any) => {
  const trimmed = trimOrUndefined(value);
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return trimmed;
};

const subVenueSchema = z.object({
  name: z.preprocess(
    trimOrEmptyString,
    z.string().min(1, "Sub venue name is required"),
  ),
  room: z.preprocess(trimOrUndefined, z.string().optional()),
  floor: z.preprocess(trimOrUndefined, z.string().optional()),
  capacity: z.preprocess(
    toIntegerOrUndefined,
    z.number().int().positive().optional(),
  ),
  notes: z.preprocess(trimOrUndefined, z.string().optional()),
});

const prizeSchema = z
  .object({
    rank: z.preprocess(trimOrUndefined, z.string().optional()),
    label: z.preprocess(
      trimOrEmptyString,
      z.string().min(1, "Prize label is required"),
    ),
    cash: z.preprocess(
      toMoneyOrUndefined,
      z.number().min(0, "Cash prize cannot be negative").optional(),
    ),
    inkind: z.preprocess(trimOrUndefined, z.string().optional()),
  })
  .superRefine((value, ctx) => {
    const hasCash = value.cash !== undefined && value.cash !== null;
    const hasInKind = Boolean(value.inkind && value.inkind.trim());

    if (!hasCash && !hasInKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cash"],
        message: "Provide either cash prize or in-kind prize",
      });
    }
  });

const promoCodeSchema = z
  .object({
    code: z.preprocess(
      (value) => {
        const normalized = trimOrUndefined(value);
        return normalized ? normalized.toUpperCase() : normalized;
      },
      z
        .string()
        .min(3, "Promo code must be at least 3 characters")
        .max(32, "Promo code must be at most 32 characters")
        .regex(/^[A-Z0-9_-]+$/, "Use only A-Z, 0-9, _ and -"),
    ),
    discountType: z.enum(["PERCENT", "FLAT"]),
    discountValue: z.preprocess(
      toMoneyOrUndefined,
      z.number().positive("Discount value must be greater than zero"),
    ),
    maxUses: z.preprocess(
      toIntegerOrUndefined,
      z.number().int().positive().optional(),
    ),
    isActive: z.boolean(),
    description: z.preprocess(trimOrUndefined, z.string().optional()),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENT" && value.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percent discount cannot exceed 100",
      });
    }
  });

export const competitionSchema = z
  .object({
    title: z.preprocess(
      trimOrEmptyString,
      z.string().min(3, "Title must be at least 3 characters"),
    ),
    shortDescription: z.preprocess(
      trimOrUndefined,
      z.string().max(500, "Short description is too long").optional(),
    ),
    category: z.preprocess(
      trimOrUndefined,
      z.string().max(120, "Category is too long").optional(),
    ),
    eventType: z.enum(EVENT_TYPES),
    type: z.enum(COMPETITION_TYPES),
    status: z.enum(STATUS_OPTS),

    startTime: z.preprocess(toDateTimeStringOrUndefined, z.string().optional()),
    endTime: z.preprocess(toDateTimeStringOrUndefined, z.string().optional()),
    registrationDeadline: z.preprocess(
      toDateTimeStringOrUndefined,
      z.string().optional(),
    ),

    venueName: z.preprocess(
      trimOrUndefined,
      z.string().max(160, "Venue name is too long").optional(),
    ),
    venueRoom: z.preprocess(
      trimOrUndefined,
      z.string().max(80, "Room is too long").optional(),
    ),
    venueFloor: z.preprocess(
      trimOrUndefined,
      z.string().max(80, "Floor is too long").optional(),
    ),
    subVenues: z.array(subVenueSchema).optional(),

    rulesRichText: z.preprocess(
      trimOrUndefined,
      z.string().max(20000, "Rules content is too large").optional(),
    ),

    registrationFee: z.preprocess(
      toMoneyOrZero,
      z.number().min(0, "Registration fee cannot be negative"),
    ),
    unstopLink: z.preprocess(
      trimOrUndefined,
      z.string().max(500, "Unstop link is too long").optional(),
    ),
    maxRegistrations: z.preprocess(
      toIntegerOrUndefined,
      z.number().int().positive().optional(),
    ),
    maxTeamsPerCollege: z.preprocess(
      toIntegerOrUndefined,
      z.number().int().positive().optional(),
    ),
    minTeamSize: z.preprocess(
      toIntegerOrUndefined,
      z.number().int().positive().optional(),
    ),
    maxTeamSize: z.preprocess(
      toIntegerOrUndefined,
      z.number().int().positive().optional(),
    ),

    registrationsOpen: z.boolean(),
    requiresApproval: z.boolean(),
    autoApproveTeams: z.boolean(),
    attendanceRequired: z.boolean(),
    isPaid: z.boolean(),
    perPerson: z.boolean(),

    prizePool: z.array(prizeSchema).optional(),
    promoCodes: z.array(promoCodeSchema).optional(),
  })
  .superRefine((value, ctx) => {
    const now = new Date();
    const startDate = value.startTime ? new Date(value.startTime) : null;
    const endDate = value.endTime ? new Date(value.endTime) : null;
    const deadlineDate = value.registrationDeadline
      ? new Date(value.registrationDeadline)
      : null;

    if (!value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Start time is required",
      });
    }

    if (!value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time is required",
      });
    }

    if (!value.registrationDeadline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationDeadline"],
        message: "Registration deadline is required",
      });
    }

    if ((value.prizePool?.length || 0) === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prizePool"],
        message: "Add at least one prize",
      });
    }

    if (
      (value.startTime && !value.endTime) ||
      (!value.startTime && value.endTime)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Provide both start and end time together",
      });
    }

    if (startDate && endDate && endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }

    if (startDate && startDate <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Start time must be in the future",
      });
    }

    if (endDate && endDate <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be in the future",
      });
    }

    if (deadlineDate && deadlineDate <= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationDeadline"],
        message: "Registration deadline must be in the future",
      });
    }

    if (deadlineDate && startDate && deadlineDate >= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["registrationDeadline"],
        message: "Registration deadline must be before start time",
      });
    }

    if (value.type === "TEAM") {
      if (!value.minTeamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minTeamSize"],
          message: "Min team size is required for team competitions",
        });
      }

      if (!value.maxTeamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxTeamSize"],
          message: "Max team size is required for team competitions",
        });
      }

      if (
        value.minTeamSize &&
        value.maxTeamSize &&
        value.maxTeamSize < value.minTeamSize
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxTeamSize"],
          message:
            "Max team size must be greater than or equal to min team size",
        });
      }
    }

    if (value.type === "SOLO") {
      if (value.minTeamSize || value.maxTeamSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minTeamSize"],
          message: "Team size fields are not applicable for solo competitions",
        });
      }

      if (value.perPerson) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["perPerson"],
          message: "Per person fee is only applicable for team competitions",
        });
      }
    }

    if (!value.isPaid && value.registrationFee > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isPaid"],
        message: "Set event as paid when registration fee is greater than zero",
      });
    }

    if (!value.isPaid && value.perPerson) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["perPerson"],
        message: "Per person fee requires a paid event",
      });
    }

    if (value.requiresApproval === value.autoApproveTeams) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requiresApproval"],
        message:
          "Requires Approval and Auto-Approve Teams cannot be in the same state",
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoApproveTeams"],
        message: "Auto-Approve Teams must be opposite of Requires Approval",
      });
    }

    if (!value.isPaid && (value.promoCodes?.length || 0) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoCodes"],
        message: "Promo codes are only allowed for paid events",
      });
    }

    if (value.registrationFee <= 0 && (value.promoCodes?.length || 0) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["promoCodes"],
        message: "Promo codes require registration fee greater than zero",
      });
    }

    (value.promoCodes || []).forEach((promoCode, index) => {
      if (
        promoCode.discountType === "FLAT" &&
        promoCode.discountValue > value.registrationFee
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["promoCodes", index, "discountValue"],
          message: "Flat discount cannot exceed registration fee",
        });
      }
    });

    if (value.status === "OPEN" && (!value.startTime || !value.endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Start and end time are required before opening competition",
      });
    }
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
  unstopLink: "",
  maxRegistrations: "",
  maxTeamsPerCollege: "",
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

const toDateTimeLocal = (value: any) => toDateTimeLocalInput(value);

export function getEditDefaults(competition: any = {}) {
  return {
    title: competition.title ?? "",
    shortDescription: competition.shortDescription ?? "",
    category: competition.category ?? "",
    eventType: competition.eventType ?? "COMPETITION",
    type: competition.type ?? "SOLO",
    status: competition.status ?? "DRAFT",
    startTime: toDateTimeLocal(competition.startTime),
    endTime: toDateTimeLocal(competition.endTime),
    registrationDeadline: toDateTimeLocal(competition.registrationDeadline),
    venueName: competition.venueName ?? "",
    venueRoom: competition.venueRoom ?? "",
    venueFloor: competition.venueFloor ?? "",
    subVenues: Array.isArray(competition.subVenues)
      ? competition.subVenues.map((venue: any) => ({
          name: venue?.name ?? "",
          room: venue?.room ?? "",
          floor: venue?.floor ?? "",
          capacity: venue?.capacity ?? "",
          notes: venue?.notes ?? "",
        }))
      : [],
    rulesRichText: competition.rulesRichText ?? "",
    registrationFee: competition.registrationFee ?? 0,
    unstopLink: competition.unstopLink ?? "",
    maxRegistrations: competition.maxRegistrations ?? "",
    maxTeamsPerCollege: competition.maxTeamsPerCollege ?? "",
    minTeamSize: competition.minTeamSize ?? "",
    maxTeamSize: competition.maxTeamSize ?? "",
    registrationsOpen: competition.registrationsOpen ?? true,
    requiresApproval: competition.requiresApproval ?? true,
    autoApproveTeams: competition.autoApproveTeams ?? false,
    attendanceRequired: competition.attendanceRequired ?? false,
    isPaid: competition.isPaid ?? false,
    perPerson: competition.perPerson ?? false,
    prizePool: Array.isArray(competition.prizePool)
      ? competition.prizePool.map((prize: any) => ({
          rank: prize?.rank ?? "",
          label: prize?.label ?? "",
          cash: prize?.cash ?? "",
          inkind: Array.isArray(prize?.inkind)
            ? prize.inkind.join(", ")
            : (prize?.inkind ?? ""),
        }))
      : [],
    promoCodes: Array.isArray(competition.promoCodes)
      ? competition.promoCodes.map((promoCode: any) => ({
          code: promoCode?.code ?? "",
          discountType: promoCode?.discountType ?? "PERCENT",
          discountValue: promoCode?.discountValue ?? "",
          maxUses: promoCode?.maxUses ?? "",
          isActive: promoCode?.isActive ?? true,
          description: promoCode?.description ?? "",
        }))
      : [],
  };
}

const toDateTimePayloadOrNull = (value: any) => toIsoFromDateTimeLocal(value);

const normalizePrizePool = (prizePool = []) => {
  return prizePool
    .map((item: any) => {
      const rank = trimOrUndefined(item?.rank);
      const label = trimOrUndefined(item?.label);
      const cash = toMoneyOrUndefined(item?.cash);
      const inKindRaw = trimOrUndefined(item?.inkind);

      const inkind = inKindRaw
        ? inKindRaw
            .split(",")
            .map((value: any) => value.trim())
            .filter(Boolean)
        : undefined;

      if (!label) return null;

      return {
        ...(rank ? { rank } : {}),
        label,
        ...(cash !== undefined ? { cash } : {}),
        ...(inkind?.length ? { inkind } : {}),
      };
    })
    .filter(Boolean);
};

const normalizePromoCodes = (promoCodes = []) => {
  return promoCodes
    .map((item: any) => {
      const code = trimOrUndefined(item?.code)?.toUpperCase();
      const discountType = item?.discountType || "PERCENT";
      const discountValue = toMoneyOrUndefined(item?.discountValue);
      const maxUses = toIntegerOrUndefined(item?.maxUses);
      const description = trimOrUndefined(item?.description);
      const isActive = item?.isActive ?? true;

      if (!code || discountValue === undefined) return null;

      return {
        code,
        discountType,
        discountValue,
        ...(maxUses !== undefined ? { maxUses } : {}),
        isActive,
        ...(description ? { description } : {}),
      };
    })
    .filter(Boolean);
};

const normalizeSubVenues = (subVenues = []) => {
  return subVenues
    .map((item: any) => {
      const name = trimOrUndefined(item?.name);
      if (!name) return null;

      const room = trimOrUndefined(item?.room);
      const floor = trimOrUndefined(item?.floor);
      const notes = trimOrUndefined(item?.notes);
      const capacity = toIntegerOrUndefined(item?.capacity);

      return {
        name,
        ...(room ? { room } : {}),
        ...(floor ? { floor } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(notes ? { notes } : {}),
      };
    })
    .filter(Boolean);
};

export function validateVenueScopeOnClient(values: any, venueCatalog: any) {
  if (!venueCatalog || !Array.isArray(venueCatalog?.venues)) {
    return [];
  }

  const normalize = (value: any) => {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  };

  const venueName = normalize(values?.venueName);
  const venueRoom = normalize(values?.venueRoom);
  const venueFloor = normalize(values?.venueFloor);
  const subVenues = Array.isArray(values?.subVenues) ? values.subVenues : [];

  const venueMap = new Map(
    venueCatalog.venues
      .filter((venue: any) => normalize(venue?.venueName))
      .map((venue: any) => [
        normalize(venue.venueName),
        {
          ...venue,
          subVenueMap: new Map(
            (Array.isArray(venue?.subVenues) ? venue.subVenues : [])
              .filter((subVenue: any) => normalize(subVenue?.name))
              .map((subVenue: any) => [normalize(subVenue.name), subVenue]),
          ),
        },
      ]),
  );

  const errors: Array<{ field: string; message: string }> = [];

  if (!venueName) {
    if (venueRoom || venueFloor || subVenues.length > 0) {
      errors.push({
        field: "venueName",
        message: "Select a venue before choosing room, floor, or sub venues.",
      });
    }
    return errors;
  }

  const selectedVenue = venueMap.get(venueName);
  if (!selectedVenue) {
    errors.push({
      field: "venueName",
      message: "Selected venue is not in the allowed venue catalog.",
    });
    return errors;
  }

  if (venueRoom && !selectedVenue.subVenueMap.has(venueRoom)) {
    errors.push({
      field: "venueRoom",
      message: "Room must belong to the selected venue.",
    });
  }

  const floorSet = new Set(
    (Array.isArray(selectedVenue?.subVenues) ? selectedVenue.subVenues : [])
      .map((subVenue: any) => normalize(subVenue?.floor))
      .filter(Boolean),
  );

  if (venueFloor) {
    if (venueRoom) {
      const roomMeta = selectedVenue.subVenueMap.get(venueRoom);
      const allowedFloor = normalize(roomMeta?.floor);
      if (allowedFloor && allowedFloor !== venueFloor) {
        errors.push({
          field: "venueFloor",
          message: "Floor does not match the selected room.",
        });
      }
    } else if (floorSet.size > 0 && !floorSet.has(venueFloor)) {
      errors.push({
        field: "venueFloor",
        message: "Floor must belong to the selected venue.",
      });
    }
  }

  subVenues.forEach((subVenue: any, index: number) => {
    const subVenueName = normalize(subVenue?.name);
    if (!subVenueName) return;

    const subVenueMeta = selectedVenue.subVenueMap.get(subVenueName);
    if (!subVenueMeta) {
      errors.push({
        field: "subVenues",
        message: `Sub venue #${index + 1} is not valid for ${venueName}.`,
      });
      return;
    }

    const selectedSubVenueFloor = normalize(subVenue?.floor);
    const allowedSubVenueFloor = normalize(subVenueMeta?.floor);

    if (
      selectedSubVenueFloor &&
      allowedSubVenueFloor &&
      selectedSubVenueFloor !== allowedSubVenueFloor
    ) {
      errors.push({
        field: "subVenues",
        message: `Sub venue #${index + 1} floor does not match the selected sub venue.`,
      });
    }
  });

  return errors;
}

export function buildCompetitionPayloadFormData(
  values: any,
  poster: any,
  banner: any,
) {
  const formData = new FormData();

  const append = (key: any, value: any) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  };

  append("title", values.title);
  append("shortDescription", trimOrUndefined(values.shortDescription));
  append("category", trimOrUndefined(values.category));
  append("eventType", values.eventType);
  append("type", values.type);
  append("status", values.status);

  const startTimeIso = toDateTimePayloadOrNull(values.startTime);
  const endTimeIso = toDateTimePayloadOrNull(values.endTime);
  const registrationDeadlineIso = toDateTimePayloadOrNull(
    values.registrationDeadline,
  );

  if (startTimeIso) formData.append("startTime", startTimeIso);
  if (endTimeIso) formData.append("endTime", endTimeIso);
  if (registrationDeadlineIso)
    formData.append("registrationDeadline", registrationDeadlineIso);

  append("venueName", trimOrUndefined(values.venueName));
  append("venueRoom", trimOrUndefined(values.venueRoom));
  append("venueFloor", trimOrUndefined(values.venueFloor));

  const subVenues = normalizeSubVenues(values.subVenues || []);
  if (subVenues.length) {
    formData.append("subVenues", JSON.stringify(subVenues));
  }

  append("rulesRichText", trimOrUndefined(values.rulesRichText));

  const registrationFee = toMoneyOrZero(values.registrationFee);
  formData.append("registrationFee", String(registrationFee));
  append("unstopLink", trimOrUndefined(values.unstopLink));

  const maxRegistrations = toIntegerOrUndefined(values.maxRegistrations);
  if (maxRegistrations !== undefined) {
    formData.append("maxRegistrations", String(maxRegistrations));
  }

  const maxTeamsPerCollege = toIntegerOrUndefined(values.maxTeamsPerCollege);
  if (maxTeamsPerCollege !== undefined) {
    formData.append("maxTeamsPerCollege", String(maxTeamsPerCollege));
  }

  const minTeamSize = toIntegerOrUndefined(values.minTeamSize);
  if (minTeamSize !== undefined) {
    formData.append("minTeamSize", String(minTeamSize));
  }

  const maxTeamSize = toIntegerOrUndefined(values.maxTeamSize);
  if (maxTeamSize !== undefined) {
    formData.append("maxTeamSize", String(maxTeamSize));
  }

  formData.append(
    "registrationsOpen",
    String(Boolean(values.registrationsOpen)),
  );
  formData.append("requiresApproval", String(Boolean(values.requiresApproval)));
  formData.append("autoApproveTeams", String(Boolean(values.autoApproveTeams)));
  formData.append(
    "attendanceRequired",
    String(Boolean(values.attendanceRequired)),
  );
  formData.append("isPaid", String(Boolean(values.isPaid)));
  formData.append("perPerson", String(Boolean(values.perPerson)));

  const prizePool = normalizePrizePool(values.prizePool || []);
  if (prizePool.length) {
    formData.append("prizePool", JSON.stringify(prizePool));
  }

  const promoCodes = normalizePromoCodes(values.promoCodes || []);
  if (promoCodes.length) {
    formData.append("promoCodes", JSON.stringify(promoCodes));
  }

  if (poster) {
    formData.append("poster", poster);
  }

  if (banner) {
    formData.append("banner", banner);
  }

  return formData;
}
