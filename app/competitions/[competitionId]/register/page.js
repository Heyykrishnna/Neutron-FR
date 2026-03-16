"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetition } from "@/src/hooks/api/useCompetitions";
import {
  useMyRegistrations,
  usePublicCompetitionFormFields,
  useRegisterSoloCompetition,
  useRegisterTeamCompetition,
  useSendTeamInvite,
  useUploadRegistrationImage,
} from "@/src/hooks/api/usePublicRegistration";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    color: "#f4f4f5",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.7)" },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    fontFamily: "'Syne', sans-serif",
  },
};

const isEmptyFieldValue = (value, fieldType) => {
  if (fieldType === "MULTI_SELECT")
    return !Array.isArray(value) || value.length === 0;
  if (fieldType === "CHECKBOX") return value !== true;
  if (fieldType === "FILE" || fieldType === "IMAGE") return !value;
  return value === undefined || value === null || String(value).trim() === "";
};

export default function PublicCompetitionRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const competitionId = params?.competitionId;

  const { data: competition, isLoading: competitionLoading } =
    useCompetition(competitionId);
  const { data: myRegistrations = [], isLoading: myRegistrationsLoading } =
    useMyRegistrations(Boolean(user));
  const { data: formInfo, isLoading: fieldsLoading } =
    usePublicCompetitionFormFields(competitionId);

  const soloMutation = useRegisterSoloCompetition();
  const teamMutation = useRegisterTeamCompetition();
  const uploadImageMutation = useUploadRegistrationImage();
  const sendInviteMutation = useSendTeamInvite();

  const [teamName, setTeamName] = useState("");
  const [teamStep, setTeamStep] = useState(1);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [memberEmails, setMemberEmails] = useState([]);
  const [teamStepError, setTeamStepError] = useState("");
  const [valuesByField, setValuesByField] = useState({});
  const [errorsByField, setErrorsByField] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdTeamId, setCreatedTeamId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [invitedEmails, setInvitedEmails] = useState([]);

  const fields = formInfo?.fields || [];
  const formId = formInfo?.formId || null;
  const existingRegistration = useMemo(() => {
    return myRegistrations.find(
      (registration) => registration.competition?.id === competitionId,
    );
  }, [myRegistrations, competitionId]);

  const canRegister = useMemo(() => {
    if (!competition) return false;
    const beforeDeadline =
      !competition.registrationDeadline ||
      new Date(competition.registrationDeadline) > new Date();

    return (
      competition.status === "OPEN" &&
      competition.registrationsOpen &&
      beforeDeadline
    );
  }, [competition]);

  const hasConfiguredForm = formId && fields.length > 0;
  const isTeamCompetition = competition?.type === "TEAM";
  const parsedMinTeamSize = Number.parseInt(
    String(competition?.minTeamSize ?? ""),
    10,
  );
  const parsedMaxTeamSize = Number.parseInt(
    String(competition?.maxTeamSize ?? ""),
    10,
  );

  const minTeamSize =
    Number.isFinite(parsedMinTeamSize) && parsedMinTeamSize > 0
      ? parsedMinTeamSize
      : 1;
  const maxTeamSize = Number.isFinite(parsedMaxTeamSize)
    ? Math.max(parsedMaxTeamSize, minTeamSize)
    : null;

  const minAdditionalMembers = Math.max(minTeamSize - 1, 0);
  const maxAdditionalMembers =
    typeof maxTeamSize === "number" ? Math.max(maxTeamSize - 1, 0) : null;

  useEffect(() => {
    if (!loading && !user) {
      const nextPath = `/competitions/${competitionId}/register`;
      router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, user, router, competitionId]);

  const onFieldChange = (fieldId, value) => {
    setValuesByField((prev) => ({ ...prev, [fieldId]: value }));
    setErrorsByField((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    for (const field of fields) {
      if (!field.isRequired) continue;
      const value = valuesByField[field.id];
      if (isEmptyFieldValue(value, field.fieldType)) {
        nextErrors[field.id] = `${field.label} is required`;
      }
    }

    setErrorsByField(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addMemberEmail = () => {
    const normalized = memberEmailInput.trim().toLowerCase();
    setTeamStepError("");

    if (!normalized) {
      setTeamStepError("Member email is required.");
      return;
    }

    if (!isValidEmail(normalized)) {
      setTeamStepError("Enter a valid member email.");
      return;
    }

    if (memberEmails.includes(normalized)) {
      setTeamStepError("This member email is already added.");
      return;
    }

    if (user?.email && user.email.toLowerCase() === normalized) {
      setTeamStepError("Leader email is already part of the team.");
      return;
    }

    if (
      typeof maxAdditionalMembers === "number" &&
      memberEmails.length >= maxAdditionalMembers
    ) {
      setTeamStepError(
        `Maximum ${maxAdditionalMembers} additional members allowed.`,
      );
      return;
    }

    setMemberEmails((previous) => [...previous, normalized]);
    setMemberEmailInput("");
  };

  const removeMemberEmail = (email) => {
    setMemberEmails((previous) => previous.filter((item) => item !== email));
    setTeamStepError("");
  };

  const continueToFormStep = () => {
    const nextErrors = {};

    if (!teamName.trim()) {
      nextErrors.__teamName = "Team name is required";
    }

    if (memberEmails.length < minAdditionalMembers) {
      setTeamStepError(
        `Add at least ${minAdditionalMembers} teammate email${
          minAdditionalMembers === 1 ? "" : "s"
        } before continuing.`,
      );
    } else {
      setTeamStepError("");
    }

    setErrorsByField(nextErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      memberEmails.length < minAdditionalMembers
    ) {
      return;
    }

    setTeamStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!canRegister) {
      setSubmitError("Registrations are not open for this competition.");
      return;
    }

    if (!hasConfiguredForm) {
      setSubmitError(
        "Registration form is not configured for this competition yet.",
      );
      return;
    }

    if (existingRegistration) {
      setSubmitError("You are already registered for this competition.");
      return;
    }

    if (isTeamCompetition && teamStep !== 2) {
      setSubmitError("Complete team setup before submitting.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const formDataResponses = [];

      for (const field of fields) {
        const rawValue = valuesByField[field.id];
        if (isEmptyFieldValue(rawValue, field.fieldType)) continue;

        if (field.fieldType === "IMAGE" || field.fieldType === "FILE") {
          if (!formId) {
            throw new Error("Form ID missing for file upload");
          }

          const uploaded = await uploadImageMutation.mutateAsync({
            competitionId,
            formId,
            fieldName: field.label || field.id,
            file: rawValue,
          });

          formDataResponses.push({
            fieldId: field.id,
            fileUrl: uploaded?.fileUrl,
          });
          continue;
        }

        if (field.fieldType === "MULTI_SELECT") {
          formDataResponses.push({
            fieldId: field.id,
            jsonValue: Array.isArray(rawValue) ? rawValue : [rawValue],
          });
          continue;
        }

        if (field.fieldType === "CHECKBOX") {
          formDataResponses.push({
            fieldId: field.id,
            jsonValue: Boolean(rawValue),
          });
          continue;
        }

        formDataResponses.push({
          fieldId: field.id,
          value: String(rawValue),
        });
      }

      if (competition?.type === "TEAM") {
        const teamResult = await teamMutation.mutateAsync({
          competitionId,
          teamName: teamName.trim(),
          formData: formDataResponses,
        });

        const createdTeam = teamResult?.team?.id || "";
        setCreatedTeamId(createdTeam);

        if (createdTeam && memberEmails.length > 0) {
          const successfulInvites = [];
          const failedInvites = [];

          for (const email of memberEmails) {
            try {
              await sendInviteMutation.mutateAsync({
                teamId: createdTeam,
                invitedEmail: email,
              });
              successfulInvites.push(email);
            } catch {
              failedInvites.push(email);
            }
          }

          setInvitedEmails(successfulInvites);

          if (failedInvites.length > 0) {
            setInviteError(
              `Could not send invites to: ${failedInvites.join(", ")}`,
            );
          }
        }
      } else {
        await soloMutation.mutateAsync({
          competitionId,
          formData: formDataResponses,
        });
      }

      setSuccess(true);
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit registration",
      );
    }
  };

  if (
    loading ||
    competitionLoading ||
    fieldsLoading ||
    myRegistrationsLoading
  ) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#050505",
        }}
      >
        <CircularProgress size={26} sx={{ color: "#a855f7" }} />
      </Box>
    );
  }

  if (!user) return null;

  if (!competition || !canRegister) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#050505", p: 3 }}>
        <Typography sx={{ color: "#f87171" }}>
          Registration is not available for this competition.
        </Typography>
      </Box>
    );
  }

  if (existingRegistration && !success) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#050505", py: 7, px: 2 }}>
        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            background: "#0c0c0c",
            p: 4,
          }}
        >
          <Typography
            sx={{ color: "#f4f4f5", fontSize: 24, fontWeight: 700, mb: 1 }}
          >
            Already Registered
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", mb: 2.5 }}>
            You already have a registration for {competition.title}.
          </Typography>
          <Link
            href="/competitions"
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Back to competitions
          </Link>
        </Box>
      </Box>
    );
  }

  if (!hasConfiguredForm && !success) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#050505", py: 7, px: 2 }}>
        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            background: "#0c0c0c",
            p: 4,
          }}
        >
          <Typography
            sx={{ color: "#f4f4f5", fontSize: 24, fontWeight: 700, mb: 1 }}
          >
            Form Not Ready
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", mb: 2.5 }}>
            Registration form is not configured for this competition yet.
          </Typography>
          <Link
            href={`/competitions/${competitionId}`}
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Back to details
          </Link>
        </Box>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#050505", py: 7, px: 2 }}>
        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            background: "#0c0c0c",
            p: 4,
          }}
        >
          <CheckCircle2
            size={34}
            color="#4ade80"
            style={{ marginBottom: 12 }}
          />
          <Typography
            sx={{ color: "#f4f4f5", fontSize: 24, fontWeight: 700, mb: 1 }}
          >
            Registration submitted
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", mb: 2 }}>
            Your registration for {competition.title} has been submitted
            successfully.
          </Typography>

          {competition.type === "TEAM" && createdTeamId && (
            <Box
              sx={{
                mt: 2.5,
                textAlign: "left",
                p: 2,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography
                sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14, mb: 1 }}
              >
                Invite Team Members
              </Typography>
              <Typography
                sx={{ color: "rgba(255,255,255,0.42)", fontSize: 12, mb: 1.4 }}
              >
                Invitations are automatically sent during registration.
              </Typography>

              {inviteError && <ErrorText>{inviteError}</ErrorText>}

              {invitedEmails.length > 0 && (
                <Box sx={{ mt: 1.4 }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Invitations sent to:
                  </Typography>
                  <Typography
                    sx={{ color: "#d4d4d8", fontSize: 12, lineHeight: 1.6 }}
                  >
                    {invitedEmails.join(", ")}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Link
            href="/competitions"
            style={{ color: "#c084fc", textDecoration: "none" }}
          >
            Back to competitions
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#050505",
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <Link
          href={`/competitions/${competitionId}`}
          style={{ textDecoration: "none" }}
        >
          <Typography
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              color: "rgba(255,255,255,0.55)",
              fontSize: 13,
              mb: 2,
            }}
          >
            <ArrowLeft size={14} /> Back to details
          </Typography>
        </Link>

        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            background: "#0c0c0c",
            p: { xs: 2.2, md: 3 },
          }}
        >
          <Typography
            sx={{
              color: "#f4f4f5",
              fontSize: { xs: 24, md: 30 },
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Register · {competition.title}
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.42)", mt: 0.8, mb: 2.5 }}
          >
            Complete the form below and submit your registration.
          </Typography>

          {isTeamCompetition && (
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <StepPill active={teamStep === 1}>Step 1 · Team Setup</StepPill>
              <StepPill active={teamStep === 2}>Step 2 · Form Fields</StepPill>
            </Box>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "grid", gap: 2 }}
          >
            {isTeamCompetition && teamStep === 1 && (
              <>
                <FieldLabel label="Team Name" required>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Enter your team name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                      color: "#f4f4f5",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  {errorsByField.__teamName && (
                    <ErrorText>{errorsByField.__teamName}</ErrorText>
                  )}
                </FieldLabel>

                <FieldLabel
                  label="Team Members (Email Invites)"
                  required={minAdditionalMembers > 0}
                  helpText={`Team size allowed: ${minTeamSize} to ${
                    typeof maxTeamSize === "number" ? maxTeamSize : "any"
                  } members (including leader). Add ${minAdditionalMembers}${
                    typeof maxAdditionalMembers === "number"
                      ? ` to ${maxAdditionalMembers}`
                      : "+"
                  } teammate email${
                    typeof maxAdditionalMembers === "number" &&
                    maxAdditionalMembers === 1
                      ? ""
                      : "s"
                  }.`}
                >
                  <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <input
                      type="email"
                      value={memberEmailInput}
                      onChange={(event) =>
                        setMemberEmailInput(event.target.value)
                      }
                      placeholder="member@email.com"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.03)",
                        color: "#f4f4f5",
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 13,
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={addMemberEmail}
                      style={{
                        border: "1px solid rgba(168,85,247,0.35)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        background: "rgba(109,40,217,0.2)",
                        color: "#e9d5ff",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        cursor: "pointer",
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <UserPlus size={14} /> Add Member
                    </button>
                  </Box>

                  {memberEmails.length > 0 ? (
                    <Box sx={{ display: "grid", gap: 0.7 }}>
                      {memberEmails.map((email) => (
                        <Box
                          key={email}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            px: 1,
                            py: 0.8,
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <Typography sx={{ color: "#d4d4d8", fontSize: 12 }}>
                            {email}
                          </Typography>
                          <button
                            type="button"
                            onClick={() => removeMemberEmail(email)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#f87171",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <X size={14} />
                          </button>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}
                    >
                      No member emails added yet.
                    </Typography>
                  )}

                  {teamStepError && <ErrorText>{teamStepError}</ErrorText>}
                </FieldLabel>

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 0.8 }}
                >
                  <button
                    type="button"
                    onClick={continueToFormStep}
                    style={{
                      border: "1px solid rgba(168,85,247,0.35)",
                      borderRadius: 10,
                      padding: "11px 20px",
                      background:
                        "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
                      color: "#fff",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                </Box>
              </>
            )}

            {isTeamCompetition && teamStep === 2 && (
              <FieldLabel label="Team Name" required>
                <input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Enter your team name"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#f4f4f5",
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13,
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                {errorsByField.__teamName && (
                  <ErrorText>{errorsByField.__teamName}</ErrorText>
                )}
              </FieldLabel>
            )}

            {(!isTeamCompetition || teamStep === 2) &&
              fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={valuesByField[field.id]}
                  error={errorsByField[field.id]}
                  onChange={(value) => onFieldChange(field.id, value)}
                />
              ))}

            {submitError && <ErrorText>{submitError}</ErrorText>}

            {(!isTeamCompetition || teamStep === 2) && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1.5,
                  gap: 1,
                }}
              >
                {isTeamCompetition ? (
                  <button
                    type="button"
                    onClick={() => setTeamStep(1)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      padding: "11px 16px",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                ) : (
                  <Box />
                )}

                <button
                  type="submit"
                  disabled={
                    soloMutation.isPending ||
                    teamMutation.isPending ||
                    uploadImageMutation.isPending
                  }
                  style={{
                    border: "1px solid rgba(168,85,247,0.35)",
                    borderRadius: 10,
                    padding: "11px 20px",
                    background:
                      "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
                    color: "#fff",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    opacity:
                      soloMutation.isPending ||
                      teamMutation.isPending ||
                      uploadImageMutation.isPending
                        ? 0.6
                        : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {soloMutation.isPending ||
                  teamMutation.isPending ||
                  uploadImageMutation.isPending ? (
                    <>
                      <CircularProgress size={14} sx={{ color: "#fff" }} />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function StepPill({ active, children }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.45,
        borderRadius: "7px",
        border: active
          ? "1px solid rgba(168,85,247,0.4)"
          : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(168,85,247,0.14)" : "rgba(255,255,255,0.04)",
        color: active ? "#e9d5ff" : "rgba(255,255,255,0.6)",
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </Box>
  );
}

function FieldLabel({ label, required, children, helpText }) {
  return (
    <Box>
      <Typography
        sx={{ color: "#e4e4e7", fontSize: 13, fontWeight: 600, mb: 0.7 }}
      >
        {label}
        {required ? " *" : ""}
      </Typography>
      {children}
      {helpText && (
        <Typography
          sx={{ color: "rgba(255,255,255,0.35)", mt: 0.55, fontSize: 11 }}
        >
          {helpText}
        </Typography>
      )}
    </Box>
  );
}

function ErrorText({ children }) {
  return (
    <Typography sx={{ color: "#f87171", fontSize: 12, mt: 0.55 }}>
      {children}
    </Typography>
  );
}

function FieldRenderer({ field, value, error, onChange }) {
  const options = Array.isArray(field.options) ? field.options : [];

  if (field.fieldType === "TEXTAREA") {
    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <textarea
          rows={4}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder || "Write your response"}
          style={baseInputStyle({ multiline: true })}
        />
        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  if (field.fieldType === "SELECT") {
    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          style={baseInputStyle()}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option
              key={option.value || option.label}
              value={option.value || option.label}
            >
              {option.label || option.value}
            </option>
          ))}
        </select>
        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  if (field.fieldType === "MULTI_SELECT") {
    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <Box sx={{ display: "grid", gap: 0.7 }}>
          {options.map((option) => {
            const optionValue = option.value || option.label;
            const active = Array.isArray(value) && value.includes(optionValue);

            return (
              <label
                key={optionValue}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#d4d4d8",
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => {
                    const current = Array.isArray(value) ? value : [];
                    if (event.target.checked) {
                      onChange([...current, optionValue]);
                    } else {
                      onChange(current.filter((item) => item !== optionValue));
                    }
                  }}
                />
                {option.label || option.value}
              </label>
            );
          })}
        </Box>
        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  if (field.fieldType === "RADIO") {
    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <Box sx={{ display: "grid", gap: 0.7 }}>
          {options.map((option) => {
            const optionValue = option.value || option.label;
            return (
              <label
                key={optionValue}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#d4d4d8",
                  fontSize: 13,
                }}
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={value === optionValue}
                  onChange={() => onChange(optionValue)}
                />
                {option.label || option.value}
              </label>
            );
          })}
        </Box>
        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  if (field.fieldType === "CHECKBOX") {
    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#d4d4d8",
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          Yes
        </label>
        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  if (field.fieldType === "IMAGE" || field.fieldType === "FILE") {
    const isImage = field.fieldType === "IMAGE";
    const previewUrl =
      isImage && value instanceof File ? URL.createObjectURL(value) : null;

    return (
      <FieldLabel
        label={field.label}
        required={field.isRequired}
        helpText={field.helpText}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 8,
            padding: "8px 12px",
            color: "#e9d5ff",
            background: "rgba(168,85,247,0.12)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {isImage ? <ImageIcon size={14} /> : <Upload size={14} />}
          {value instanceof File
            ? value.name
            : isImage
              ? "Choose image"
              : "Choose file"}
          <input
            type="file"
            accept={isImage ? "image/*" : "*"}
            style={{ display: "none" }}
            onChange={(event) => onChange(event.target.files?.[0] || null)}
          />
        </label>

        {isImage && previewUrl && (
          <Box
            component="img"
            src={previewUrl}
            alt="Preview"
            sx={{
              mt: 1,
              width: 220,
              maxWidth: "100%",
              height: 140,
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              objectFit: "cover",
            }}
          />
        )}

        {error && <ErrorText>{error}</ErrorText>}
      </FieldLabel>
    );
  }

  return (
    <FieldLabel
      label={field.label}
      required={field.isRequired}
      helpText={field.helpText}
    >
      <input
        type={
          field.fieldType === "NUMBER"
            ? "number"
            : field.fieldType === "DATE"
              ? "date"
              : field.fieldType === "EMAIL"
                ? "email"
                : field.fieldType === "PHONE"
                  ? "tel"
                  : field.fieldType === "URL"
                    ? "url"
                    : "text"
        }
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder || "Enter response"}
        style={baseInputStyle()}
      />
      {error && <ErrorText>{error}</ErrorText>}
    </FieldLabel>
  );
}

function baseInputStyle({ multiline = false } = {}) {
  return {
    width: "100%",
    minHeight: multiline ? 92 : undefined,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "#f4f4f5",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    resize: multiline ? "vertical" : "none",
  };
}
