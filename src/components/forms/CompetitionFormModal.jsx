"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, Box, Typography, CircularProgress } from "@mui/material";
import { Check, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { useSnackbar } from "notistack";

import {
  competitionSchema,
  DEFAULT_VALUES,
  getEditDefaults,
  STEP_FIELDS,
} from "./competitionSchemas";
import CompetitionBasicInfoStep from "./steps/CompetitionBasicInfoStep";
import CompetitionScheduleVenueStep from "./steps/CompetitionScheduleVenueStep";
import CompetitionRulesStep from "./steps/CompetitionRulesStep";
import CompetitionRegistrationConfigStep from "./steps/CompetitionRegistrationConfigStep";
import CompetitionPosterReviewStep from "./steps/CompetitionPosterReviewStep";
import {
  useCreateCompetition,
  useCompetition,
  useUpdateCompetition,
} from "@/src/hooks/api/useCompetitions";

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Basic Info",
  "Schedule & Venue",
  "Rules",
  "Registration",
  "Poster & Review",
];

// ── Primitives matching audit/approvals design ───────────────────────────────

const btnBase = {
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  fontWeight: 500,
  padding: "9px 20px",
  letterSpacing: "0.02em",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

function GhostBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.45)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "rgba(255,255,255,0.45)";
      }}
    >
      {children}
    </button>
  );
}

