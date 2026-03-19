"use client";

import { useEffect, useMemo, useState } from "react";
import { useSnackbar } from "notistack";
import { Box, Typography, CircularProgress } from "@mui/material";
import {
  Megaphone,
  Send,
  Clock3,
  Ban,
  RotateCcw,
  RefreshCw,
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

const TRANSIENT_CAMPAIGN_STATUSES = new Set(["QUEUED", "SENDING", "SCHEDULED"]);
const PENDING_CAMPAIGN_STATUSES = new Set([
  "DRAFT",
  "SCHEDULED",
  "QUEUED",
  "SENDING",
  "FAILED",
  "PARTIAL",
]);
const SENDABLE_CAMPAIGN_STATUSES = new Set(["DRAFT", "SCHEDULED", "FAILED"]);
const RERUNABLE_CAMPAIGN_STATUSES = new Set([
  "FAILED",
  "PARTIAL",
  "COMPLETED",
  "CANCELLED",
]);

const CAMPAIGN_STATUS_COLORS = {
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

const parseCsvEmailsText = (value = "") => {
  return value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const toDateTimeLocalValue = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const mins = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${mins}`;
};

const formatHtml = (source = "") => {
  if (!source) return "";

  const compact = source.replace(/>\s+</g, "><").trim();
  const tokens = compact.split(/(<[^>]+>)/g).filter(Boolean);
  const lines = [];
  let depth = 0;

  const shouldIncreaseDepth = (token) => {
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

const renderCampaignStatusPill = (status) => {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CampaignManagerPage() {
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [selectedCampaignScheduleAt, setSelectedCampaignScheduleAt] =
    useState("");
  const [actionByCampaignId, setActionByCampaignId] = useState({});
  const [isReconciling, setIsReconciling] = useState(false);
  const [lastReconciledAt, setLastReconciledAt] = useState(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignTemplateHtml, setCampaignTemplateHtml] = useState("");
  const [campaignAudienceType, setCampaignAudienceType] = useState("FILTER");
  const [campaignRoles, setCampaignRoles] = useState([]);
  const [campaignDepartmentIds, setCampaignDepartmentIds] = useState([]);
  const [campaignUserIds, setCampaignUserIds] = useState([]);
  const [campaignCompetitionId, setCampaignCompetitionId] = useState("");
  const [campaignCsvEmailsText, setCampaignCsvEmailsText] = useState("");
  const [campaignCsvFile, setCampaignCsvFile] = useState(null);
  const [campaignScheduledAt, setCampaignScheduledAt] = useState("");
  const [campaignPreviewHtml, setCampaignPreviewHtml] = useState("");
  const [campaignPreviewError, setCampaignPreviewError] = useState("");

  const { data: campaignMetadata } = useCampaignMetadata();

  const {
    data: campaignListData,
    isFetching: fetchingCampaigns,
    refetch: refetchCampaigns,
  } = useCampaigns(
    {
      page: 1,
      limit: 100,
      search: campaignSearch || undefined,
    },
    {
      refetchInterval: (query) => {
        const list = query.state.data?.campaigns || [];
        return list.some((campaign) =>
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
  });

  const {
    data: selectedCampaignRecipientsData,
    isFetching: fetchingRecipients,
    refetch: refetchCampaignRecipients,
  } = useCampaignRecipients(
    selectedCampaignId,
    {
      page: 1,
      limit: 25,
    },
    {
      refetchInterval: selectedCampaignId ? 5000 : false,
      refetchIntervalInBackground: true,
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

  const allCampaigns = useMemo(
    () => campaignListData?.campaigns || [],
    [campaignListData],
  );
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

  const hasAnyMutationPending =
    sendingCampaign ||
    schedulingCampaign ||
    retryingCampaign ||
    rerunningCampaign ||
    cancellingCampaign;

  useEffect(() => {
    if (!selectedCampaignId && allCampaigns.length > 0) {
      setSelectedCampaignId(allCampaigns[0].id);
    }
  }, [allCampaigns, selectedCampaignId]);

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

    const debounceTimer = setTimeout(async () => {
      try {
        const preview = await previewCampaign({
          templateHtml: campaignTemplateHtml,
          sampleData: {},
        });

        setCampaignPreviewHtml(preview?.html || "");
        setCampaignPreviewError("");
      } catch (error) {
        setCampaignPreviewHtml("");
        setCampaignPreviewError(
          error?.response?.data?.message ||
            "Failed to generate preview from template.",
        );
      }
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [campaignTemplateHtml, previewCampaign]);

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
    setCampaignPreviewHtml("");
    setCampaignPreviewError("");
  };

  const reconcileCampaignState = async (campaignId, rounds = 3) => {
    setIsReconciling(true);
    try {
      for (let attempt = 0; attempt < rounds; attempt += 1) {
        const tasks = [refetchCampaigns()];

        if (campaignId) {
          tasks.push(refetchCampaignDetail());
          tasks.push(refetchCampaignRecipients());
        }

        const results = await Promise.all(tasks);
        const detailData = campaignId ? results[1]?.data : null;
        const status = detailData?.campaign?.status;

        if (!status || !TRANSIENT_CAMPAIGN_STATUSES.has(status)) {
          break;
        }

        if (attempt < rounds - 1) {
          await sleep(1000);
        }
      }
      setLastReconciledAt(new Date());
    } finally {
      setIsReconciling(false);
    }
  };

  const lockCampaignAction = (campaignId, action) => {
    setActionByCampaignId((prev) => ({ ...prev, [campaignId]: action }));
  };

  const unlockCampaignAction = (campaignId) => {
    setActionByCampaignId((prev) => {
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
  };

  const runCampaignAction = async ({
    campaignId,
    action,
    actionFn,
    successMessage,
    rounds = 3,
  }) => {
    if (!campaignId) return;

    lockCampaignAction(campaignId, action);
    try {
      await actionFn();
      await reconcileCampaignState(campaignId, rounds);
      enqueueSnackbar(successMessage, { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || "Campaign action failed.",
        { variant: "error" },
      );
    } finally {
      unlockCampaignAction(campaignId);
    }
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

      const createdCampaign = await createCampaign({
        name: campaignName.trim(),
        subject: campaignSubject.trim(),
        templateHtml: campaignTemplateHtml,
        audienceType: campaignAudienceType,
        audienceQuery: createAudienceQuery(),
        csvFile: campaignCsvFile,
        scheduledAt: campaignScheduledAt
          ? new Date(campaignScheduledAt).toISOString()
          : null,
      });

      setSelectedCampaignId(createdCampaign?.id || null);
      resetCampaignComposer();
      await reconcileCampaignState(createdCampaign?.id || null, 2);
      enqueueSnackbar("Campaign created successfully.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to create campaign.",
        { variant: "error" },
      );
    }
  };

  const isCampaignActionLocked = (campaignId) => {
    return Boolean(actionByCampaignId[campaignId]) || hasAnyMutationPending;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500 }}>
      <Box sx={{ mb: 3 }}>
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

        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.03em",
            ml: 0.5,
          }}
        >
          Dedicated campaign operations with continuous reconciliation and safer
          action state handling.
        </Typography>
      </Box>

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
        <Box
          sx={{
            display: "inline-flex",
            gap: 1,
            p: 0.5,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {[
            { key: "campaigns", label: "Campaigns" },
            { key: "pending", label: "Pending" },
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {!!lastReconciledAt && (
            <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 11 }}>
              Last reconciled: {lastReconciledAt.toLocaleTimeString()}
            </Typography>
          )}
          <Box
            component="button"
            onClick={() => reconcileCampaignState(selectedCampaignId, 2)}
            disabled={isReconciling}
            sx={{
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "8px",
              px: 1.4,
              py: 0.75,
              background: "transparent",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              opacity: isReconciling ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} /> Reconcile now
            {isReconciling && (
              <CircularProgress size={11} sx={{ color: "#fff" }} />
            )}
          </Box>
        </Box>
      </Box>

      {activeTab === "campaigns" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "420px 1fr" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 1.1,
            }}
          >
            <Typography
              sx={{ color: "#f4f4f5", fontSize: 14, fontWeight: 600 }}
            >
              Create Campaign
            </Typography>

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
                sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, mb: 0.5 }}
              >
                Subject
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

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
            >
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
                    fontSize: 12,
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
                    fontSize: 12,
                    outline: "none",
                  }}
                />
              </Box>
            </Box>

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
                    onChange={(event) =>
                      setCampaignRoles(
                        Array.from(
                          event.target.selectedOptions,
                          (option) => option.value,
                        ),
                      )
                    }
                    sx={{
                      width: "100%",
                      minHeight: 90,
                      px: 1.25,
                      py: 0.9,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 12,
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
                  {departments.length ? (
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
                        minHeight: 90,
                        px: 1.25,
                        py: 0.9,
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "#070707",
                        color: "#fff",
                        fontSize: 12,
                        outline: "none",
                      }}
                    >
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        minHeight: 42,
                        px: 1.25,
                        py: 1.1,
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "#070707",
                        color: "rgba(255,255,255,0.45)",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      No departments available yet.
                    </Box>
                  )}
                </Box>

                <Box>
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
                      fontSize: 12,
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
              <Box>
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
                    minHeight: 140,
                    px: 1.25,
                    py: 0.9,
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#070707",
                    color: "#fff",
                    fontSize: 12,
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
                    value={campaignCsvEmailsText}
                    onChange={(event) =>
                      setCampaignCsvEmailsText(event.target.value)
                    }
                    rows={4}
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
                      resize: "vertical",
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
                    Upload CSV file (optional)
                  </Typography>
                  <Box
                    component="input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) =>
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
                  sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}
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
                onChange={(event) =>
                  setCampaignTemplateHtml(event.target.value)
                }
                rows={8}
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
            </Box>

            <Box
              sx={{
                p: 1,
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#060606",
                minHeight: 80,
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

            <Box sx={{ display: "flex", gap: 1 }}>
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

              <Box
                component="button"
                onClick={resetCampaignComposer}
                sx={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.9,
                  background: "transparent",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Clear
              </Box>
            </Box>
          </Box>

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {(fetchingCampaigns ||
                    fetchingCampaignDetail ||
                    fetchingRecipients) && (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.42)", fontSize: 11 }}
                    >
                      Syncing...
                    </Typography>
                  )}
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
                      {campaign.queuedRecipients} • sent{" "}
                      {campaign.sentRecipients} • failed{" "}
                      {campaign.failedRecipients}
                    </Typography>
                  </Box>
                ))}
                {!allCampaigns.length && (
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}
                  >
                    No campaigns found.
                  </Typography>
                )}
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

                        runCampaignAction({
                          campaignId: selectedCampaign.id,
                          action: "schedule",
                          actionFn: () =>
                            scheduleCampaign({
                              campaignId: selectedCampaign.id,
                              scheduledAt: new Date(
                                selectedCampaignScheduleAt,
                              ).toISOString(),
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
                </Box>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.42)",
                    fontSize: 11,
                    mb: 1.2,
                  }}
                >
                  {selectedCampaign.subject}
                </Typography>

                <Box sx={{ mb: 1.2, maxWidth: 280 }}>
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
                    sx={{
                      width: "100%",
                      px: 1.25,
                      py: 0.8,
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "#070707",
                      color: "#fff",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
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
                        onClick={() =>
                          runCampaignAction({
                            campaignId: campaign.id,
                            action: "send",
                            actionFn: () => sendCampaignNow(campaign.id),
                            successMessage: "Campaign queued for sending.",
                          })
                        }
                        disabled={isCampaignActionLocked(campaign.id)}
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
                          opacity: isCampaignActionLocked(campaign.id)
                            ? 0.5
                            : 1,
                        }}
                      >
                        <Send size={11} /> Send
                      </Box>
                    )}

                    {Number(campaign.failedRecipients || 0) > 0 && (
                      <Box
                        component="button"
                        onClick={() =>
                          runCampaignAction({
                            campaignId: campaign.id,
                            action: "retry",
                            actionFn: () => retryFailedCampaign(campaign.id),
                            successMessage: "Failed recipients re-queued.",
                          })
                        }
                        disabled={isCampaignActionLocked(campaign.id)}
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
                          opacity: isCampaignActionLocked(campaign.id)
                            ? 0.5
                            : 1,
                        }}
                      >
                        <RotateCcw size={11} /> Retry
                      </Box>
                    )}

                    {!["COMPLETED", "CANCELLED"].includes(campaign.status) && (
                      <Box
                        component="button"
                        onClick={() =>
                          runCampaignAction({
                            campaignId: campaign.id,
                            action: "cancel",
                            actionFn: () => cancelCampaign(campaign.id),
                            successMessage: "Campaign cancelled.",
                            rounds: 4,
                          })
                        }
                        disabled={isCampaignActionLocked(campaign.id)}
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
                          opacity: isCampaignActionLocked(campaign.id)
                            ? 0.5
                            : 1,
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
