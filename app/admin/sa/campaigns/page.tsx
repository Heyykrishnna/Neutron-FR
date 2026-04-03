"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import {
  ArrowLeft,
  Ban,
  Check,
  Clock3,
  Megaphone,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  WandSparkles,
} from "lucide-react";
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

const ROLE_OPTIONS = ["USER", "VOLUNTEER", "JUDGE", "DH", "BOARD", "SA"];

const CREATE_STEPS = [
  { key: 1, label: "Basics" },
  { key: 2, label: "Audience" },
  { key: 3, label: "Template" },
  { key: 4, label: "Review" },
];

const STATUS_COLORS: any = {
  DRAFT: "#fbbf24",
  SCHEDULED: "#60a5fa",
  QUEUED: "#a78bfa",
  SENDING: "#38bdf8",
  PARTIAL: "#f59e0b",
  FAILED: "#f87171",
  COMPLETED: "#4ade80",
  CANCELLED: "#9ca3af",
};

const TRANSIENT_CAMPAIGN_STATUSES = new Set(["QUEUED", "SENDING", "SCHEDULED"]);
const PAST_CAMPAIGN_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "PARTIAL",
  "CANCELLED",
]);
const SENDABLE_CAMPAIGN_STATUSES = new Set(["DRAFT", "SCHEDULED", "FAILED"]);
const RERUNABLE_CAMPAIGN_STATUSES = new Set([
  "FAILED",
  "PARTIAL",
  "COMPLETED",
  "CANCELLED",
]);

const parseCsvEmailsText = (value = "") =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const toDateTimeLocalValue = (dateValue: any) => {
  return toDateTimeLocalInput(dateValue);
};

const formatDateTime = (value: any) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const toIsoOrNull = (dateTimeLocal: any) => {
  return toIsoFromDateTimeLocal(dateTimeLocal);
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

const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

const inputSx = {
  width: "100%",
  px: 1.25,
  py: 0.9,
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#070707",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  fontFamily: "'Syne', sans-serif",
  boxSizing: "border-box",
};

function SectionCard({ title, description, children }: any) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "10px",
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography sx={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            mt: 0.35,
            mb: 1.25,
          }}
        >
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
}