function PurpleBtn({ children, disabled, type = "button", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        background: disabled
          ? "rgba(168,85,247,0.25)"
          : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.4)",
        color: disabled ? "rgba(255,255,255,0.35)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(168,85,247,1)";
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          e.currentTarget.style.background = "rgba(168,85,247,0.85)";
      }}
    >
      {children}
    </button>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ activeStep }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 4,
        py: 2.5,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
      }}
    >
      {STEP_LABELS.map((label, i) => (
        <Box
          key={label}
          sx={{
            display: "flex",
            alignItems: "center",
            flex: i < STEP_LABELS.length - 1 ? "1 1 auto" : undefined,
          }}
        >
          {/* Circle */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  i < activeStep
                    ? "rgba(168,85,247,0.9)"
                    : i === activeStep
                      ? "rgba(168,85,247,0.15)"
                      : "rgba(255,255,255,0.05)",
                border:
                  i === activeStep
                    ? "2px solid rgba(168,85,247,0.8)"
                    : i < activeStep
                      ? "2px solid rgba(168,85,247,0.9)"
                      : "2px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              {i < activeStep ? (
                <Check size={13} color="#fff" />
              ) : (
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      i === activeStep ? "#c084fc" : "rgba(255,255,255,0.25)",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </Typography>
              )}
            </Box>
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: "0.06em",
                color:
                  i === activeStep
                    ? "rgba(255,255,255,0.8)"
                    : i < activeStep
                      ? "rgba(168,85,247,0.8)"
                      : "rgba(255,255,255,0.2)",
                fontFamily: "'Syne', sans-serif",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
              }}
            >
              {label}
            </Typography>
          </Box>

          {/* Connector line */}
          {i < STEP_LABELS.length - 1 && (
            <Box
              sx={{
                flex: 1,
                height: "1px",
                mx: 1,
                mb: 2.25,
                background:
                  i < activeStep
                    ? "rgba(168,85,247,0.5)"
                    : "rgba(255,255,255,0.06)",
                transition: "background 0.2s",
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

export default function CompetitionFormModal({ open, onClose, competition }) {
  const isEdit = !!competition;
  const [activeStep, setActiveStep] = useState(0);
  const [poster, setPoster] = useState(null);

  const { data: fetchedCompetition, isLoading: loadingCompetitionDetail } =
    useCompetition(open && competition?.id ? competition.id : null);

  const resolvedCompetition = useMemo(
    () => fetchedCompetition || competition || null,
    [fetchedCompetition, competition],
  );

  const { enqueueSnackbar } = useSnackbar();
  const { mutate: createCompetition, isPending: creating } =
    useCreateCompetition();
  const { mutate: updateCompetition, isPending: updating } =
    useUpdateCompetition();
  const isSubmitting = creating || updating;

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(competitionSchema),
    defaultValues: isEdit
      ? getEditDefaults(resolvedCompetition || {})
      : DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      if (resolvedCompetition) {
        reset(getEditDefaults(resolvedCompetition));
      }
    } else {
      reset(DEFAULT_VALUES);
    }

    setActiveStep(0);
    setPoster(null);
  }, [open, isEdit, resolvedCompetition, reset]);

  function handleClose() {
    reset(DEFAULT_VALUES);
    setActiveStep(0);
    setPoster(null);
    onClose();
  }

  async function handleNext() {
    const fieldsForStep = STEP_FIELDS[activeStep];
    if (fieldsForStep.length > 0) {
      const valid = await trigger(fieldsForStep);
      if (!valid) return;
    }
    setActiveStep((s) => s + 1);
  }

  function handleBack() {
    setActiveStep((s) => s - 1);
  }

  function buildFormData(data) {
    const fd = new FormData();
    const normalizedRegistrationFee = Number(data.registrationFee ?? 0) || 0;
    const normalizedIsPaid = Boolean(data.isPaid);
    const normalizedPerPerson = normalizedIsPaid
      ? Boolean(data.perPerson)
      : false;
    const allowPromoCodes = normalizedRegistrationFee > 0;

    const append = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      fd.append(key, String(value));
    };

    // Text / enum fields
    append("title", data.title);
    append("shortDescription", data.shortDescription);
    append("category", data.category);
    append("eventType", data.eventType);
    append("type", data.type);
    append("status", data.status);

    // Dates - send as ISO strings
    if (data.startTime)
      fd.append("startTime", new Date(data.startTime).toISOString());
    if (data.endTime)
      fd.append("endTime", new Date(data.endTime).toISOString());
    if (data.registrationDeadline)
      fd.append(
        "registrationDeadline",
        new Date(data.registrationDeadline).toISOString(),
      );

    append("venueName", data.venueName);
    append("venueRoom", data.venueRoom);
    append("venueFloor", data.venueFloor);

    if (Array.isArray(data.subVenues) && data.subVenues.length > 0) {
      const normalizedSubVenues = data.subVenues
        .map((v) => ({
          name: String(v?.name || "").trim(),
          room: String(v?.room || "").trim() || undefined,
          floor: String(v?.floor || "").trim() || undefined,
          capacity:
            v?.capacity !== "" && v?.capacity != null
              ? Number(v.capacity)
              : undefined,
          notes: String(v?.notes || "").trim() || undefined,
        }))
        .filter((v) => v.name);

      if (normalizedSubVenues.length > 0) {
        fd.append("subVenues", JSON.stringify(normalizedSubVenues));
      }
    }

    // Rules
    if (data.rulesRichText) fd.append("rulesRichText", data.rulesRichText);

    // Numeric
    fd.append("registrationFee", String(normalizedRegistrationFee));
    if (data.maxRegistrations)
      fd.append("maxRegistrations", String(data.maxRegistrations));
    if (data.minTeamSize) fd.append("minTeamSize", String(data.minTeamSize));
    if (data.maxTeamSize) fd.append("maxTeamSize", String(data.maxTeamSize));

    // Booleans - backend multer normalises "true"/"false" strings
    fd.append("registrationsOpen", String(data.registrationsOpen ?? true));
    fd.append("requiresApproval", String(data.requiresApproval ?? true));
    fd.append("autoApproveTeams", String(data.autoApproveTeams ?? false));
    fd.append("attendanceRequired", String(data.attendanceRequired ?? false));
    fd.append("isPaid", String(normalizedIsPaid));
    fd.append("perPerson", String(normalizedPerPerson));

    // Serialize prize pool as JSON (backend parses it)
    if (Array.isArray(data.prizePool) && data.prizePool.length > 0) {
      const normalized = data.prizePool.map((p) => ({
        rank: p.rank || undefined,
        label: p.label,
        cash: p.cash !== "" && p.cash != null ? Number(p.cash) : undefined,
        inkind: p.inkind
          ? p.inkind
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      }));
      fd.append("prizePool", JSON.stringify(normalized));
    }

    if (
      allowPromoCodes &&
      Array.isArray(data.promoCodes) &&
      data.promoCodes.length > 0
    ) {
      const normalizedPromoCodes = data.promoCodes
        .map((pc) => ({
          code: String(pc?.code || "")
            .trim()
            .toUpperCase(),
          discountType: pc?.discountType || "PERCENT",
          discountValue:
            pc?.discountValue !== "" && pc?.discountValue != null
              ? Number(pc.discountValue)
              : undefined,
          maxUses:
            pc?.maxUses !== "" && pc?.maxUses != null
              ? Number(pc.maxUses)
              : undefined,
          isActive: pc?.isActive ?? true,
          description: String(pc?.description || "").trim() || undefined,
        }))
        .filter((pc) => pc.code && pc.discountValue != null);

      if (normalizedPromoCodes.length > 0) {
        fd.append("promoCodes", JSON.stringify(normalizedPromoCodes));
      }
    }

    // Poster file
    if (poster) {
      fd.append("poster", poster);
    }

    return fd;
  }

  const onSubmit = (data) => {
    const fd = buildFormData(data);

    if (isEdit) {
      updateCompetition(
        { competitionId: resolvedCompetition.id, formData: fd },
        {
          onSuccess: (res) => {
            if (res?.pendingApproval) {
              enqueueSnackbar(
                "Changes submitted for SA approval — sensitive fields (fee / prize pool) require review before going live.",
                { variant: "info", autoHideDuration: 6000 },
              );
            } else {
              enqueueSnackbar("Competition updated successfully", {
                variant: "success",
              });
            }
            handleClose();
          },
          onError: (err) =>
            enqueueSnackbar(
              err?.response?.data?.message || "Failed to update competition",
              { variant: "error" },
            ),
        },
      );
    } else {
      createCompetition(fd, {
        onSuccess: () => {
          enqueueSnackbar("Competition created successfully", {
            variant: "success",
          });
          handleClose();
        },
        onError: (err) =>
          enqueueSnackbar(
            err?.response?.data?.message || "Failed to create competition",
            { variant: "error" },
          ),
      });
    }
  };

  const stepComponents = [
    <CompetitionBasicInfoStep key="basic" control={control} errors={errors} />,
    <CompetitionScheduleVenueStep
      key="schedule"
      control={control}
      errors={errors}
    />,
    <CompetitionRulesStep key="rules" control={control} errors={errors} />,
    <CompetitionRegistrationConfigStep
      key="reg"
      control={control}
      errors={errors}
      watch={watch}
      setValue={setValue}
    />,
    <CompetitionPosterReviewStep
      key="poster"
      watch={watch}
      poster={poster}
      onPosterChange={setPoster}
      existingPosterPath={resolvedCompetition?.posterPath}
    />,
  ];

  const STEP_DESCRIPTIONS = [
    "Set the core details for your competition",
    "Define when and where the event takes place",
    "Provide rules, criteria and guidelines for participants",
    "Configure registration limits and participation settings",
    "Upload an event poster and review all details before submitting",
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ── Dialog Header ── */}
      <Box
        sx={{
          px: 4,
          pt: 3,
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "9px",
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Trophy size={15} color="#a855f7" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.2,
            }}
          >
            {isEdit
              ? `Edit: ${resolvedCompetition?.title || competition?.title || "Competition"}`
              : "Create Competition"}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Step {activeStep + 1} of {STEP_LABELS.length} ·{" "}
            {STEP_DESCRIPTIONS[activeStep]}
          </Typography>
        </Box>
      </Box>

      {/* ── Step Indicator ── */}
      <StepIndicator activeStep={activeStep} />

      {/* ── Step Content ── */}
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {isEdit && loadingCompetitionDetail ? (
            <Box
              sx={{
                height: "100%",
                minHeight: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <CircularProgress size={22} sx={{ color: "#a855f7" }} />
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Loading competition details…
              </Typography>
            </Box>
          ) : (
            stepComponents[activeStep]
          )}
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <GhostBtn onClick={handleClose}>Cancel</GhostBtn>

          <Box sx={{ display: "flex", gap: 1 }}>
            {activeStep > 0 && (
              <GhostBtn onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft size={14} />
                Back
              </GhostBtn>
            )}

            {activeStep < STEP_LABELS.length - 1 ? (
              <PurpleBtn key="next-btn" type="button" onClick={handleNext}>
                Next
                <ChevronRight size={14} />
              </PurpleBtn>
            ) : (
              <PurpleBtn
                key="save-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
              >
                {isSubmitting ? (
                  <>
                    <CircularProgress size={13} sx={{ color: "#fff" }} />
                    {isEdit ? "Saving…" : "Creating…"}
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Create Competition"
                )}
              </PurpleBtn>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
