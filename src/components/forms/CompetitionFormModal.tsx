"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, Dialog, Typography } from "@mui/material";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { useSnackbar } from "notistack";

import {
  buildCompetitionPayloadFormData,
  competitionSchema,
  DEFAULT_VALUES,
  getEditDefaults,
  STATUS_OPTS,
  STEP_FIELDS,
} from "./competitionSchemas";
import CompetitionBasicInfoStep from "./steps/CompetitionBasicInfoStep";
import CompetitionScheduleVenueStep from "./steps/CompetitionScheduleVenueStep";
import CompetitionRulesStep from "./steps/CompetitionRulesStep";
import CompetitionRegistrationConfigStep from "./steps/CompetitionRegistrationConfigStep";
import CompetitionPosterReviewStep from "./steps/CompetitionPosterReviewStep";
import {
  useCompetition,
  useCreateCompetition,
  useUpdateCompetition,
} from "@/src/hooks/api/useCompetitions";
import { useAuth } from "@/contexts/AuthContext";

// ─── Step config ──────────────────────────────────────────────────────────────

const STEP_LABELS = [
  "Basic Info",
  "Schedule & Venue",
  "Rules",
  "Registration",
  "Review",
];
const STEP_DESCRIPTIONS = [
  "Core identity and structure",
  "Timeline and location",
  "Rules and participant guidelines",
  "Limits, settings, prizes, and promo codes",
  "Poster upload and final review",
];

// ─── Backend error mapping ────────────────────────────────────────────────────

const BACKEND_FIELD_TOKEN_TO_FORM_FIELD: any = {
  TITLE: "title",
  SHORTDESCRIPTION: "shortDescription",
  CATEGORY: "category",
  RULESRICHTEXT: "rulesRichText",
  STARTTIME: "startTime",
  ENDTIME: "endTime",
  SCHEDULERANGE: "startTime",
  REGISTRATIONDEADLINE: "registrationDeadline",
  VENUENAME: "venueName",
  VENUEROOM: "venueRoom",
  VENUEFLOOR: "venueFloor",
  SUBVENUE: "subVenues",
  REGISTRATIONFEE: "registrationFee",
  MAXREGISTRATIONS: "maxRegistrations",
  MAXTEAMSPERCOLLEGE: "maxTeamsPerCollege",
  MAXTEAMSIZE: "maxTeamSize",
  MINTEAMSIZE: "minTeamSize",
  PROMOCODES: "promoCodes",
  PROMOCO: "promoCodes",
  PRIZEPOO: "prizePool",
  PRIZEPOOL: "prizePool",
  POSTERSIZEBYTES: "poster",
  POSTERPATH: "poster",
  POSTERMIMETYPE: "poster",
  POSTERORIGINALNAME: "poster",
  BANNERPATH: "banner",
  BANNERMIMETYPE: "banner",
  BANNERORIGINALNAME: "banner",
  BANNERSIZEBYTES: "banner",
};

const ERROR_MESSAGE_MAP: any = {
  INVALID_SCHEDULE_RANGE: "Event end time must be after start time",
  INVALID_START_TIME_NOT_IN_FUTURE: "Event start time must be in the future",
  INVALID_END_TIME_NOT_IN_FUTURE: "Event end time must be in the future",
  INVALID_REGISTRATION_DEADLINE_NOT_IN_FUTURE:
    "Registration deadline must be in the future",
  INVALID_REGISTRATION_DEADLINE:
    "Registration deadline must be before event start time",
  INVALID_PROMO_CODES_FORMAT: "Promo codes have invalid format or values",
  INVALID_MIN_TEAM_SIZE_VALUE: "Minimum team size must be a positive number",
  INVALID_MAX_TEAM_SIZE_VALUE: "Maximum team size must be greater than minimum",
  INVALID_COMPETITION_TYPE_VALUE: "Invalid competition type",
  PENDING_PROPOSAL_ALREADY_EXISTS:
    "A pending edit proposal already exists for this competition",
  PROMO_PERCENT_EXCEEDS_100: "Promo code discount cannot exceed 100%",
  PROMO_FLAT_EXCEEDS_REGISTRATION_FEE:
    "Flat discount cannot exceed registration fee",
};

