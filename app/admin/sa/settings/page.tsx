"use client";

import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  Settings,
  Lock,
  PauseCircle,
  Database,
  RefreshCw,
  Mail,
  Send,
  Clock3,
  Ban,
  RotateCcw,
  Megaphone,
  FlaskConical,
  WandSparkles,
} from "lucide-react";
import {
  useEmailTemplate,
  useEmailTemplates,
  useFreezeAllChanges,
  usePauseAllRegistrations,
  usePlatformSettingsSummary,
  useResetEmailTemplate,
  useTriggerDbBackup,
  useUpdateEmailTemplate,
} from "@/src/hooks/api/usePlatformSettings";
import {
  useCampaignMetadata,
  useCampaigns,
  useCampaignDetail,
  useCampaignRecipients,
  useCreateCampaign,
  usePreviewCampaignTemplate,
  useSendCampaignNow,
  useScheduleCampaign,
  useRetryFailedCampaign,
  useRerunCampaign,
  useCancelCampaign,
} from "@/src/hooks/api/useCampaigns";
import { useUsers } from "@/src/hooks/api/useUsers";
import { useDepartments } from "@/src/hooks/api/useDepartments";
import { useCompetitions } from "@/src/hooks/api/useCompetitions";
import {
  toDateTimeLocalInput,
  toIsoFromDateTimeLocal,
} from "@/src/lib/datetime";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const PENDING_CAMPAIGN_STATUSES = new Set([
  "DRAFT",
  "SCHEDULED",
  "QUEUED",
  "SENDING",
  "FAILED",
  "PARTIAL",
]);

const SENDABLE_CAMPAIGN_STATUSES = new Set(["DRAFT", "SCHEDULED", "FAILED"]);

const CAMPAIGN_STATUS_COLORS: any = {
  DRAFT: "#fbbf24",
  SCHEDULED: "#60a5fa",
  QUEUED: "#a78bfa",
  SENDING: "#38bdf8",
  PARTIAL: "#f59e0b",
  FAILED: "#f87171",
  COMPLETED: "#4ade80",
  CANCELLED: "#9ca3af",
};

const ROLE_OPTIONS = ["USER", "VOLUNTEER", "JUDGE", "DH", "BOARD", "SA"];

const CAMPAIGN_CREATION_STEPS = [
  { key: "basics", label: "Basics" },
  { key: "audience", label: "Audience" },
  { key: "template", label: "Template" },
  { key: "review", label: "Review" },
];

const toTitle = (text: any) =>
  text
    .split(/[_-]/g)
    .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getSampleValue = (key: any) => {
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("url") || lowerKey.includes("link")) {
    return "https://example.com/path";
  }

  if (lowerKey.includes("name")) {
    return toTitle(key);
  }

  if (lowerKey.includes("time") || lowerKey.includes("date")) {
    return new Date().toISOString();
  }

  if (lowerKey.includes("ip")) {
    return "127.0.0.1";
  }

  return `Sample ${toTitle(key)}`;
};

const formatHtml = (source = "") => {
  if (!source) return "";

  const compact = source.replace(/>\s+</g, "><").trim();
  const tokens = compact.split(/(<[^>]+>)/g).filter(Boolean);
  const lines = [];
  let depth = 0;

  const shouldIncreaseDepth = (token: any) => {
    return (
      /^<[^/!][^>]*>$/.test(token) &&
      !token.endsWith("/>") &&
      !/^<(br|hr|img|input|meta|link)\b/i.test(token)
    );
  };

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;

    if (/^<\//.test(token)) {
      depth = Math.max(depth - 1, 0);
      lines.push(`${"  ".repeat(depth)}${token}`);
      continue;
    }

    if (/^</.test(token)) {
      lines.push(`${"  ".repeat(depth)}${token}`);
      if (shouldIncreaseDepth(token)) {
        depth += 1;
      }
      continue;
    }

    lines.push(`${"  ".repeat(depth)}${token}`);
  }

  return lines.join("\n");
};

const applyVariables = (template = "", variables: any = {}) => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: any) => {
    const value: any = variables[key];
    return value === undefined || value === null ? "" : String(value);
  });
};

