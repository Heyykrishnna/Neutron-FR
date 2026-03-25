"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, CircularProgress, Dialog, Typography } from "@mui/material";
import { Check, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
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

const STEP_LABELS = [
  "Basic Info",
  "Schedule & Venue",
  "Rules",
  "Registration",
  "Poster & Review",
];

const STEP_DESCRIPTIONS = [
  "Core event identity and structure",
  "Timeline and location details",
  "Rules and participant instructions",
  "Registration logic, team limits, pricing, and incentives",
  "Poster upload and final review",
];

const BACKEND_FIELD_TOKEN_TO_FORM_FIELD = {
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
  MINTEAMSIZE: "minTeamSize",
  MAXTEAMSIZE: "maxTeamSize",
  PROMOCODES: "promoCodes",
  PROMOCO: "promoCodes",
  PRIZEPOO: "prizePool",
  PRIZEPOOL: "prizePool",
  POSTERSIZEBYTES: "poster",
  POSTERPATH: "poster",
  POSTERMIMETYPE: "poster",
  POSTERORIGINALNAME: "poster",
};

const ERROR_MESSAGE_MAP = {
  INVALID_SCHEDULE_RANGE: "Event end time must be after start time",
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

const findStepIndexForField = (fieldName) => {
  if (fieldName === "poster") {
    return STEP_LABELS.length - 1;
  }

  const index = STEP_FIELDS.findIndex((fields) => fields.includes(fieldName));
  return index >= 0 ? index : 0;
};

const parseBackendValidationCode = (code) => {
  if (typeof code !== "string") return null;

  // Check direct error message map first
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

  // Pattern: INVALID_SOMETHING_VALUE
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

  // Pattern: INVALID_SOMETHING_AT_INDEX_N (for complex fields)
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

  // Pattern: PROMO_* (for promo code errors)
  if (code.startsWith("PROMO_")) {
    return {
      field: "promoCodes",
      stepIndex: findStepIndexForField("promoCodes"),
      message: ERROR_MESSAGE_MAP[code] || "Promo code validation failed",
    };
  }

  // Pattern: PENDING_PROPOSAL_ALREADY_EXISTS
  if (code.includes("PENDING_PROPOSAL")) {
    return null; // This is a global error, not field-specific
  }

  return null;
};

const getFirstErrorMessage = (errorNode) => {
  if (!errorNode) return null;

  if (typeof errorNode?.message === "string" && errorNode.message.trim()) {
    return errorNode.message;
  }

  if (Array.isArray(errorNode)) {
    for (const item of errorNode) {
      const nested = getFirstErrorMessage(item);
      if (nested) return nested;
    }
    return null;
  }

  if (typeof errorNode === "object") {
    for (const value of Object.values(errorNode)) {
      const nested = getFirstErrorMessage(value);
      if (nested) return nested;
    }
  }

  return null;
};

const FIELD_LABELS = {
  registrationFee: "Registration Fee",
  maxRegistrations: "Max Registrations",
  maxTeamsPerCollege: "Max Teams Per College",
  minTeamSize: "Min Team Size",
  maxTeamSize: "Max Team Size",
  registrationsOpen: "Registrations Open",
  requiresApproval: "Requires Approval",
  autoApproveTeams: "Auto-Approve Teams",
  attendanceRequired: "Attendance Required",
  isPaid: "Paid Event",
  perPerson: "Fee Per Person",
  prizePool: "Prize Pool",
  promoCodes: "Promo Codes",
};

const formatFieldPathLabel = (pathParts = []) => {
  if (!pathParts.length) return "Form";

  const [root, second, third] = pathParts;
  const rootLabel = FIELD_LABELS[root] || root;

  if (typeof second === "number") {
    const rowIndex = second + 1;

    if (root === "prizePool") {
      const nested = third ? ` · ${FIELD_LABELS[third] || third}` : "";
      return `${rootLabel} #${rowIndex}${nested}`;
    }

    if (root === "promoCodes") {
      const nested = third ? ` · ${FIELD_LABELS[third] || third}` : "";
      return `${rootLabel} #${rowIndex}${nested}`;
    }
  }

  return rootLabel;
};

const collectErrorMessages = (node, path = [], bag = []) => {
  if (!node) return bag;

  if (typeof node?.message === "string" && node.message.trim()) {
    bag.push({
      field: formatFieldPathLabel(path),
      message: node.message.trim(),
    });
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectErrorMessages(item, [...path, index], bag),
    );
    return bag;
  }

  if (typeof node === "object") {
    Object.entries(node).forEach(([key, value]) => {
      if (key === "message" || key === "type" || key === "ref") return;
      collectErrorMessages(value, [...path, key], bag);
    });
  }

  return bag;
};

const getStepValidationMessages = (errors, fields = []) => {
  const messages = [];

  fields.forEach((fieldName) => {
    collectErrorMessages(errors?.[fieldName], [fieldName], messages);
  });

  const unique = new Set();
  return messages.filter((item) => {
    const key = `${item.field}:${item.message}`;
    if (unique.has(key)) return false;
    unique.add(key);
    return true;
  });
};

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
    >
      {children}
    </button>
  );
}