const findStepIndexForField = (fieldName: any) => {
  if (fieldName === "poster" || fieldName === "banner")
    return STEP_LABELS.length - 1;
  const index = STEP_FIELDS.findIndex((fields) => fields.includes(fieldName));
  return index >= 0 ? index : 0;
};

const parseBackendValidationCode = (code: any) => {
  if (typeof code !== "string") return null;

  if (ERROR_MESSAGE_MAP[code]) {
    const parts = code.match(/^INVALID_([A-Z_]+)/) || code.match(/^([A-Z_]+)/);
    const token = parts ? parts[1].replaceAll("_", "") : "";
    const fieldName = BACKEND_FIELD_TOKEN_TO_FORM_FIELD[token] || "title";
    return {
      field: fieldName,
      stepIndex: findStepIndexForField(fieldName),
      message: ERROR_MESSAGE_MAP[code],
    };
  }

  const invalidValueMatch = code.match(/^INVALID_([A-Z_]+)_VALUE$/);
  if (invalidValueMatch) {
    const token = invalidValueMatch[1].replaceAll("_", "");
    const fieldName = BACKEND_FIELD_TOKEN_TO_FORM_FIELD[token];
    if (!fieldName) return null;
    return {
      field: fieldName,
      stepIndex: findStepIndexForField(fieldName),
      message: "Please enter a valid value for this field.",
    };
  }

  const indexMatch = code.match(/^INVALID_([A-Z_]+)_AT_INDEX_\d+/);
  if (indexMatch) {
    const token = indexMatch[1].replaceAll("_", "");
    const fieldName = BACKEND_FIELD_TOKEN_TO_FORM_FIELD[token];
    if (!fieldName) return null;
    return {
      field: fieldName,
      stepIndex: findStepIndexForField(fieldName),
      message: `Invalid entry in ${fieldName}. Please review and correct.`,
    };
  }

  if (code.startsWith("PROMO_")) {
    return {
      field: "promoCodes",
      stepIndex: findStepIndexForField("promoCodes"),
      message: ERROR_MESSAGE_MAP[code] || "Promo code validation failed",
    };
  }

  return null;
};

// ─── Error collection helpers ─────────────────────────────────────────────────

const FIELD_LABELS: any = {
  title: "Title",
  shortDescription: "Short Description",
  category: "Category",
  eventType: "Event Type",
  type: "Participation Type",
  status: "Status",
  startTime: "Start Time",
  endTime: "End Time",
  registrationDeadline: "Registration Deadline",
  venueName: "Venue Name",
  venueRoom: "Room",
  venueFloor: "Floor",
  subVenues: "Sub Venues",
  rulesRichText: "Rules",
  registrationFee: "Registration Fee",
  maxRegistrations: "Max Registrations",
  maxTeamsPerCollege: "Max Teams Per College",
  minTeamSize: "Min Team Size",
  maxTeamSize: "Max Team Size",
  registrationsOpen: "Registrations Open",
  requiresApproval: "Requires Approval",
  autoApproveTeams: "Auto-Approve",
  attendanceRequired: "Attendance Required",
  isPaid: "Paid Event",
  perPerson: "Fee Per Person",
  prizePool: "Prize Pool",
  promoCodes: "Promo Codes",
};

const collectErrorMessages = (node: any, path: any = [], bag: any = []) => {
  if (!node) return bag;
  if (typeof node?.message === "string" && node.message.trim()) {
    const [root, second, third] = path;
    const rootLabel = FIELD_LABELS[root] || root;
    let fieldLabel: any = rootLabel;
    if (typeof second === "number") {
      const nested = third ? ` · ${FIELD_LABELS[third] || third}` : "";
      fieldLabel = `${rootLabel} #${second + 1}${nested}`;
    }
    bag.push({ field: fieldLabel, message: node.message.trim() });
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectErrorMessages(item, [...path, i], bag));
    return bag;
  }
  if (typeof node === "object") {
    Object.entries(node).forEach(([key, val]) => {
      if (key === "message" || key === "type" || key === "ref") return;
      collectErrorMessages(val, [...path, key], bag);
    });
  }
  return bag;
};