const parseCsvEmailsText = (value = "") => {
  return value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const toDateTimeLocalValue = (dateValue: any) => {
  return toDateTimeLocalInput(dateValue);
};

const renderCampaignStatusPill = (status: any) => {
  const color = CAMPAIGN_STATUS_COLORS[status] || "rgba(255,255,255,0.5)";

  return (
    <Box
      component="span"
      sx={{
        px: 1.2,
        py: 0.35,
        borderRadius: "6px",
        border: `1px solid ${color}44`,
        color,
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.08em",
      }}
    >
      {status}
    </Box>
  );
};

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState("platform");

  const {
    data: summary,
    refetch: refetchSummary,
    isFetching: fetchingSummary,
  } = usePlatformSettingsSummary();
  const { data: templates = [], refetch: refetchTemplates } =
    useEmailTemplates();

  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const effectiveTemplateKey: any =
    selectedTemplateKey || templates[0]?.key || null;
  const { data: selectedTemplate }: any =
    useEmailTemplate(effectiveTemplateKey);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [testDataText, setTestDataText] = useState("{}");

  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignTemplateHtml, setCampaignTemplateHtml] = useState("");
  const [campaignAudienceType, setCampaignAudienceType] = useState("FILTER");
  const [campaignRoles, setCampaignRoles] = useState<any>([]);
  const [campaignDepartmentIds, setCampaignDepartmentIds] = useState<any>([]);
  const [campaignUserIds, setCampaignUserIds] = useState<any>([]);
  const [campaignCompetitionId, setCampaignCompetitionId] = useState("");
  const [campaignCsvEmailsText, setCampaignCsvEmailsText] = useState("");
  const [campaignCsvFile, setCampaignCsvFile] = useState<any>(null);
  const [campaignScheduledAt, setCampaignScheduledAt] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<any>(null);
  const [campaignStepIndex, setCampaignStepIndex] = useState(0);
  const [campaignPreviewHtml, setCampaignPreviewHtml] = useState("");
  const [campaignPreviewError, setCampaignPreviewError] = useState("");

  const { mutate: freezeAllChanges, isPending: freezing } =
    useFreezeAllChanges();
  const { mutate: pauseAllRegistrations, isPending: pausingRegistrations } =
    usePauseAllRegistrations();
  const { mutateAsync: triggerBackup, isPending: backingUp } =
    useTriggerDbBackup();
  const { mutate: updateTemplate, isPending: savingTemplate } =
    useUpdateEmailTemplate();
  const { mutate: resetTemplate, isPending: resettingTemplate } =
    useResetEmailTemplate();

  const { data: campaignMetadata } = useCampaignMetadata();
  const { data: campaignListData } = useCampaigns({
    page: 1,
    limit: 100,
    search: campaignSearch || undefined,
  });
  const { data: selectedCampaignData } = useCampaignDetail(selectedCampaignId);
  const { data: selectedCampaignRecipientsData } = useCampaignRecipients(
    selectedCampaignId,
    {
      page: 1,
      limit: 25,
    },
  );

  const { data: users = [] } = useUsers({ limit: 300 });
  const { data: departments = [] } = useDepartments();
  const { data: competitions = [] } = useCompetitions({ limit: 300 });

  const { mutateAsync: createCampaign, isPending: creatingCampaign } =
    useCreateCampaign();
  const { mutateAsync: previewCampaign, isPending: previewingCampaign } =
    usePreviewCampaignTemplate();
  const { mutateAsync: sendCampaignNow, isPending: sendingCampaign } =
    useSendCampaignNow();
  const { mutateAsync: scheduleCampaign, isPending: schedulingCampaign } =
    useScheduleCampaign();
  const { mutateAsync: retryFailedCampaign, isPending: retryingCampaign } =
    useRetryFailedCampaign();
  const { mutateAsync: rerunCampaign, isPending: rerunningCampaign } =
    useRerunCampaign();
  const { mutateAsync: cancelCampaign, isPending: cancellingCampaign } =
    useCancelCampaign();

  const effectiveSubject = subject || selectedTemplate?.subject || "";
  const effectiveHtml = html || formatHtml(selectedTemplate?.html || "");

  const parsedTestData = useMemo(() => {
    try {
      return {
        value: JSON.parse(testDataText || "{}"),
        error: null,
      };
    } catch (error: any) {
      return {
        value: null,
        error: error.message,
      };
    }
  }, [testDataText]);

  const previewSubject = useMemo(() => {
    if (parsedTestData.error) return effectiveSubject;
    return applyVariables(effectiveSubject, parsedTestData.value || {});
  }, [effectiveSubject, parsedTestData]);

  const previewHtml = useMemo(() => {
    if (parsedTestData.error) return effectiveHtml;
    return applyVariables(effectiveHtml, parsedTestData.value || {});
  }, [effectiveHtml, parsedTestData]);

  const downloadUrl = useMemo(() => {
    if (!summary?.latestBackupFileName) return null;
    return `${API_BASE_URL}/api/v1/sa/platform-settings/backup/${summary.latestBackupFileName}`;
  }, [summary?.latestBackupFileName]);

  const handleFreezeToggle = () => {
    const nextFrozen = !summary?.allChangesFrozen;
    freezeAllChanges(nextFrozen, {
      onSuccess: () => {
        enqueueSnackbar(
          nextFrozen
            ? "All platform changes frozen"
            : "Platform changes unfrozen",
          { variant: "success" },
        );
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || "Failed to update freeze state",
          { variant: "error" },
        );
      },
    });
  };

  const handleRegistrationsToggle = () => {
    const nextPaused = !summary?.allRegistrationsPaused;
    pauseAllRegistrations(nextPaused, {
      onSuccess: () => {
        enqueueSnackbar(
          nextPaused ? "All registrations paused" : "All registrations resumed",
          { variant: "success" },
        );
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message ||
            "Failed to update registration state",
          { variant: "error" },
        );
      },
    });
  };

  const handleBackup = async () => {
    try {
      const backup: any = await triggerBackup();
      enqueueSnackbar(
        `Backup created (${backup.format.toUpperCase()}): ${backup.fileName}`,
        { variant: "success" },
      );
      await refetchSummary();
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to create backup",
        { variant: "error" },
      );
    }
  };

  const handleSaveTemplate = () => {
    if (!effectiveTemplateKey) return;

    updateTemplate(
      {
        templateKey: effectiveTemplateKey,
        subject: effectiveSubject,
        html: effectiveHtml,
      },
      {
        onSuccess: () => {
          enqueueSnackbar("Email template saved", { variant: "success" });
          refetchTemplates();
        },
        onError: (error: any) => {
          enqueueSnackbar(
            error?.response?.data?.message || "Failed to save template",
            { variant: "error" },
          );
        },
      },
    );
  };

  const handleResetTemplate = () => {
    if (!effectiveTemplateKey) return;

    resetTemplate(effectiveTemplateKey, {
      onSuccess: (template) => {
        enqueueSnackbar("Template reset to default", { variant: "success" });
        setSubject(template.subject || "");
        setHtml(template.html || "");
        refetchTemplates();
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || "Failed to reset template",
          { variant: "error" },
        );
      },
    });
  };

  const handleFormatHtml = () => {
    setHtml((prev) => formatHtml(prev));
    enqueueSnackbar("HTML formatted", { variant: "success" });
  };

  const handleGenerateTestScaffold = () => {
    if (!selectedTemplate?.variables?.length) {
      setTestDataText("{}");
      return;
    }

    const scaffold: any = {};
    selectedTemplate.variables.forEach((key: any) => {
      scaffold[key] = getSampleValue(key);
    });
    setTestDataText(JSON.stringify(scaffold, null, 2));
  };

  const allCampaigns = useMemo(
    () => campaignListData?.campaigns || [],
    [campaignListData],
  );

  useEffect(() => {
    if (activeTab !== "campaigns") {
      return;
    }

    if (!campaignTemplateHtml.trim()) {
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const preview: any = await previewCampaign({
          templateHtml: campaignTemplateHtml,
          sampleData: {},
        });

        setCampaignPreviewHtml(preview?.html || "");
        setCampaignPreviewError("");
      } catch (error: any) {
        setCampaignPreviewHtml("");
        setCampaignPreviewError(
          error?.response?.data?.message ||
            "Failed to generate preview from template.",
        );
      }
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [activeTab, campaignTemplateHtml, previewCampaign]);

  const pendingCampaigns = useMemo(
    () =>
      allCampaigns.filter((campaign) =>
        PENDING_CAMPAIGN_STATUSES.has(campaign.status),
      ),
    [allCampaigns],
  );

  const selectedCampaign = selectedCampaignData?.campaign;
  const selectedCampaignRecipients =
    selectedCampaignRecipientsData?.recipients || [];

  const createAudienceQuery = () => {
    if (campaignAudienceType === "FILTER") {
      return {
        roles: campaignRoles,
        departmentIds: campaignDepartmentIds,
        competitionId: campaignCompetitionId || null,
        registrationStatuses: ["APPROVED"],
      };
    }

    if (campaignAudienceType === "INDIVIDUAL") {
      return {
        userIds: campaignUserIds,
      };
    }

    return {
      csvEmails: parseCsvEmailsText(campaignCsvEmailsText),
    };
  };

  const resetCampaignComposer = () => {
    setCampaignName("");
    setCampaignSubject("");
    setCampaignTemplateHtml("");
    setCampaignAudienceType("FILTER");
    setCampaignRoles([]);
    setCampaignDepartmentIds([]);
    setCampaignUserIds([]);
    setCampaignCompetitionId("");
    setCampaignCsvEmailsText("");
    setCampaignCsvFile(null);
    setCampaignScheduledAt("");
    setCampaignStepIndex(0);
    setCampaignPreviewHtml("");
    setCampaignPreviewError("");
  };

  const canProceedCampaignStep = (stepIndex: any) => {
    if (stepIndex === 0) {
      return (
        Boolean(campaignName.trim()) &&
        Boolean(campaignSubject.trim()) &&
        Boolean(campaignAudienceType)
      );
    }

    if (stepIndex === 1) {
      if (campaignAudienceType === "INDIVIDUAL") {
        return campaignUserIds.length > 0;
      }

      if (campaignAudienceType === "CSV") {
        return (
          Boolean(campaignCsvFile) || campaignCsvEmailsText.trim().length > 0
        );
      }

      return true;
    }

    if (stepIndex === 2) {
      return Boolean(campaignTemplateHtml.trim()) && !campaignPreviewError;
    }

    return true;
  };

  const handleNextCampaignStep = () => {
    if (!canProceedCampaignStep(campaignStepIndex)) {
      enqueueSnackbar("Complete required fields before continuing.", {
        variant: "error",
      });
      return;
    }

    setCampaignStepIndex((prev) =>
      Math.min(prev + 1, CAMPAIGN_CREATION_STEPS.length - 1),
    );
  };

  const handlePreviousCampaignStep = () => {
    setCampaignStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleCreateCampaign = async () => {
    try {
      if (
        !campaignName.trim() ||
        !campaignSubject.trim() ||
        !campaignTemplateHtml.trim()
      ) {
        enqueueSnackbar(
          "Campaign name, subject, and template HTML are required.",
          {
            variant: "error",
          },
        );
        return;
      }

      const audienceQuery = createAudienceQuery();
      const scheduledAtIso = toIsoFromDateTimeLocal(campaignScheduledAt);

      if (campaignScheduledAt && !scheduledAtIso) {
        enqueueSnackbar("Choose a valid schedule date and time.", {
          variant: "error",
        });
        return;
      }

      const createdCampaign = await createCampaign({
        name: campaignName.trim(),
        subject: campaignSubject.trim(),
        templateHtml: campaignTemplateHtml,
        audienceType: campaignAudienceType as any,
        audienceQuery,
        csvFile: campaignCsvFile as any,
        scheduledAt: scheduledAtIso,
      });

      enqueueSnackbar("Campaign created successfully.", { variant: "success" });
      setSelectedCampaignId(createdCampaign?.id || null);
      resetCampaignComposer();
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to create campaign.",
        { variant: "error" },
      );
    }
  };

  const handleSendCampaign = async (campaignId: any) => {
    try {
      await sendCampaignNow(campaignId);
      enqueueSnackbar("Campaign queued for sending.", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to send campaign.",
        {
          variant: "error",
        },
      );
    }
  };

  const handleScheduleCampaign = async (campaignId: any, scheduledAt: any) => {
    try {
      if (!scheduledAt) {
        enqueueSnackbar("Choose schedule date/time before scheduling.", {
          variant: "error",
        });
        return;
      }

      const scheduledAtIso = toIsoFromDateTimeLocal(scheduledAt);

      if (!scheduledAtIso) {
        enqueueSnackbar("Choose a valid schedule date/time.", {
          variant: "error",
        });
        return;
      }

      await scheduleCampaign({
        campaignId,
        scheduledAt: scheduledAtIso,
      });

      enqueueSnackbar("Campaign scheduled successfully.", {
        variant: "success",
      });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to schedule campaign.",
        {
          variant: "error",
        },
      );
    }
  };

  const handleCancelCampaign = async (campaignId: any) => {
    try {
      await cancelCampaign(campaignId);
      enqueueSnackbar("Campaign cancelled.", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to cancel campaign.",
        {
          variant: "error",
        },
      );
    }
  };

  const handleRetryFailedCampaign = async (campaignId: any) => {
    try {
      await retryFailedCampaign(campaignId);
      enqueueSnackbar("Failed recipients re-queued.", { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to retry failed recipients.",
        { variant: "error" },
      );
    }
  };

  const handleRerunCampaign = async (campaignId: any) => {
    try {
      await rerunCampaign(campaignId);
      enqueueSnackbar("Campaign re-queued for full rerun.", {
        variant: "success",
      });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to rerun campaign.",
        { variant: "error" },
      );
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 600,
              color: "#f4f4f5",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            Platform Settings
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.03em",
            ml: 0.5,
          }}
        >
          Manage platform-wide controls and email templates. Campaign workflows
          are available in Campaign Manager.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "inline-flex",
          gap: 1,
          p: 0.5,
          borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          mb: 3,
        }}
      >
        {[
          { key: "platform", label: "Platform" },
          { key: "emails", label: "Emails" },
        ].map((tab) => (
          <Box
            key={tab.key}
            component="button"
            onClick={() => setActiveTab(tab.key)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background:
                activeTab === tab.key
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              color:
                activeTab === tab.key ? "#f4f4f5" : "rgba(255,255,255,0.45)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
            }}
          >
            {tab.label}
          </Box>
        ))}
      </Box>

      {activeTab === "platform" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography
              sx={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Current Status
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: "#e4e4e7",
                fontSize: 13,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {summary?.totalCompetitions ?? 0} competitions •{" "}
              {summary?.frozenCompetitions ?? 0} frozen •{" "}
              {summary?.pausedRegistrationsCompetitions ?? 0} registrations
              paused
            </Typography>
            {downloadUrl && (
              <Box
                component="a"
                href={downloadUrl}
                sx={{
                  mt: 1,
                  display: "inline-block",
                  color: "#60a5fa",
                  fontSize: 12,
                  textDecoration: "none",
                  "&:hover": { color: "#93c5fd" },
                }}
              >
                Download latest backup
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            {[
              {
                title: summary?.allChangesFrozen
                  ? "Unfreeze All Changes"
                  : "Freeze All Changes",
                subtitle: "Toggle edit freeze across all competitions",
                icon: Lock,
                onClick: handleFreezeToggle,
                disabled: freezing,
              },
              {
                title: summary?.allRegistrationsPaused
                  ? "Resume All Registrations"
                  : "Pause All Registrations",
                subtitle: "Enable or disable registrations platform-wide",
                icon: PauseCircle,
                onClick: handleRegistrationsToggle,
                disabled: pausingRegistrations,
              },
              {
                title: "Backup Database",
                subtitle: "Create a DB backup file now",
                icon: Database,
                onClick: handleBackup,
                disabled: backingUp,
              },
              {
                title: "Refresh Status",
                subtitle: "Sync latest platform control state",
                icon: RefreshCw,
                onClick: () => refetchSummary(),
                disabled: fetchingSummary,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Box
                  key={action.title}
                  component="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  sx={{
                    textAlign: "left",
                    p: 2,
                    borderRadius: "10px",
                    background: "#0d0d0d",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    opacity: action.disabled ? 0.6 : 1,
                    "&:hover": { borderColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.75,
                    }}
                  >
                    <Icon size={14} color="rgba(255,255,255,0.65)" />
                    <Typography
                      sx={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600 }}
                    >
                      {action.title}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
                  >
                    {action.subtitle}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : activeTab === "emails" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
            gap: 2,
          }}
        >
          <Box
            data-lenis-prevent
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              maxHeight: { lg: "78vh" },
              overflowY: "auto",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <Mail size={14} color="rgba(255,255,255,0.65)" />
              <Typography
                sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}
              >
                Email Templates
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {templates.map((template: any) => (
                <Box
                  key={template.key}
                  component="button"
                  onClick={() => {
                    setSelectedTemplateKey(template.key);
                    setSubject("");
                    setHtml("");

                    const scaffold: any = {};
                    (template.variables || []).forEach((key: any) => {
                      scaffold[key] = getSampleValue(key);
                    });
                    setTestDataText(JSON.stringify(scaffold, null, 2));
                  }}
                  sx={{
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: "8px",
                    border:
                      effectiveTemplateKey === template.key
                        ? "1px solid rgba(255,255,255,0.25)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      effectiveTemplateKey === template.key
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <Typography
                    sx={{ color: "#f4f4f5", fontSize: 13, fontWeight: 600 }}
                  >
                    {template.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {template.key}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 15 }}
              >
                {selectedTemplate?.name || "Select a template"}
              </Typography>
              <Typography
                sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mt: 0.5 }}
              >
                {selectedTemplate?.description || ""}
              </Typography>
              {selectedTemplate?.variables?.length > 0 && (
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.32)",
                    fontSize: 11,
                    mt: 0.75,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Variables: {selectedTemplate.variables.join(", ")}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography
                sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12, mb: 0.75 }}
              >
                Subject
              </Typography>
              <Box
                component="input"
                value={effectiveSubject}
                onChange={(event: any) => setSubject(event.target.value)}
                sx={{
                  width: "100%",
                  px: 1.5,
                  py: 1,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#070707",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </Box>

            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.75,
                }}
              >
                <Typography
                  sx={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}
                >
                  HTML
                </Typography>
                <Box
                  component="button"
                  onClick={handleFormatHtml}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "transparent",
                    color: "rgba(255,255,255,0.7)",
                    borderRadius: "7px",
                    px: 1.25,
                    py: 0.5,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  <WandSparkles size={12} />
                  Format HTML
                </Box>
              </Box>
              <Box
                component="textarea"
                value={effectiveHtml}
                onChange={(event) => setHtml(event.target.value)}
                onBlur={() => setHtml((prev) => formatHtml(prev))}
                rows={16}
                sx={{
                  width: "100%",
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#070707",
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "'DM Mono', monospace",
                  resize: "vertical",
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Box
                component="button"
                onClick={handleSaveTemplate}
                disabled={!effectiveTemplateKey || savingTemplate}
                sx={{
                  border: "none",
                  borderRadius: "8px",
                  px: 2,
                  py: 1,
                  background: "#16a34a",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: !effectiveTemplateKey || savingTemplate ? 0.5 : 1,
                }}
              >
                Save Template
              </Box>
              <Box
                component="button"
                onClick={handleResetTemplate}
                disabled={!effectiveTemplateKey || resettingTemplate}
                sx={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "8px",
                  px: 2,
                  py: 1,
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: !effectiveTemplateKey || resettingTemplate ? 0.5 : 1,
                }}
              >
                Reset to Default
              </Box>
            </Box>

            <Box
              sx={{
                mt: 1,
                p: 2,
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#090909",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <FlaskConical size={13} color="rgba(255,255,255,0.65)" />
                <Typography
                  sx={{ color: "#f4f4f5", fontSize: 13, fontWeight: 600 }}
                >
                  Template Test Utility
                </Typography>
              </Box>

              <Typography
                sx={{ color: "rgba(255,255,255,0.55)", fontSize: 11, mb: 0.75 }}
              >
                Test data (JSON)
              </Typography>
              <Box
                component="textarea"
                value={testDataText}
                onChange={(event) => setTestDataText(event.target.value)}
                rows={6}
                sx={{
                  width: "100%",
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#070707",
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "'DM Mono', monospace",
                  resize: "vertical",
                }}
              />

              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Box
                  component="button"
                  onClick={handleGenerateTestScaffold}
                  sx={{
                    border: "1px solid rgba(255,255,255,0.16)",
                    borderRadius: "7px",
                    px: 1.5,
                    py: 0.65,
                    background: "transparent",
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Generate Sample Data
                </Box>
              </Box>

              {parsedTestData.error ? (
                <Typography sx={{ color: "#f87171", fontSize: 11, mt: 1 }}>
                  Invalid JSON: {parsedTestData.error}
                </Typography>
              ) : (
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Preview Subject
                  </Typography>
                  <Typography
                    sx={{
                      color: "#e4e4e7",
                      fontSize: 12,
                      mb: 1,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {previewSubject}
                  </Typography>

                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Preview HTML
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "#060606",
                      color: "#d4d4d8",
                      fontSize: 12,
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ) : activeTab === "campaigns" ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <Megaphone size={14} color="rgba(255,255,255,0.65)" />
              <Typography
                sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}
              >
                Create Campaign
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 1.25, flexWrap: "wrap" }}>
              {CAMPAIGN_CREATION_STEPS.map((step, index) => (
                <Box
                  key={step.key}
                  sx={{
                    px: 1.35,
                    py: 0.55,
                    borderRadius: "999px",
                    border:
                      campaignStepIndex === index
                        ? "1px solid rgba(255,255,255,0.24)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      campaignStepIndex === index
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    color:
                      campaignStepIndex === index
                        ? "#f4f4f5"
                        : "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  {index + 1}. {step.label}
                </Box>
              ))}
            </Box>

            {campaignStepIndex === 0 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Campaign Name
                  </Typography>
                  <Box
                    component="input"
                    value={campaignName}
                    onChange={(event) => setCampaignName(event.target.value)}
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Email Subject
                  </Typography>
                  <Box
                    component="input"
                    value={campaignSubject}
                    onChange={(event) => setCampaignSubject(event.target.value)}
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Audience Type
                  </Typography>
                  <Box
                    component="select"
                    value={campaignAudienceType}
                    onChange={(event) =>
                      setCampaignAudienceType(event.target.value)
                    }
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {(
                      campaignMetadata?.audienceTypes || [
                        "FILTER",
                        "INDIVIDUAL",
                        "CSV",
                      ]
                    ).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11,
                      mb: 0.5,
                    }}
                  >
                    Schedule (optional)
                  </Typography>
                  <Box
                    component="input"
                    type="datetime-local"
                    value={campaignScheduledAt}
                    onChange={(event) =>
                      setCampaignScheduledAt(event.target.value)
                    }
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </Box>
              </Box>
            )}

            {campaignStepIndex === 1 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                {campaignAudienceType === "FILTER" && (
                  <>
                    <Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 11,
                          mb: 0.5,
                        }}
                      >
                        Roles (multi-select)
                      </Typography>
                      <Box
                        component="select"
                        multiple
                        value={campaignRoles}
                        onChange={(event: any) =>
                          setCampaignRoles(
                            Array.from(
                              event.target.selectedOptions,
                              (option: any) => option.value,
                            ),
                          )
                        }
                        sx={{
                          width: "100%",
                          minHeight: 120,
                          px: 1.25,
                          py: 0.9,
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "#070707",
                          color: "#fff",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Box>
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 11,
                          mb: 0.5,
                        }}
                      >
                        Departments (multi-select)
                      </Typography>
                      <Box
                        component="select"
                        multiple
                        value={campaignDepartmentIds}
                        onChange={(event) =>
                          setCampaignDepartmentIds(
                            Array.from(
                              event.target.selectedOptions,
                              (option) => option.value,
                            ),
                          )
                        }
                        sx={{
                          width: "100%",
                          minHeight: 120,
                          px: 1.25,
                          py: 0.9,
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "#070707",
                          color: "#fff",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 11,
                          mb: 0.5,
                        }}
                      >
                        Competition (optional)
                      </Typography>
                      <Box
                        component="select"
                        value={campaignCompetitionId}
                        onChange={(event) =>
                          setCampaignCompetitionId(event.target.value)
                        }
                        sx={{
                          width: "100%",
                          px: 1.25,
                          py: 0.9,
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "#070707",
                          color: "#fff",
                          fontSize: 13,
                          outline: "none",
                        }}
                      >
                        <option value="">All competitions</option>
                        {competitions.map((competition) => (
                          <option key={competition.id} value={competition.id}>
                            {competition.title}
                          </option>
                        ))}
                      </Box>
                    </Box>
                  </>
                )}

                {campaignAudienceType === "INDIVIDUAL" && (
                  <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 11,
                        mb: 0.5,
                      }}
                    >
                      Users (multi-select)
                    </Typography>
                    <Box
                      component="select"
                      multiple
                      value={campaignUserIds}
                      onChange={(event) =>
                        setCampaignUserIds(
                          Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                          ),
                        )
                      }
                      sx={{
                        width: "100%",
                        minHeight: 180,
                        px: 1.25,
                        py: 0.9,
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "#070707",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                      }}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email} ({user.email})
                        </option>
                      ))}
                    </Box>
                  </Box>
                )}

                {campaignAudienceType === "CSV" && (
                  <>
                    <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 11,
                          mb: 0.5,
                        }}
                      >
                        CSV Emails (comma/newline list)
                      </Typography>
                      <Box
                        component="textarea"
                        value={campaignCsvEmailsText}
                        onChange={(event) =>
                          setCampaignCsvEmailsText(event.target.value)
                        }
                        rows={5}
                        sx={{
                          width: "100%",
                          px: 1.25,
                          py: 1,
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "#070707",
                          color: "#fff",
                          fontSize: 13,
                          outline: "none",
                          resize: "vertical",
                        }}
                      />
                    </Box>

                    <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
                      <Typography
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 11,
                          mb: 0.5,
                        }}
                      >
                        Upload CSV file (optional)
                      </Typography>
                      <Box
                        component="input"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(event: any) =>
                          setCampaignCsvFile(event.target.files?.[0] || null)
                        }
                        sx={{
                          width: "100%",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 12,
                        }}
                      />
                    </Box>
                  </>
                )}
              </Box>
            )}

            {campaignStepIndex === 2 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.25,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 11,
                      }}
                    >
                      Template HTML
                    </Typography>
                    <Box
                      component="button"
                      onClick={() =>
                        setCampaignTemplateHtml((prev) => formatHtml(prev))
                      }
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.6,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "transparent",
                        color: "rgba(255,255,255,0.7)",
                        borderRadius: "7px",
                        px: 1,
                        py: 0.4,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      <WandSparkles size={11} /> Format
                    </Box>
                  </Box>

                  <Box
                    component="textarea"
                    value={campaignTemplateHtml}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setCampaignTemplateHtml(nextValue);

                      if (!nextValue.trim()) {
                        setCampaignPreviewHtml("");
                        setCampaignPreviewError("");
                      }
                    }}
                    rows={16}
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 1,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 12,
                      outline: "none",
                      fontFamily: "'DM Mono', monospace",
                      resize: "vertical",
                    }}
                  />

                  <Typography
                    sx={{
                      mt: 0.75,
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    Allowed variables:{" "}
                    {(campaignMetadata?.allowedVariables || []).join(", ")}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#060606",
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 11,
                      mb: 0.75,
                    }}
                  >
                    Live Preview (auto-updating)
                  </Typography>

                  <Typography
                    sx={{
                      color: "#e4e4e7",
                      fontSize: 13,
                      fontWeight: 600,
                      mb: 0.75,
                    }}
                  >
                    {campaignSubject || "(No subject yet)"}
                  </Typography>

                  {previewingCampaign && (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    >
                      Updating preview…
                    </Typography>
                  )}

                  {campaignPreviewError ? (
                    <Typography sx={{ color: "#f87171", fontSize: 11 }}>
                      {campaignPreviewError}
                    </Typography>
                  ) : (
                    <Box
                      sx={{ color: "#d4d4d8", fontSize: 12 }}
                      dangerouslySetInnerHTML={{
                        __html:
                          campaignPreviewHtml ||
                          "<p style='opacity:0.7'>Start typing HTML to see preview.</p>",
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}

            {campaignStepIndex === 3 && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.2,
                }}
              >
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#080808",
                  }}
                >
                  <Typography sx={{ color: "#f4f4f5", fontSize: 12, mb: 0.45 }}>
                    Campaign Name
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    {campaignName || "-"}
                  </Typography>

                  <Typography
                    sx={{ color: "#f4f4f5", fontSize: 12, mt: 1, mb: 0.45 }}
                  >
                    Subject
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    {campaignSubject || "-"}
                  </Typography>

                  <Typography
                    sx={{ color: "#f4f4f5", fontSize: 12, mt: 1, mb: 0.45 }}
                  >
                    Audience Type
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    {campaignAudienceType}
                  </Typography>

                  <Typography
                    sx={{ color: "#f4f4f5", fontSize: 12, mt: 1, mb: 0.45 }}
                  >
                    Scheduled At
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    {campaignScheduledAt
                      ? new Date(campaignScheduledAt).toLocaleString()
                      : "Send immediately / manual"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#080808",
                  }}
                >
                  <Typography sx={{ color: "#f4f4f5", fontSize: 12, mb: 0.45 }}>
                    Audience Summary
                  </Typography>
                  {campaignAudienceType === "FILTER" && (
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      Roles:{" "}
                      {campaignRoles.length ? campaignRoles.join(", ") : "Any"}
                      <br />
                      Departments: {campaignDepartmentIds.length || "Any"}
                      <br />
                      Competition: {campaignCompetitionId || "Any"}
                    </Typography>
                  )}
                  {campaignAudienceType === "INDIVIDUAL" && (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                    >
                      Selected users: {campaignUserIds.length}
                    </Typography>
                  )}
                  {campaignAudienceType === "CSV" && (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                    >
                      CSV inline emails:{" "}
                      {parseCsvEmailsText(campaignCsvEmailsText).length}
                      <br />
                      CSV file: {campaignCsvFile?.name || "Not attached"}
                    </Typography>
                  )}

                  <Typography
                    sx={{ color: "#f4f4f5", fontSize: 12, mt: 1.1, mb: 0.45 }}
                  >
                    Template
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}
                  >
                    {campaignTemplateHtml.trim()
                      ? `${campaignTemplateHtml.trim().length} characters`
                      : "No template"}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              <Box
                component="button"
                onClick={handlePreviousCampaignStep}
                disabled={campaignStepIndex === 0}
                sx={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.9,
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  cursor: "pointer",
                  opacity: campaignStepIndex === 0 ? 0.5 : 1,
                }}
              >
                Back
              </Box>

              {campaignStepIndex < CAMPAIGN_CREATION_STEPS.length - 1 ? (
                <Box
                  component="button"
                  onClick={handleNextCampaignStep}
                  sx={{
                    border: "none",
                    borderRadius: "8px",
                    px: 2,
                    py: 0.9,
                    background: "#a855f7",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.7,
                    "&:hover": {
                      background: "#9333ea",
                    },
                  }}
                >
                  Next
                </Box>
              ) : (
                <Box
                  component="button"
                  onClick={handleCreateCampaign}
                  disabled={creatingCampaign}
                  sx={{
                    border: "none",
                    borderRadius: "8px",
                    px: 2,
                    py: 0.9,
                    background: "#a855f7",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: creatingCampaign ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.7,
                    "&:hover": {
                      background: creatingCampaign ? "#a855f7" : "#9333ea",
                    },
                  }}
                >
                  Create Campaign
                  {creatingCampaign && (
                    <CircularProgress size={12} sx={{ color: "#fff" }} />
                  )}
                </Box>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}
              >
                Campaigns
              </Typography>
              <Box
                component="input"
                placeholder="Search campaigns"
                value={campaignSearch}
                onChange={(event) => setCampaignSearch(event.target.value)}
                sx={{
                  width: { xs: "100%", md: 260 },
                  px: 1.25,
                  py: 0.85,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#070707",
                  color: "#fff",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
              {allCampaigns.map((campaign) => (
                <Box
                  key={campaign.id}
                  component="button"
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  sx={{
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: "8px",
                    border:
                      selectedCampaignId === campaign.id
                        ? "1px solid rgba(255,255,255,0.24)"
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      selectedCampaignId === campaign.id
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{ color: "#f4f4f5", fontSize: 13, fontWeight: 600 }}
                    >
                      {campaign.name}
                    </Typography>
                    {renderCampaignStatusPill(campaign.status)}
                  </Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 11,
                      mt: 0.5,
                    }}
                  >
                    {campaign.subject}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 10,
                      mt: 0.5,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    total {campaign.totalRecipients} • queued{" "}
                    {campaign.queuedRecipients} • sent {campaign.sentRecipients}{" "}
                    • failed {campaign.failedRecipients}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {selectedCampaign && (
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}
                  >
                    {selectedCampaign.name}
                  </Typography>
                  {renderCampaignStatusPill(selectedCampaign.status)}
                </Box>

                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  <Box
                    component="button"
                    onClick={() => handleSendCampaign(selectedCampaign.id)}
                    disabled={
                      !SENDABLE_CAMPAIGN_STATUSES.has(
                        selectedCampaign.status,
                      ) || sendingCampaign
                    }
                    sx={{
                      border: "none",
                      borderRadius: "7px",
                      px: 1.25,
                      py: 0.65,
                      background: "#2563eb",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity:
                        !SENDABLE_CAMPAIGN_STATUSES.has(
                          selectedCampaign.status,
                        ) || sendingCampaign
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Send size={12} /> Send Now
                  </Box>

                  <Box
                    component="button"
                    onClick={() =>
                      handleScheduleCampaign(
                        selectedCampaign.id,
                        toDateTimeLocalValue(selectedCampaign.scheduledAt) ||
                          campaignScheduledAt,
                      )
                    }
                    disabled={schedulingCampaign}
                    sx={{
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: "7px",
                      px: 1.25,
                      py: 0.65,
                      background: "transparent",
                      color: "rgba(255,255,255,0.8)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity: schedulingCampaign ? 0.5 : 1,
                    }}
                  >
                    <Clock3 size={12} /> Schedule
                  </Box>

                  <Box
                    component="button"
                    onClick={() =>
                      handleRetryFailedCampaign(selectedCampaign.id)
                    }
                    disabled={
                      Number(selectedCampaign.failedRecipients || 0) <= 0 ||
                      retryingCampaign
                    }
                    sx={{
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: "7px",
                      px: 1.25,
                      py: 0.65,
                      background: "transparent",
                      color: "rgba(255,255,255,0.8)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity:
                        Number(selectedCampaign.failedRecipients || 0) <= 0 ||
                        retryingCampaign
                          ? 0.5
                          : 1,
                    }}
                  >
                    <RotateCcw size={12} /> Retry Failed
                  </Box>

                  <Box
                    component="button"
                    onClick={() => handleRerunCampaign(selectedCampaign.id)}
                    disabled={
                      !["FAILED", "PARTIAL", "COMPLETED", "CANCELLED"].includes(
                        selectedCampaign.status,
                      ) || rerunningCampaign
                    }
                    sx={{
                      border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: "7px",
                      px: 1.25,
                      py: 0.65,
                      background: "transparent",
                      color: "rgba(255,255,255,0.8)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity:
                        ![
                          "FAILED",
                          "PARTIAL",
                          "COMPLETED",
                          "CANCELLED",
                        ].includes(selectedCampaign.status) || rerunningCampaign
                          ? 0.5
                          : 1,
                    }}
                  >
                    <RefreshCw size={12} /> Rerun Campaign
                  </Box>

                  <Box
                    component="button"
                    onClick={() => handleCancelCampaign(selectedCampaign.id)}
                    disabled={
                      ["COMPLETED", "CANCELLED"].includes(
                        selectedCampaign.status,
                      ) || cancellingCampaign
                    }
                    sx={{
                      border: "1px solid rgba(248,113,113,0.3)",
                      borderRadius: "7px",
                      px: 1.25,
                      py: 0.65,
                      background: "transparent",
                      color: "#f87171",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      fontSize: 11,
                      cursor: "pointer",
                      opacity:
                        ["COMPLETED", "CANCELLED"].includes(
                          selectedCampaign.status,
                        ) || cancellingCampaign
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Ban size={12} /> Cancel
                  </Box>
                </Box>
              </Box>

              <Typography
                sx={{ color: "rgba(255,255,255,0.42)", fontSize: 11, mb: 1.2 }}
              >
                {selectedCampaign.subject}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1,
                  mb: 1.2,
                }}
              >
                {[
                  ["Total", selectedCampaign.totalRecipients || 0],
                  ["Queued", selectedCampaign.queuedRecipients || 0],
                  ["Sent", selectedCampaign.sentRecipients || 0],
                  ["Failed", selectedCampaign.failedRecipients || 0],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      p: 1.2,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "#0a0a0a",
                    }}
                  >
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{ color: "#f4f4f5", fontSize: 16, fontWeight: 600 }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography
                sx={{
                  color: "#f4f4f5",
                  fontSize: 12,
                  fontWeight: 600,
                  mb: 0.75,
                }}
              >
                Recipients (latest)
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.65 }}
              >
                {selectedCampaignRecipients.map((recipient) => (
                  <Box
                    key={recipient.id}
                    sx={{
                      p: 1,
                      borderRadius: "7px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "#080808",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={{ color: "#e4e4e7", fontSize: 12 }}>
                        {recipient.name || "Unknown"} ({recipient.email})
                      </Typography>
                      {!!recipient.lastError && (
                        <Typography
                          sx={{ color: "#f87171", fontSize: 10, mt: 0.2 }}
                        >
                          {recipient.lastError}
                        </Typography>
                      )}
                    </Box>
                    {renderCampaignStatusPill(recipient.status)}
                  </Box>
                ))}
                {!selectedCampaignRecipients.length && (
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
                  >
                    No recipients found for this campaign.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
            <Clock3 size={14} color="rgba(255,255,255,0.65)" />
            <Typography
              sx={{ color: "#f4f4f5", fontWeight: 600, fontSize: 14 }}
            >
              Pending Campaigns
            </Typography>
          </Box>

          <Typography
            sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12, mb: 1.2 }}
          >
            Campaigns that still need action or are in-progress.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
            {pendingCampaigns.map((campaign) => (
              <Box
                key={campaign.id}
                sx={{
                  p: 1.25,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#080808",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{ color: "#f4f4f5", fontSize: 13, fontWeight: 600 }}
                    >
                      {campaign.name}
                    </Typography>
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    >
                      {campaign.subject}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flexWrap: "wrap",
                    }}
                  >
                    {renderCampaignStatusPill(campaign.status)}

                    {SENDABLE_CAMPAIGN_STATUSES.has(campaign.status) && (
                      <Box
                        component="button"
                        onClick={() => handleSendCampaign(campaign.id)}
                        sx={{
                          border: "none",
                          borderRadius: "6px",
                          px: 1,
                          py: 0.5,
                          background: "#2563eb",
                          color: "#fff",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.4,
                        }}
                      >
                        <Send size={11} /> Send
                      </Box>
                    )}

                    {Number(campaign.failedRecipients || 0) > 0 && (
                      <Box
                        component="button"
                        onClick={() => handleRetryFailedCampaign(campaign.id)}
                        sx={{
                          border: "1px solid rgba(255,255,255,0.16)",
                          borderRadius: "6px",
                          px: 1,
                          py: 0.5,
                          background: "transparent",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.4,
                        }}
                      >
                        <RotateCcw size={11} /> Retry
                      </Box>
                    )}

                    {!["COMPLETED", "CANCELLED"].includes(campaign.status) && (
                      <Box
                        component="button"
                        onClick={() => handleCancelCampaign(campaign.id)}
                        sx={{
                          border: "1px solid rgba(248,113,113,0.35)",
                          borderRadius: "6px",
                          px: 1,
                          py: 0.5,
                          background: "transparent",
                          color: "#f87171",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.4,
                        }}
                      >
                        <Ban size={11} /> Cancel
                      </Box>
                    )}
                  </Box>
                </Box>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 10,
                    mt: 0.65,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  total {campaign.totalRecipients} • queued{" "}
                  {campaign.queuedRecipients} • sent {campaign.sentRecipients} •
                  failed {campaign.failedRecipients}
                </Typography>
              </Box>
            ))}

            {!pendingCampaigns.length && (
              <Typography
                sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
              >
                No pending campaigns.
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