function PurpleBtn({ children, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...btnBase,
        background: disabled
          ? "rgba(168,85,247,0.25)"
          : "rgba(168,85,247,0.85)",
        border: "1px solid rgba(168,85,247,0.4)",
        color: disabled ? "rgba(255,255,255,0.35)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

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
      {STEP_LABELS.map((label, index) => (
        <Box
          key={label}
          sx={{
            display: "flex",
            alignItems: "center",
            flex: index < STEP_LABELS.length - 1 ? "1 1 auto" : undefined,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  index < activeStep
                    ? "rgba(168,85,247,0.9)"
                    : index === activeStep
                      ? "rgba(168,85,247,0.15)"
                      : "rgba(255,255,255,0.05)",
                border:
                  index === activeStep
                    ? "2px solid rgba(168,85,247,0.8)"
                    : index < activeStep
                      ? "2px solid rgba(168,85,247,0.9)"
                      : "2px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index < activeStep ? (
                <Check size={13} color="#fff" />
              ) : (
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color:
                      index === activeStep
                        ? "#c084fc"
                        : "rgba(255,255,255,0.25)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {index + 1}
                </Typography>
              )}
            </Box>
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: "0.06em",
                color:
                  index === activeStep
                    ? "rgba(255,255,255,0.8)"
                    : index < activeStep
                      ? "rgba(168,85,247,0.8)"
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
                    ? "rgba(168,85,247,0.5)"
                    : "rgba(255,255,255,0.06)",
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

export default function CompetitionFormModal({ open, onClose, competition }) {
  const isEdit = Boolean(competition);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [poster, setPoster] = useState(null);
  const [showStep4BlockReason, setShowStep4BlockReason] = useState(false);

  const { data: fetchedCompetition, isLoading: isCompetitionLoading } =
    useCompetition(open && competition?.id ? competition.id : null);

  const currentCompetition = useMemo(
    () => fetchedCompetition || competition || null,
    [fetchedCompetition, competition],
  );

  const statusOptions = useMemo(() => {
    const isDH = user?.role === "DH";
    if (!isDH) return STATUS_OPTS;
    if (currentCompetition?.status === "OPEN") return STATUS_OPTS;
    return STATUS_OPTS.filter((status) => status !== "OPEN");
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
    if (!open) return;

    if (isEdit) {
      if (currentCompetition) {
        reset(getEditDefaults(currentCompetition));
      }
    } else {
      reset(DEFAULT_VALUES);
    }

    setActiveStep(0);
    setPoster(null);
  }, [open, isEdit, currentCompetition, reset]);

  const closeModal = () => {
    reset(DEFAULT_VALUES);
    setPoster(null);
    setActiveStep(0);
    setShowStep4BlockReason(false);
    onClose();
  };

  const step4Reasons = useMemo(() => {
    if (activeStep !== 3) return [];
    return getStepValidationMessages(errors, STEP_FIELDS[3]);
  }, [activeStep, errors]);

  const goNext = async () => {
    const fields = STEP_FIELDS[activeStep] || [];
    if (!fields.length) {
      setShowStep4BlockReason(false);
      setActiveStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
      return;
    }

    const isStepValid = await trigger(fields);
    if (!isStepValid) {
      if (activeStep === 3) {
        setShowStep4BlockReason(true);
      }
      return;
    }

    setShowStep4BlockReason(false);
    setActiveStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
  };

  const goBack = () => {
    setShowStep4BlockReason(false);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (values) => {
    const formData = buildCompetitionPayloadFormData(values, poster);

    if (isEdit) {
      updateMutation.mutate(
        { competitionId: currentCompetition.id, formData },
        {
          onSuccess: (response) => {
            if (response?.pendingApproval) {
              enqueueSnackbar(
                response?.message ||
                  "Competition change submitted for SA approval.",
                { variant: "info", autoHideDuration: 6000 },
              );
            } else {
              enqueueSnackbar("Competition updated successfully", {
                variant: "success",
              });
            }
            closeModal();
          },
          onError: (error) => {
            const backendCode =
              error?.response?.data?.error || error?.response?.data?.message;
            const mappedValidation = parseBackendValidationCode(backendCode);

            if (mappedValidation) {
              setError(mappedValidation.field, {
                type: "server",
                message: mappedValidation.message,
              });
              setActiveStep(mappedValidation.stepIndex);
            }

            enqueueSnackbar(
              mappedValidation?.message ||
                error?.response?.data?.message ||
                "Failed to update competition",
              { variant: "error" },
            );
          },
        },
      );
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: (response) => {
        if (response?.pendingApproval) {
          enqueueSnackbar(
            response?.message ||
              "Competition creation submitted for SA approval.",
            { variant: "info", autoHideDuration: 6000 },
          );
        } else {
          enqueueSnackbar("Competition created successfully", {
            variant: "success",
          });
        }
        closeModal();
      },
      onError: (error) => {
        const backendCode =
          error?.response?.data?.error || error?.response?.data?.message;
        const mappedValidation = parseBackendValidationCode(backendCode);

        if (mappedValidation) {
          setError(mappedValidation.field, {
            type: "server",
            message: mappedValidation.message,
          });
          setActiveStep(mappedValidation.stepIndex);
        }

        enqueueSnackbar(
          mappedValidation?.message ||
            error?.response?.data?.message ||
            "Failed to create competition",
          { variant: "error" },
        );
      },
    });
  };

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
    />,
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={closeModal}
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
              ? `Edit: ${currentCompetition?.title || "Competition"}`
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

      <StepIndicator activeStep={activeStep} />

      <Box
        component="form"
        onSubmit={(event) => event.preventDefault()}
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Box sx={{ px: 4, py: 3, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {activeStep === 3 &&
            showStep4BlockReason &&
            step4Reasons.length > 0 && (
              <Box
                sx={{
                  mb: 2,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#f87171",
                    fontFamily: "'DM Mono', monospace",
                    mb: 0.35,
                  }}
                >
                  Cannot move to next step
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#fca5a5",
                    fontFamily: "'Syne', sans-serif",
                    lineHeight: 1.5,
                  }}
                >
                  Fix the following:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2.25 }}>
                  {step4Reasons.map((reason, index) => (
                    <Typography
                      key={`${reason.field}-${reason.message}-${index}`}
                      component="li"
                      sx={{
                        mt: 0.4,
                        fontSize: 12,
                        color: "#fecaca",
                        fontFamily: "'Syne', sans-serif",
                        lineHeight: 1.5,
                      }}
                    >
                      {reason.field}: {reason.message}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

          {isEdit && isCompetitionLoading ? (
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
            steps[activeStep]
          )}
        </Box>

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
    </Dialog>
  );
}
