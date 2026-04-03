"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthMe } from "@/src/hooks/api/useAuth";
import {
  useMyRegistrations,
  usePublicCompetitionFormFields,
  useRegisterSoloCompetition,
  useRegisterTeamCompetition,
  useSendTeamInvite,
  useSubmitTeamMemberForm,
} from "@/src/hooks/api/usePublicRegistration";

function parseTeamSize(sizeStr: string): number[] {
  const match = sizeStr.match(/(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return [1];

  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  const options: number[] = [];
  for (let i = min; i <= max; i++) options.push(i);
  return options.length ? options : [1];
}

type FormField = {
  id?: string;
  _id?: string;
  name?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: Array<string | { label?: string; value?: string }>;
};

type TeamDetails = {
  teamName: string;
  selectedTeamSize: string;
  inviteInput: string;
  inviteEmails: string[];
};

const normalizeFieldValue = (field: FormField, value: any) => {
  const fieldType = String(field?.type || "text").toLowerCase();
  if (fieldType === "number") {
    if (value === "") return "";
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  }
  if (fieldType === "checkbox") return Boolean(value);
  return value;
};

const extractCheckoutUrl = (payload: any): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const payment = payload?.payment || null;
  const directUrl = payment?.session?.checkoutUrl || payment?.checkoutUrl;

  if (typeof directUrl === "string" && directUrl.trim().length > 0) {
    return directUrl;
  }

  return null;
};

export default function CompetitionRegistration({
  competitionId,
  competitionTitle,
  teamSize,
}: {
  competitionId: string;
  competitionTitle: string;
  teamSize: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"start" | "team" | "form" | "success">(
    "start",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutRedirecting, setCheckoutRedirecting] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetails>({
    teamName: "",
    selectedTeamSize: "",
    inviteInput: "",
    inviteEmails: [],
  });
  const [referralCode, setReferralCode] = useState("");
  const [dynamicFormValues, setDynamicFormValues] = useState<
    Record<string, any>
  >({});

  const teamOptions = useMemo(() => parseTeamSize(teamSize), [teamSize]);
  const isSolo = teamOptions.length === 1 && teamOptions[0] === 1;
  const selectedTeamSize = Number(
    teamDetails.selectedTeamSize || teamOptions[0] || 1,
  );
  const inviteSlots = Math.max(selectedTeamSize - 1, 0);

  const authMeQuery = useAuthMe();
  const isAuthenticated = !!authMeQuery.data;

  const myRegistrationsQuery = useMyRegistrations(isAuthenticated);
  const formFieldsQuery = usePublicCompetitionFormFields(competitionId);
  const registerSoloMutation = useRegisterSoloCompetition();
  const registerTeamMutation = useRegisterTeamCompetition();
  const sendTeamInviteMutation = useSendTeamInvite();
  const submitMemberFormMutation = useSubmitTeamMemberForm();

  const mode = searchParams.get("mode");
  const teamIdFromQuery = searchParams.get("teamId") || "";
  const isMemberMode = mode === "member" && Boolean(teamIdFromQuery);
  const searchQuery = searchParams.toString();
  const callbackUrl = searchQuery ? `${pathname}?${searchQuery}` : pathname;

  const registrations = Array.isArray(myRegistrationsQuery.data)
    ? myRegistrationsQuery.data
    : [];
  const competitionFormFields = Array.isArray(formFieldsQuery.data?.fields)
    ? formFieldsQuery.data.fields
    : [];
  const hasPublishedForm =
    Boolean(formFieldsQuery.data?.formId) || competitionFormFields.length > 0;
  const isFormMissing = !formFieldsQuery.isLoading && !hasPublishedForm;

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("referral_code") || "";
      setReferralCode(stored.trim().toUpperCase());
    } catch {
      setReferralCode("");
    }
  }, []);

  const alreadyRegistered = useMemo(() => {
    return registrations.some((entry: any) => {
      const directCompetitionId = entry?.competitionId;
      const nestedCompetitionId =
        entry?.competition?.id || entry?.competition?._id;
      return (
        String(directCompetitionId || nestedCompetitionId || "") ===
        competitionId
      );
    });
  }, [registrations, competitionId]);

  useEffect(() => {
    if (isMemberMode && step === "start") {
      setStep("form");
    }
  }, [isMemberMode, step]);

  const handleTeamDetailsContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isSolo && !teamDetails.teamName.trim()) {
      setErrorMessage("Team name is required.");
      return;
    }

    if (!isSolo && teamDetails.inviteInput.trim()) {
      setErrorMessage("Press Enter to add the invite email before continuing.");
      return;
    }

    setStep("form");
  };

  const addInviteEmail = () => {
    const value = teamDetails.inviteInput.trim().toLowerCase();
    if (!value) return;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!isValidEmail) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (teamDetails.inviteEmails.includes(value)) {
      setErrorMessage("This email is already added.");
      return;
    }

    if (inviteSlots > 0 && teamDetails.inviteEmails.length >= inviteSlots) {
      setErrorMessage(
        `You can add up to ${inviteSlots} teammate email${inviteSlots > 1 ? "s" : ""}.`,
      );
      return;
    }

    setErrorMessage("");
    setTeamDetails((prev) => ({
      ...prev,
      inviteInput: "",
      inviteEmails: [...prev.inviteEmails, value],
    }));
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isFormMissing) {
      setErrorMessage(
        "Registration is currently unavailable because no active competition form was found.",
      );
      return;
    }

    const formData = competitionFormFields.map((field: FormField) => {
      const fieldId = String(field._id || field.id || "");
      const fieldName = field.name || field.label || fieldId;
      const rawValue = dynamicFormValues[fieldName];

      return {
        fieldId,
        fieldName,
        value: normalizeFieldValue(field, rawValue),
      };
    });

    try {
      let registrationResult: any = null;

      if (isMemberMode) {
        await submitMemberFormMutation.mutateAsync({
          teamId: teamIdFromQuery,
          formData,
        });
      } else if (isSolo) {
        registrationResult = await registerSoloMutation.mutateAsync({
          competitionId,
          formData,
        });
      } else {
        registrationResult = await registerTeamMutation.mutateAsync({
          competitionId,
          teamName: teamDetails.teamName.trim(),
          formData,
          referralCode: referralCode || undefined,
        });

        const createdTeamId = registrationResult?.team?.id;

        if (createdTeamId && teamDetails.inviteEmails.length > 0) {
          await Promise.allSettled(
            teamDetails.inviteEmails.map((email) =>
              sendTeamInviteMutation.mutateAsync({
                teamId: createdTeamId,
                invitedEmail: email,
              }),
            ),
          );
        }
      }

      const checkoutUrl = extractCheckoutUrl(registrationResult);
      if (checkoutUrl && typeof window !== "undefined") {
        setCheckoutRedirecting(true);
        window.location.assign(checkoutUrl);
        return;
      }

      await myRegistrationsQuery.refetch();
      setStep("success");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Registration failed. Please try again.",
      );
    }
  };

  const renderDynamicField = (field: FormField, index: number) => {
    const fieldName =
      field.name ||
      field.label ||
      String(field._id || field.id || `field-${index}`);
    const fieldType = String(field.type || "text").toLowerCase();
    const required = Boolean(field.required);
    const value =
      dynamicFormValues[fieldName] ?? (fieldType === "checkbox" ? false : "");

    if (fieldType === "textarea") {
      return (
        <textarea
          required={required}
          value={value}
          onChange={(event) =>
            setDynamicFormValues((prev) => ({
              ...prev,
              [fieldName]: event.target.value,
            }))
          }
          placeholder={`Enter ${field.label || fieldName}`}
          className="bg-black border border-white/10 rounded-lg px-4 py-3 min-h-28 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
        />
      );
    }

    if (fieldType === "select") {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <select
          required={required}
          value={value}
          onChange={(event) =>
            setDynamicFormValues((prev) => ({
              ...prev,
              [fieldName]: event.target.value,
            }))
          }
          className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-hidden focus:border-white/40"
        >
          <option value="">Select an option</option>
          {options.map((option, optionIndex) => {
            const optionValue =
              typeof option === "string"
                ? option
                : option.value || option.label || "";
            const optionLabel =
              typeof option === "string"
                ? option
                : option.label || option.value || "Option";
            return (
              <option key={`${fieldName}-${optionIndex}`} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      );
    }

    if (fieldType === "checkbox") {
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            checked={Boolean(value)}
            onChange={(event) =>
              setDynamicFormValues((prev) => ({
                ...prev,
                [fieldName]: event.target.checked,
              }))
            }
            type="checkbox"
            className="w-4 h-4"
          />
          <span className="text-white/80 text-sm">
            {field.label || fieldName}
          </span>
        </label>
      );
    }

    const inputType =
      fieldType === "email" ||
      fieldType === "tel" ||
      fieldType === "number" ||
      fieldType === "date"
        ? fieldType
        : "text";

    return (
      <input
        required={required}
        value={value}
        onChange={(event) =>
          setDynamicFormValues((prev) => ({
            ...prev,
            [fieldName]: event.target.value,
          }))
        }
        type={inputType}
        placeholder={`Enter ${field.label || fieldName}`}
        className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition-colors"
      />
    );
  };

  if (authMeQuery.isLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto transform transition-all hover:border-white/20">
        <h3 className="text-2xl font-semibold mb-4 text-white">
          Authentication Required
        </h3>
        <p className="text-white/60 mb-8 font-light">
          You must be signed in to your Neutron account to register for{" "}
          {competitionTitle}.
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform duration-300 w-full md:w-auto cursor-pointer"
        >
          Initiate Launch Sequence
        </Link>
      </div>
    );
  }

  if (myRegistrationsQuery.isLoading) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (alreadyRegistered && !isMemberMode) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto">
        <h3 className="text-2xl font-semibold mb-3 text-white">
          Already Registered
        </h3>
        <p className="text-white/70">
          Your registration for {competitionTitle} is already on record.
        </p>
      </div>
    );
  }

  if (step === "start") {
    return (
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto shadow-2xl text-center space-x-6">
        <div className="flex flex-col">

           <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Ready To Register?
        </h3>
        <p className="text-white/60 mb-8">
          We will collect team details first and then open the competition form.
        </p>
        </div>
        <div className="flex flex-row w-full items-center justify-center gap-6">
              <button
              type="button"
              disabled={isFormMissing || formFieldsQuery.isError}
              onClick={() => {
                if (isSolo || isMemberMode) {
                  setStep("form");
                  return;
                }
                setTeamDetails((prev) => ({
                  ...prev,
                  selectedTeamSize:
                    prev.selectedTeamSize || String(teamOptions[0] || 1),
                }));
                setStep("team");
              }}
              className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isFormMissing || formFieldsQuery.isError
                ? "Registration Unavailable"
                : "Register Now"}
            </button>

            <button
              type="button"
              disabled={isFormMissing || formFieldsQuery.isError}
              onClick={() => {
                if (isSolo || isMemberMode) {
                  setStep("form");
                  return;
                }
                setTeamDetails((prev) => ({
                  ...prev,
                  selectedTeamSize:
                    prev.selectedTeamSize || String(teamOptions[0] || 1),
                }));
                setStep("team");
              }}
              className="bg-white text-[#1C4980] px-8 py-3 rounded-full font-semibold transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex flex-row justify-center items-center content-center gap-2"
            >
              {isFormMissing || formFieldsQuery.isError
                ? "Registration Unavailable"
                : (<>
                    Register on <img src="https://media.glassdoor.com/sqll/714146/dare2compete-com-squareLogo-1650879017582.png" alt="" className="h-6 w-6"/>
                </>)}
            </button>
        </div>
        
       
      </div>
    );
  }

  if (step === "team") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 max-w-2xl mx-auto shadow-2xl"
      >
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Team Details
          </h3>
          <p className="text-white/50 text-sm">Step 1 of 2</p>
        </div>

        <form onSubmit={handleTeamDetailsContinue} className="space-y-6">
          {!isSolo ? (
            <div className="flex flex-col space-y-2">
              <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">
                Team Name
              </label>
              <input
                required
                value={teamDetails.teamName}
                onChange={(event) =>
                  setTeamDetails((prev) => ({
                    ...prev,
                    teamName: event.target.value,
                  }))
                }
                type="text"
                placeholder="Neutron Crew"
                className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40"
              />
            </div>
          ) : null}

          {!isSolo && referralCode ? (
            <div className="flex flex-col space-y-2">
              <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">
                Referral Code
              </label>
              <input
                value={referralCode}
                readOnly
                className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white/70 placeholder-white/20 focus:outline-hidden focus:border-white/40"
              />
            </div>
          ) : null}

          {teamOptions.length > 1 ? (
            <div className="flex flex-col space-y-2">
              <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">
                Team Size
              </label>
              <select
                value={teamDetails.selectedTeamSize || String(teamOptions[0])}
                onChange={(event) =>
                  setTeamDetails((prev) => ({
                    ...prev,
                    selectedTeamSize: event.target.value,
                  }))
                }
                className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-hidden focus:border-white/40"
              >
                {teamOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} Members
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {selectedTeamSize > 1 ? (
            <div className="flex flex-col space-y-2">
              <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">
                Teammate Emails
              </label>
              <div className="flex gap-2">
                <input
                  value={teamDetails.inviteInput}
                  onChange={(event) =>
                    setTeamDetails((prev) => ({
                      ...prev,
                      inviteInput: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addInviteEmail();
                    }
                  }}
                  type="email"
                  placeholder="member@example.com"
                  disabled={teamDetails.inviteEmails.length >= inviteSlots}
                  className="bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-hidden focus:border-white/40 flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={addInviteEmail}
                  disabled={teamDetails.inviteEmails.length >= inviteSlots}
                  className="px-4 py-3 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {teamDetails.inviteEmails.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {teamDetails.inviteEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-2 text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-full"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() =>
                          setTeamDetails((prev) => ({
                            ...prev,
                            inviteEmails: prev.inviteEmails.filter(
                              (item) => item !== email,
                            ),
                          }))
                        }
                        className="text-white/60 hover:text-white"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-white/40">
                Add up to {inviteSlots} teammate email
                {inviteSlots > 1 ? "s" : ""}. Invites are sent after
                registration is created.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-rose-300">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue To Competition Form
          </button>
        </form>
      </motion.div>
    );
  }

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto"
      >
        <h3 className="text-3xl font-bold mb-4 text-white">
          Registration Complete
        </h3>
        <p className="text-white/60 mb-8 font-light">
          Your registration for {competitionTitle} has been submitted
          successfully.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 max-w-2xl mx-auto shadow-2xl"
    >
      <div className="mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Competition Form
        </h3>
        {!isMemberMode && <p className="text-white/50 text-sm">Step 2 of 2</p>}
      </div>

      <form onSubmit={handleSubmitRegistration} className="space-y-6">
        {formFieldsQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : formFieldsQuery.isError || isFormMissing ? (
          <p className="text-rose-200 text-sm border border-rose-300/30 bg-rose-900/20 rounded-lg px-4 py-3">
            Registration is currently unavailable because no active competition
            form was found.
          </p>
        ) : (
          competitionFormFields.map((field: FormField, index: number) => (
            <div
              key={String(field._id || field.id || `field-${index}`)}
              className="flex flex-col space-y-2"
            >
              {String(field.type || "text").toLowerCase() !== "checkbox" ? (
                <label className="text-xs uppercase tracking-wider text-white/50 font-medium ml-1">
                  {field.label || field.name || `Field ${index + 1}`}
                  {field.required ? " *" : ""}
                </label>
              ) : null}
              {renderDynamicField(field, index)}
            </div>
          ))
        )}

        {errorMessage ? (
          <p className="text-sm text-rose-300">{errorMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={
            isFormMissing ||
            formFieldsQuery.isError ||
            registerSoloMutation.isPending ||
            registerTeamMutation.isPending ||
            submitMemberFormMutation.isPending ||
            sendTeamInviteMutation.isPending ||
            checkoutRedirecting
          }
          className="mt-2 w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {checkoutRedirecting ? (
            "Redirecting To Secure Payment..."
          ) : registerSoloMutation.isPending ||
            registerTeamMutation.isPending ||
            submitMemberFormMutation.isPending ||
            sendTeamInviteMutation.isPending ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : isFormMissing || formFieldsQuery.isError ? (
            "Registration Unavailable"
          ) : (
            "Submit Registration"
          )}
        </button>
      </form>
    </motion.div>
  );
}