function StatusPill({ status }: any) {
  const color = STATUS_COLORS[status] || "rgba(255,255,255,0.5)";
  return (
    <Box
      component="span"
      sx={{
        px: 1.1,
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
}

export default function CampaignManagerPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [mode, setMode] = useState("list");
  const [listTab, setListTab] = useState("past");
  const [step, setStep] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState<any>(null);
  const [selectedCampaignScheduleAt, setSelectedCampaignScheduleAt] =
    useState("");
  const [actionByCampaignId, setActionByCampaignId] = useState<any>({});
  const [isReconciling, setIsReconciling] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignAudienceType, setCampaignAudienceType] = useState("FILTER");
  const [campaignRoles, setCampaignRoles] = useState<string[]>([]);
  const [campaignDepartmentIds, setCampaignDepartmentIds] = useState<string[]>(
    [],
  );
  const [campaignUserIds, setCampaignUserIds] = useState<string[]>([]);
  const [campaignCompetitionId, setCampaignCompetitionId] = useState("");
  const [campaignCsvEmailsText, setCampaignCsvEmailsText] = useState("");
  const [campaignCsvFile, setCampaignCsvFile] = useState<File | null>(null);
  const [campaignTemplateHtml, setCampaignTemplateHtml] = useState("");
  const [campaignScheduledAt, setCampaignScheduledAt] = useState("");
  const [campaignPreviewHtml, setCampaignPreviewHtml] = useState("");
  const [campaignPreviewError, setCampaignPreviewError] = useState("");

  const { data: campaignMetadata } = useCampaignMetadata();
  const {
    data: campaignListData,
    isFetching: fetchingCampaigns,
    refetch: refetchCampaigns,
  } = useCampaigns(
    { page: 1, limit: 100 },
    {
      refetchInterval: (query: any) => {
        const list = query.state.data?.campaigns || [];
        return list.some((campaign: any) =>
          TRANSIENT_CAMPAIGN_STATUSES.has(campaign.status),
        )
          ? 5000
          : false;
      },
      refetchIntervalInBackground: true,
    },
  );

  const {
    data: selectedCampaignData,
    isFetching: fetchingCampaignDetail,
    refetch: refetchCampaignDetail,
  } = useCampaignDetail(selectedCampaignId, {
    refetchInterval: selectedCampaignId ? 5000 : false,
    refetchIntervalInBackground: true,
  }) as any;

  const {
    data: selectedCampaignRecipientsData,
    isFetching: fetchingRecipients,
    refetch: refetchCampaignRecipients,
  } = useCampaignRecipients(
    selectedCampaignId,
    { page: 1, limit: 25 },
    {
      refetchInterval: selectedCampaignId ? 5000 : false,
      refetchIntervalInBackground: true,
    },
  ) as any;

  const { data: users = [] } = useUsers({ limit: 300 });
  const { data: departments = [] } = useDepartments();
  const { data: competitions = [] } = useCompetitions({ limit: 300 });

  const { mutateAsync: previewCampaign, isPending: previewingCampaign } =
    usePreviewCampaignTemplate();
  const { mutateAsync: createCampaign, isPending: creatingCampaign } =
    useCreateCampaign();
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

  const hasAnyMutationPending =
    sendingCampaign ||
    schedulingCampaign ||
    retryingCampaign ||
    rerunningCampaign ||
    cancellingCampaign;

  const allCampaigns = useMemo(
    () => campaignListData?.campaigns || [],
    [campaignListData],
  );

  const pastRuns = useMemo(
    () =>
      allCampaigns.filter((campaign) =>
        PAST_CAMPAIGN_STATUSES.has(campaign.status),
      ),
    [allCampaigns],
  );

  const pendingRuns = useMemo(
    () =>
      allCampaigns.filter(
        (campaign) => !PAST_CAMPAIGN_STATUSES.has(campaign.status),
      ),
    [allCampaigns],
  );

  const visibleCampaigns = listTab === "past" ? pastRuns : pendingRuns;
  const selectedCampaign = selectedCampaignData?.campaign || null;
  const selectedCampaignRecipients =
    selectedCampaignRecipientsData?.recipients || [];

  useEffect(() => {
    if (!selectedCampaignId && visibleCampaigns.length) {
      setSelectedCampaignId(visibleCampaigns[0].id);
    }
  }, [selectedCampaignId, visibleCampaigns]);

  useEffect(() => {
    const exists = visibleCampaigns.some(
      (campaign) => campaign.id === selectedCampaignId,
    );
    if (selectedCampaignId && !exists) {
      setSelectedCampaignId(visibleCampaigns[0]?.id || null);
    }
  }, [selectedCampaignId, visibleCampaigns]);

  useEffect(() => {
    setSelectedCampaignScheduleAt(
      toDateTimeLocalValue(selectedCampaign?.scheduledAt),
    );
  }, [selectedCampaign?.scheduledAt]);

  useEffect(() => {
    if (!campaignTemplateHtml.trim()) {
      setCampaignPreviewHtml("");
      setCampaignPreviewError("");
      return;
    }

    const timer = setTimeout(async () => {
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
          error?.response?.data?.message || "Preview generation failed.",
        );
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [campaignTemplateHtml, previewCampaign]);

  const lockCampaignAction = ({ campaignId, action }: any) => {
    setActionByCampaignId((prev: any) => ({ ...prev, [campaignId]: action }));
  };

  const unlockCampaignAction = (campaignId: any) => {
    setActionByCampaignId((prev: any) => {
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
  };

  const isCampaignActionLocked = (campaignId: any) => {
    return Boolean(actionByCampaignId[campaignId]) || hasAnyMutationPending;
  };

  const reconcileCampaignState = async (campaignId: any, rounds = 3) => {
    setIsReconciling(true);
    try {
      for (let attempt = 0; attempt < rounds; attempt += 1) {
        const tasks = [refetchCampaigns()];

        if (campaignId) {
          tasks.push(refetchCampaignDetail());
          tasks.push(refetchCampaignRecipients());
        }

        const results = await Promise.all(tasks);
        const detailData: any = campaignId ? results[1]?.data : null;
        const status = detailData?.campaign?.status;

        if (!status || !TRANSIENT_CAMPAIGN_STATUSES.has(status)) {
          break;
        }

        if (attempt < rounds - 1) {
          await sleep(1000);
        }
      }
    } finally {
      setIsReconciling(false);
    }
  };

  const runCampaignAction = async ({
    campaignId,
    action,
    actionFn,
    successMessage,
    rounds = 3,
  }: any) => {
    if (!campaignId) return;

    lockCampaignAction({ campaignId, action });
    try {
      await actionFn();
      await reconcileCampaignState(campaignId, rounds);
      enqueueSnackbar(successMessage, { variant: "success" });
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Campaign action failed.",
        { variant: "error" },
      );
    } finally {
      unlockCampaignAction(campaignId);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setCampaignSubject("");
    setCampaignAudienceType("FILTER");
    setCampaignRoles([]);
    setCampaignDepartmentIds([]);
    setCampaignUserIds([]);
    setCampaignCompetitionId("");
    setCampaignCsvEmailsText("");
    setCampaignCsvFile(null);
    setCampaignTemplateHtml("");
    setCampaignScheduledAt("");
    setCampaignPreviewHtml("");
    setCampaignPreviewError("");
    setStep(1);
  };

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
      return { userIds: campaignUserIds };
    }

    return { csvEmails: parseCsvEmailsText(campaignCsvEmailsText) };
  };

  const validateStep = (targetStep = step) => {
    if (targetStep === 1) {
      if (!campaignName.trim() || !campaignSubject.trim()) {
        enqueueSnackbar("Campaign name and subject are required.", {
          variant: "error",
        });
        return false;
      }
    }

    if (targetStep === 2) {
      if (campaignAudienceType === "FILTER" && !campaignRoles.length) {
        enqueueSnackbar("Select at least one role for filter audience.", {
          variant: "error",
        });
        return false;
      }

      if (campaignAudienceType === "INDIVIDUAL" && !campaignUserIds.length) {
        enqueueSnackbar("Select at least one user.", { variant: "error" });
        return false;
      }

      if (
        campaignAudienceType === "CSV" &&
        !campaignCsvFile &&
        parseCsvEmailsText(campaignCsvEmailsText).length === 0
      ) {
        enqueueSnackbar("Provide CSV emails text or upload a CSV file.", {
          variant: "error",
        });
        return false;
      }
    }

    if (targetStep === 3 && !campaignTemplateHtml.trim()) {
      enqueueSnackbar("Template HTML is required.", { variant: "error" });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCreateCampaign = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    try {
      const created = await createCampaign({
        name: campaignName.trim(),
        subject: campaignSubject.trim(),
        templateHtml: campaignTemplateHtml,
        audienceType: campaignAudienceType as any,
        audienceQuery: createAudienceQuery(),
        csvFile: campaignCsvFile as any,
        scheduledAt: toIsoOrNull(campaignScheduledAt),
      });

      enqueueSnackbar("Campaign created successfully.", { variant: "success" });
      resetForm();
      setMode("list");
      setListTab("pending");
      setSelectedCampaignId(created?.id || null);
      await reconcileCampaignState(created?.id || null, 2);
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to create campaign.",
        { variant: "error" },
      );
    }
  };

  if (mode === "list") {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400 }}>
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
            <Megaphone size={15} color="rgba(255,255,255,0.7)" />
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
            Campaign Manager
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.03em",
            }}
          >
            Default view shows past runs. Switch to pending to manage drafts and
            unsent campaigns.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="button"
              onClick={() => reconcileCampaignState(selectedCampaignId, 2)}
              disabled={isReconciling}
              sx={{
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "8px",
                px: 1.2,
                py: 0.75,
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.55,
                opacity: isReconciling ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} /> Sync
            </Box>

            <Box
              component="button"
              onClick={() => setMode("create")}
              sx={{
                border: "none",
                borderRadius: "8px",
                px: 1.5,
                py: 0.85,
                background: "#a855f7",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
              }}
            >
              <Plus size={13} /> Create New
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "inline-flex",
            gap: 1,
            p: 0.5,
            mb: 2,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {[
            { key: "past", label: "Past Runs" },
            { key: "pending", label: "Pending / Drafts" },
          ].map((tab) => (
            <Box
              key={tab.key}
              component="button"
              onClick={() => setListTab(tab.key)}
              sx={{
                px: 1.8,
                py: 0.8,
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background:
                  listTab === tab.key
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                color:
                  listTab === tab.key ? "#f4f4f5" : "rgba(255,255,255,0.45)",
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
              }}
            >
              {tab.label}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "420px 1fr" },
            gap: 2,
          }}
        >
          <SectionCard
            title={
              listTab === "past" ? "Past Runs" : "Pending / Draft Campaigns"
            }
            description="Click a campaign to view details and actions."
          >
            {fetchingCampaigns ? (
              <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={20} sx={{ color: "#a855f7" }} />
              </Box>
            ) : !visibleCampaigns.length ? (
              <Typography
                sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
              >
                No campaigns found in this section.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1 }}>
                {visibleCampaigns.map((campaign) => (
                  <Box
                    key={campaign.id}
                    component="button"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                    sx={{
                      width: "100%",
                      textAlign: "left",
                      p: 1.4,
                      borderRadius: "8px",
                      border:
                        selectedCampaignId === campaign.id
                          ? "1px solid rgba(255,255,255,0.24)"
                          : "1px solid rgba(255,255,255,0.08)",
                      background:
                        selectedCampaignId === campaign.id
                          ? "rgba(255,255,255,0.06)"
                          : "#080808",
                      cursor: "pointer",
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
                      <Typography
                        sx={{ color: "#f4f4f5", fontSize: 13, fontWeight: 600 }}
                      >
                        {campaign.name}
                      </Typography>
                      <StatusPill status={campaign.status} />
                    </Box>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 11,
                        mt: 0.4,
                      }}
                    >
                      {campaign.subject}
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.34)",
                        fontSize: 10,
                        mt: 0.6,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      total {campaign.totalRecipients || 0} • queued{" "}
                      {campaign.queuedRecipients || 0} • sent{" "}
                      {campaign.sentRecipients || 0} • failed{" "}
                      {campaign.failedRecipients || 0}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>

          <SectionCard
            title={
              selectedCampaign ? selectedCampaign.name : "Campaign Details"
            }
            description={
              selectedCampaign
                ? "View campaign delivery status and run actions."
                : "Select a campaign from the left to view details."
            }
          >
            {!selectedCampaign ? (
              <Typography
                sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
              >
                No campaign selected.
              </Typography>
            ) : (
              <>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <StatusPill status={selectedCampaign.status} />
                  {(fetchingCampaignDetail || fetchingRecipients) && (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.42)", fontSize: 11 }}
                    >
                      Syncing...
                    </Typography>
                  )}
                </Box>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 11,
                    mb: 1.2,
                  }}
                >
                  {selectedCampaign.subject}
                </Typography>

                <Box sx={{ mb: 1.2, maxWidth: 300 }}>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      mb: 0.4,
                    }}
                  >
                    Schedule Date / Time
                  </Typography>
                  <Box
                    component="input"
                    type="datetime-local"
                    value={selectedCampaignScheduleAt}
                    onChange={(event) =>
                      setSelectedCampaignScheduleAt(event.target.value)
                    }
                    sx={inputSx}
                  />
                </Box>

                <Box
                  sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.4 }}
                >
                  <Box
                    component="button"
                    onClick={() =>
                      runCampaignAction({
                        campaignId: selectedCampaign.id,
                        action: "send",
                        actionFn: () => sendCampaignNow(selectedCampaign.id),
                        successMessage: "Campaign queued for sending.",
                      })
                    }
                    disabled={
                      !SENDABLE_CAMPAIGN_STATUSES.has(
                        selectedCampaign.status,
                      ) || isCampaignActionLocked(selectedCampaign.id)
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
                        ) || isCampaignActionLocked(selectedCampaign.id)
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Send size={12} /> Send Now
                  </Box>

                  <Box
                    component="button"
                    onClick={() => {
                      if (!selectedCampaignScheduleAt) {
                        enqueueSnackbar("Choose a schedule time first.", {
                          variant: "error",
                        });
                        return;
                      }

                      const scheduleIso = toIsoFromDateTimeLocal(
                        selectedCampaignScheduleAt,
                      );

                      if (!scheduleIso) {
                        enqueueSnackbar("Choose a valid schedule time.", {
                          variant: "error",
                        });
                        return;
                      }

                      runCampaignAction({
                        campaignId: selectedCampaign.id,
                        action: "schedule",
                        actionFn: () =>
                          scheduleCampaign({
                            campaignId: selectedCampaign.id,
                            scheduledAt: scheduleIso,
                          }),
                        successMessage: "Campaign scheduled successfully.",
                      });
                    }}
                    disabled={isCampaignActionLocked(selectedCampaign.id)}
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
                      opacity: isCampaignActionLocked(selectedCampaign.id)
                        ? 0.5
                        : 1,
                    }}
                  >
                    <Clock3 size={12} /> Schedule
                  </Box>

                  <Box
                    component="button"
                    onClick={() =>
                      runCampaignAction({
                        campaignId: selectedCampaign.id,
                        action: "retry",
                        actionFn: () =>
                          retryFailedCampaign(selectedCampaign.id),
                        successMessage: "Failed recipients re-queued.",
                      })
                    }
                    disabled={
                      Number(selectedCampaign.failedRecipients || 0) <= 0 ||
                      isCampaignActionLocked(selectedCampaign.id)
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
                        isCampaignActionLocked(selectedCampaign.id)
                          ? 0.5
                          : 1,
                    }}
                  >
                    <RotateCcw size={12} /> Retry Failed
                  </Box>

                  <Box
                    component="button"
                    onClick={() =>
                      runCampaignAction({
                        campaignId: selectedCampaign.id,
                        action: "rerun",
                        actionFn: () => rerunCampaign(selectedCampaign.id),
                        successMessage: "Campaign re-queued for full rerun.",
                      })
                    }
                    disabled={
                      !RERUNABLE_CAMPAIGN_STATUSES.has(
                        selectedCampaign.status,
                      ) || isCampaignActionLocked(selectedCampaign.id)
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
                        !RERUNABLE_CAMPAIGN_STATUSES.has(
                          selectedCampaign.status,
                        ) || isCampaignActionLocked(selectedCampaign.id)
                          ? 0.5
                          : 1,
                    }}
                  >
                    <RefreshCw size={12} /> Rerun
                  </Box>

                  <Box
                    component="button"
                    onClick={() =>
                      runCampaignAction({
                        campaignId: selectedCampaign.id,
                        action: "cancel",
                        actionFn: () => cancelCampaign(selectedCampaign.id),
                        successMessage: "Campaign cancelled.",
                        rounds: 4,
                      })
                    }
                    disabled={
                      ["COMPLETED", "CANCELLED"].includes(
                        selectedCampaign.status,
                      ) || isCampaignActionLocked(selectedCampaign.id)
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
                        ) || isCampaignActionLocked(selectedCampaign.id)
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Ban size={12} /> Cancel
                  </Box>
                </Box>

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
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 0.65,
                  }}
                >
                  {selectedCampaignRecipients.map((recipient: any) => (
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
                      <StatusPill status={recipient.status} />
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
              </>
            )}
          </SectionCard>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            component="button"
            onClick={() => {
              resetForm();
              setMode("list");
            }}
            sx={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "8px",
              px: 1,
              py: 0.65,
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <ArrowLeft size={12} /> Back
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
            Create Campaign
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          p: 1,
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#0b0b0b",
          mb: 2,
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 1,
        }}
      >
        {CREATE_STEPS.map((item) => {
          const isActive = step === item.key;
          const isDone = step > item.key;

          return (
            <Box
              key={item.key}
              sx={{
                px: 1.2,
                py: 0.8,
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: isActive
                  ? "rgba(168,85,247,0.2)"
                  : isDone
                    ? "rgba(34,197,94,0.14)"
                    : "transparent",
                color: isActive
                  ? "#e9d5ff"
                  : isDone
                    ? "#86efac"
                    : "rgba(255,255,255,0.45)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {isDone ? <Check size={12} /> : <span>{item.key}.</span>}
              {item.label}
            </Box>
          );
        })}
      </Box>

      {step === 1 && (
        <SectionCard
          title="Basics"
          description="Set campaign identity and optional schedule."
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.2,
            }}
          >
            <Box>
              <Typography
                sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
              >
                Campaign Name
              </Typography>
              <Box
                component="input"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                sx={inputSx}
              />
            </Box>
            <Box>
              <Typography
                sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
              >
                Subject
              </Typography>
              <Box
                component="input"
                value={campaignSubject}
                onChange={(event) => setCampaignSubject(event.target.value)}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ maxWidth: 320 }}>
              <Typography
                sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
              >
                Schedule (optional)
              </Typography>
              <Box
                component="input"
                type="datetime-local"
                value={campaignScheduledAt}
                onChange={(event) => setCampaignScheduledAt(event.target.value)}
                sx={inputSx}
              />
            </Box>
          </Box>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard
          title="Audience"
          description="Choose who should receive the campaign."
        >
          <Box sx={{ maxWidth: 300, mb: 1.2 }}>
            <Typography
              sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
            >
              Audience Type
            </Typography>
            <Box
              component="select"
              value={campaignAudienceType}
              onChange={(event) => setCampaignAudienceType(event.target.value)}
              sx={inputSx}
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

          {campaignAudienceType === "FILTER" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.2,
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
                  Roles (multi-select)
                </Typography>
                <Box
                  component="select"
                  multiple
                  value={campaignRoles}
                  onChange={(event) =>
                    setCampaignRoles(
                      Array.from(
                        event.target.selectedOptions,
                        (option: any) => option.value,
                      ),
                    )
                  }
                  sx={{ ...inputSx, minHeight: 120 }}
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
                  sx={{ ...inputSx, minHeight: 120 }}
                >
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Box>
              </Box>

              <Box sx={{ maxWidth: 420 }}>
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
                  sx={inputSx}
                >
                  <option value="">All competitions</option>
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>
                      {competition.title}
                    </option>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {campaignAudienceType === "INDIVIDUAL" && (
            <Box>
              <Typography
                sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
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
                sx={{ ...inputSx, minHeight: 170 }}
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.2 }}>
              <Box>
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
                  rows={5}
                  value={campaignCsvEmailsText}
                  onChange={(event) =>
                    setCampaignCsvEmailsText(event.target.value)
                  }
                  sx={{ ...inputSx, resize: "vertical", py: 1 }}
                />
              </Box>
              <Box sx={{ maxWidth: 420 }}>
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
                  sx={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}
                />
              </Box>
            </Box>
          )}
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard
          title="Template"
          description="Compose and preview campaign HTML."
        >
          <Box
            sx={{
              mb: 0.7,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
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
            onChange={(event) => setCampaignTemplateHtml(event.target.value)}
            rows={10}
            sx={{
              ...inputSx,
              resize: "vertical",
              py: 1,
              fontFamily: "'DM Mono', monospace",
            }}
          />

          {!!(campaignMetadata?.allowedVariables || []).length && (
            <Typography
              sx={{
                mt: 0.6,
                color: "rgba(255,255,255,0.32)",
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Allowed variables:{" "}
              {(campaignMetadata?.allowedVariables || []).join(", ")}
            </Typography>
          )}

          <Box
            sx={{
              mt: 1.3,
              p: 1,
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#060606",
              minHeight: 90,
            }}
          >
            <Typography
              sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.65 }}
            >
              Live Preview
            </Typography>
            {previewingCampaign ? (
              <Typography
                sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
              >
                Updating preview...
              </Typography>
            ) : campaignPreviewError ? (
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
        </SectionCard>
      )}

      {step === 4 && (
        <SectionCard
          title="Review"
          description="Final check before creating the campaign."
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 0.9 }}>
            <Typography sx={{ color: "#f4f4f5", fontSize: 13 }}>
              <strong>Name:</strong> {campaignName || "—"}
            </Typography>
            <Typography sx={{ color: "#f4f4f5", fontSize: 13 }}>
              <strong>Subject:</strong> {campaignSubject || "—"}
            </Typography>
            <Typography sx={{ color: "#f4f4f5", fontSize: 13 }}>
              <strong>Audience Type:</strong> {campaignAudienceType}
            </Typography>
            <Typography sx={{ color: "#f4f4f5", fontSize: 13 }}>
              <strong>Schedule:</strong>{" "}
              {campaignScheduledAt
                ? formatDateTime(campaignScheduledAt)
                : "Send manually later"}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
              Template characters: {campaignTemplateHtml.length}
            </Typography>
          </Box>
        </SectionCard>
      )}

      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box
          component="button"
          onClick={handleBack}
          disabled={step === 1}
          sx={{
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "8px",
            px: 1.6,
            py: 0.85,
            background: "transparent",
            color: "rgba(255,255,255,0.8)",
            fontSize: 12,
            cursor: step === 1 ? "not-allowed" : "pointer",
            opacity: step === 1 ? 0.45 : 1,
          }}
        >
          Back
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {step < 4 ? (
            <Box
              component="button"
              onClick={handleNext}
              sx={{
                border: "none",
                borderRadius: "8px",
                px: 1.8,
                py: 0.85,
                background: "#a855f7",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
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
                px: 1.8,
                py: 0.85,
                background: "#a855f7",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: creatingCampaign ? "not-allowed" : "pointer",
                opacity: creatingCampaign ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
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
    </Box>
  );
}