const getStepErrorMessages = (errors: any, fields: any = []) => {
  const messages: any = [];
  fields.forEach((f: any) => collectErrorMessages(errors?.[f], [f], messages));
  const seen = new Set();
  return messages.filter(({ field, message }: any) => {
    const key = `${field}:${message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const countStepErrors = (errors: any, fields = []) =>
  getStepErrorMessages(errors, fields).length;

// ─── Buttons ──────────────────────────────────────────────────────────────────

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

function GhostBtn({ onClick, children, disabled }: any) {
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
    >
      {children}
    </button>
  );
}

function PurpleBtn({ children, disabled, onClick }: any) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...btnBase,
        background: disabled ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.4)",
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  activeStep,
  visitedUpTo,
  stepErrorCounts,
  onStepClick,
}: any) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 4,
        py: 2,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
      }}
    >
      {STEP_LABELS.map((label, index) => {
        const isActive = index === activeStep;
        const isDone = index < activeStep;
        const isVisited = index <= visitedUpTo;
        const canClick = isVisited && index !== activeStep;
        const errCount = stepErrorCounts[index] || 0;
        const hasErrors = errCount > 0 && isVisited && !isActive;

        return (
          <Box
            key={label}
            sx={{
              display: "flex",
              alignItems: "center",
              flex: index < STEP_LABELS.length - 1 ? "1 1 auto" : undefined,
            }}
          >
            <Box
              onClick={() => canClick && onStepClick(index)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                cursor: canClick ? "pointer" : "default",
                "&:hover .step-label": canClick
                  ? { color: "rgba(255,255,255,0.7)" }
                  : {},
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  position: "relative",
                  background: hasErrors
                    ? "rgba(239,68,68,0.12)"
                    : isDone
                      ? "rgba(168,85,247,0.9)"
                      : isActive
                        ? "rgba(168,85,247,0.12)"
                        : "rgba(255,255,255,0.04)",
                  border: hasErrors
                    ? "2px solid rgba(239,68,68,0.5)"
                    : isDone
                      ? "2px solid rgba(168,85,247,0.9)"
                      : isActive
                        ? "2px solid rgba(168,85,247,0.8)"
                        : "2px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasErrors ? (
                  <AlertCircle size={12} color="#f87171" />
                ) : isDone ? (
                  <Check size={13} color="#fff" />
                ) : (
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isActive ? "#c084fc" : "rgba(255,255,255,0.22)",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
              </Box>
              <Typography
                className="step-label"
                sx={{
                  fontSize: 9.5,
                  letterSpacing: "0.06em",
                  transition: "color 0.12s",
                  color: hasErrors
                    ? "#f87171"
                    : isActive
                      ? "rgba(255,255,255,0.8)"
                      : isDone
                        ? "rgba(168,85,247,0.75)"
                        : "rgba(255,255,255,0.2)",
                  fontFamily: "'Syne', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Box>

            {index < STEP_LABELS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: "1px",
                  mx: 1,
                  mb: 2.25,
                  background:
                    index < activeStep
                      ? "rgba(168,85,247,0.45)"
                      : "rgba(255,255,255,0.05)",
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Inline step error banner ─────────────────────────────────────────────────

function StepErrorBanner({ messages }: any) {
  if (!messages.length) return null;
  return (
    <Box
      sx={{
        mb: 2.5,
        px: 2,
        py: 1.5,
        borderRadius: "8px",
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.18)",
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#f87171",
          fontFamily: "'DM Mono', monospace",
          mb: 0.75,
        }}
      >
        Fix the following before continuing
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
        {messages.map((item: any, i: any) => (
          <Typography
            key={`${item.field}-${i}`}
            component="li"
            sx={{
              fontSize: 12,
              color: "#fecaca",
              fontFamily: "'Syne', sans-serif",
              lineHeight: 1.6,
              mt: 0.25,
            }}
          >
            <strong style={{ color: "#fca5a5" }}>{item.field}:</strong>{" "}
            {item.message}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CompetitionFormModal({
  open,
  onClose,
  competition,
  mode = "modal",
}: any) {
  const isPageMode = mode === "page";
  const isVisible = isPageMode ? true : Boolean(open);
  const isEdit = Boolean(competition);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [visitedUpTo, setVisitedUpTo] = useState(0);
  const [poster, setPoster] = useState(null);
  const [banner, setBanner] = useState(null);
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const { data: fetchedCompetition, isLoading: isCompetitionLoading } =
    useCompetition(isVisible && competition?.id ? competition.id : null);

  const currentCompetition = useMemo(
    () => fetchedCompetition || competition || null,
    [fetchedCompetition, competition],
  );

  const statusOptions = useMemo(() => {
    const isDH = user?.role === "DH";
    if (!isDH) return STATUS_OPTS;
    if (currentCompetition?.status === "OPEN") return STATUS_OPTS;
    return STATUS_OPTS.filter((s) => s !== "OPEN");
  }, [user?.role, currentCompetition?.status]);

  const createMutation = useCreateCompetition();
  const updateMutation = useUpdateCompetition();

  const {
    control,
    reset,
    trigger,
    watch,
    setValue,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(competitionSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (!isVisible) return;
    if (isEdit) {
      if (currentCompetition) reset(getEditDefaults(currentCompetition));
    } else {
      reset(DEFAULT_VALUES);
    }
    setActiveStep(0);
    setVisitedUpTo(0);
    setPoster(null);
    setBanner(null);
    setShowErrorBanner(false);
  }, [isVisible, isEdit, currentCompetition, reset]);

  const closeModal = () => {
    reset(DEFAULT_VALUES);
    setPoster(null);
    setBanner(null);
    setActiveStep(0);
    setVisitedUpTo(0);
    setShowErrorBanner(false);
    if (typeof onClose === "function") onClose();
  };

  // Compute per-step error counts for the indicator
  const stepErrorCounts = useMemo(
    () => STEP_FIELDS.map((fields: any) => countStepErrors(errors, fields)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(errors)], // eslint avoidance — errors is a deep object
  );

  const currentStepErrors = useMemo(
    () =>
      showErrorBanner
        ? getStepErrorMessages(errors, STEP_FIELDS[activeStep] || [])
        : [],
    [showErrorBanner, errors, activeStep],
  );

  const goNext = async () => {
    const fields: any = STEP_FIELDS[activeStep] || [];
    if (!fields.length) {
      setShowErrorBanner(false);
      const next = Math.min(activeStep + 1, STEP_LABELS.length - 1);
      setActiveStep(next);
      setVisitedUpTo((v) => Math.max(v, next));
      return;
    }

    const valid = await trigger(fields);
    if (!valid) {
      setShowErrorBanner(true);
      return;
    }

    setShowErrorBanner(false);
    const next = Math.min(activeStep + 1, STEP_LABELS.length - 1);
    setActiveStep(next);
    setVisitedUpTo((v) => Math.max(v, next));
  };

  const goBack = () => {
    setShowErrorBanner(false);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const goToStep = (index: any) => {
    setShowErrorBanner(false);
    setActiveStep(index);
  };

  const onSubmit = async (values: any) => {
    const formData = buildCompetitionPayloadFormData(values, poster, banner);

    const handleError = (error: any) => {
      const backendCode =
        error?.response?.data?.error || error?.response?.data?.message;
      const mapped = parseBackendValidationCode(backendCode);
      if (mapped) {
        setError(mapped.field, { type: "server", message: mapped.message });
        setActiveStep(mapped.stepIndex);
        setVisitedUpTo((v) => Math.max(v, mapped.stepIndex));
        setShowErrorBanner(true);
      }
      enqueueSnackbar(
        mapped?.message ||
        error?.response?.data?.message ||
        (isEdit
          ? "Failed to update competition"
          : "Failed to create competition"),
        { variant: "error" },
      );
    };

    if (isEdit) {
      updateMutation.mutate(
        { competitionId: currentCompetition.id, formData },
        {
          onSuccess: (response) => {
            enqueueSnackbar(
              response?.pendingApproval
                ? response?.message ||
                "Competition change submitted for SA approval."
                : "Competition updated successfully",
              {
                variant: response?.pendingApproval ? "info" : "success",
                autoHideDuration: 6000,
              },
            );
            closeModal();
          },
          onError: handleError,
        },
      );
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: (response) => {
        enqueueSnackbar(
          response?.pendingApproval
            ? response?.message ||
            "Competition creation submitted for SA approval."
            : "Competition created successfully",
          {
            variant: response?.pendingApproval ? "info" : "success",
            autoHideDuration: 6000,
          },
        );
        closeModal();
      },
      onError: handleError,
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const steps = [
    <CompetitionBasicInfoStep
      key="basic"
      control={control}
      errors={errors}
      statusOptions={statusOptions}
    />,
    <CompetitionScheduleVenueStep
      key="schedule"
      control={control}
      errors={errors}
    />,
    <CompetitionRulesStep key="rules" control={control} errors={errors} />,
    <CompetitionRegistrationConfigStep
      key="registration"
      control={control}
      errors={errors}
      setValue={setValue}
    />,
    <CompetitionPosterReviewStep
      key="poster"
      watch={watch}
      poster={poster}
      onPosterChange={setPoster}
      existingPosterPath={currentCompetition?.posterPath}
      banner={banner}
      onBannerChange={setBanner}
      existingBannerPath={currentCompetition?.bannerPath}
    />,
  ];

  const formContent = (
    <>
      {/* ── Header ── */}
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
            background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.22)",
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
              ? `Edit: ${currentCompetition?.title || "Competition"}`
              : "Create Competition"}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Step {activeStep + 1} of {STEP_LABELS.length} ·{" "}
            {STEP_DESCRIPTIONS[activeStep]}
          </Typography>
        </Box>
      </Box>

      {/* ── Step indicator ── */}
      <StepIndicator
        activeStep={activeStep}
        visitedUpTo={visitedUpTo}
        stepErrorCounts={stepErrorCounts}
        onStepClick={goToStep}
      />

      {/* ── Form body ── */}
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Box 
        data-lenis-prevent
        sx={{ px: 4, py: 3, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {/* Error banner */}
          <StepErrorBanner messages={currentStepErrors} />

          {/* Loading state (edit mode) */}
          {isEdit && isCompetitionLoading ? (
            <Box
              sx={{
                height: "100%",
                minHeight: 240,
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
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Loading competition…
              </Typography>
            </Box>
          ) : (
            steps[activeStep]
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
          <GhostBtn onClick={closeModal} disabled={isSubmitting}>
            Cancel
          </GhostBtn>

          <Box sx={{ display: "flex", gap: 1 }}>
            {activeStep > 0 && (
              <GhostBtn onClick={goBack} disabled={isSubmitting}>
                <ChevronLeft size={14} />
                Back
              </GhostBtn>
            )}

            {activeStep < STEP_LABELS.length - 1 ? (
              <PurpleBtn onClick={goNext} disabled={isSubmitting}>
                Next
                <ChevronRight size={14} />
              </PurpleBtn>
            ) : (
              <PurpleBtn
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
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
    </>
  );

  if (isPageMode) {
    return (
      <Box
        sx={{
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75)",
          overflow: "hidden",
          minHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {formContent}
      </Box>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: "#0e0e0e",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.75)",
          overflow: "hidden",
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {formContent}
    </Dialog>
  );
}
