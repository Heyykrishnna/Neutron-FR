"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Lock,
  QrCode,
  ShieldCheck,
  Trophy,
  UserCheck,
  X,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMarkCompetitionAttendance,
  useMarkFestAttendance,
  useParticipantDetails,
  useVerifyQRCode,
  useVolunteerAttendanceProfile,
} from "@/src/hooks/api/useAttendance";

const sy = { fontFamily: "'Syne', sans-serif" };

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.75)" },
    "& textarea": {
      color: "rgba(255,255,255,0.9)",
      fontFamily: "'Syne', sans-serif",
      fontSize: 12,
    },
  },
};

function renderAnswer(field) {
  if (field?.jsonValue != null) {
    if (Array.isArray(field.jsonValue)) return field.jsonValue.join(", ");
    if (typeof field.jsonValue === "object")
      return JSON.stringify(field.jsonValue);
    return String(field.jsonValue);
  }
  if (field?.value) return String(field.value);
  if (field?.fileUrl) return field.fileUrl;
  return "—";
}

export default function VolunteerScanPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [qrPayload, setQrPayload] = useState("");
  const [scannedUserId, setScannedUserId] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [markedFest, setMarkedFest] = useState(false);
  const [markedComps, setMarkedComps] = useState(new Set());
  const [marking, setMarking] = useState(null); // null | "fest" | compId

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const { mutateAsync: verifyQRCode, isPending: verifying } = useVerifyQRCode();
  const { mutateAsync: markFestAttendance } = useMarkFestAttendance();
  const { mutateAsync: markCompAttendance } = useMarkCompetitionAttendance();

  const { data: profile, isSuccess: profileLoaded } =
    useVolunteerAttendanceProfile();
  const { data: participantDetails, isLoading: detailsLoading } =
    useParticipantDetails(scannedUserId || null);

  const isGateVolunteer = !!profile?.isRegistrationDeskVolunteer;
  const assignedComps = profile?.assignedCompetitions || [];
  const attendanceComps = assignedComps.filter(
    (ac) => ac.competition?.attendanceRequired,
  );
  const canAccess = isGateVolunteer || attendanceComps.length > 0;

  const hasFestAttendance = markedFest || !!participantDetails?.festAttendance;

  // registrations keyed by competitionId
  const registrationMap = useMemo(() => {
    const map = new Map();
    (participantDetails?.registrations || []).forEach((r) =>
      map.set(r.competitionId, r),
    );
    return map;
  }, [participantDetails]);

  /* ── Camera helpers ── */
  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.play().catch(() => {});
    }
  }, [cameraActive]);

  const handleStartCamera = async () => {
    setCameraError("");
    try {
      const hasBarcodeDetector =
        typeof window !== "undefined" && !!window.BarcodeDetector;
      const detector = hasBarcodeDetector
        ? new window.BarcodeDetector({ formats: ["qr_code"] })
        : null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      if (!detector) {
        setCameraError(
          "Camera active — auto-detect unavailable. Paste QR payload manually.",
        );
        return;
      }

      scanTimerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
        const codes = await detector.detect(canvas).catch(() => []);
        if (!codes?.length) return;
        const raw = codes[0]?.rawValue;
        if (!raw) return;
        setQrPayload(raw);
        stopCamera();
        enqueueSnackbar("QR captured", { variant: "success" });
      }, 650);
    } catch (err) {
      stopCamera();
      setCameraError(
        err?.message || "Unable to start camera. Check permissions.",
      );
    }
  };

  const handleVerify = async () => {
    const payload = qrPayload.trim();
    if (!payload) {
      enqueueSnackbar("Paste a QR payload or scan first", {
        variant: "warning",
      });
      return;
    }
    try {
      const verified = await verifyQRCode({ qrData: payload });
      setScannedUserId(verified?.id || "");
      setMarkedFest(false);
      setMarkedComps(new Set());
      enqueueSnackbar("QR verified", { variant: "success" });
    } catch (err) {
      setScannedUserId("");
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Invalid QR code",
        { variant: "error" },
      );
    }
  };

  const handleMarkFest = async () => {
    const uid = participantDetails?.user?.id;
    if (!uid) return;
    setMarking("fest");
    try {
      await markFestAttendance({ userId: uid });
      setMarkedFest(true);
      enqueueSnackbar("Fest attendance marked", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        { variant: "error" },
      );
    } finally {
      setMarking(null);
    }
  };

  const handleMarkComp = async (compId) => {
    const uid = participantDetails?.user?.id;
    if (!uid) return;
    setMarking(compId);
    try {
      await markCompAttendance({ competitionId: compId, userId: uid });
      setMarkedComps((prev) => new Set(prev).add(compId));
      enqueueSnackbar("Competition attendance marked", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || err?.message || "Failed",
        { variant: "error" },
      );
    } finally {
      setMarking(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
            <QrCode size={15} color="rgba(255,255,255,0.7)" />
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 600, color: "#f4f4f5", ...sy }}
            >
              QR Scanner
            </Typography>
            <Typography
              sx={{ fontSize: 11, color: "rgba(255,255,255,0.3)", ...sy }}
            >
              Scan participant QR to verify and mark attendance
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          href="/admin/volunteer"
          variant="outlined"
          size="small"
          startIcon={<ArrowLeft size={13} />}
          sx={{
            textTransform: "none",
            borderColor: "rgba(255,255,255,0.15)",
            color: "#a1a1aa",
            ...sy,
          }}
        >
          Back
        </Button>
      </Box>

      {/* Access check */}
      {profileLoaded && !canAccess && (
        <Alert
          severity="error"
          icon={<Lock size={14} />}
          sx={{ mb: 2.5, ...sy, "& .MuiAlert-message": sy }}
        >
          Access restricted — you need gate assignment or a competition with
          attendance enabled.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "420px 1fr" },
          gap: 2.5,
        }}
      >
        {/* ── Left: QR input ── */}
        <Paper
          sx={{
            p: 2.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography
            sx={{
              color: "#f4f4f5",
              fontWeight: 700,
              mb: 1.5,
              fontSize: 13,
              ...sy,
            }}
          >
            Scan QR
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Button
              startIcon={<Camera size={13} />}
              variant="outlined"
              disabled={!canAccess}
              onClick={cameraActive ? stopCamera : handleStartCamera}
              sx={{
                textTransform: "none",
                fontSize: 12,
                ...sy,
                borderColor: "rgba(255,255,255,0.18)",
                color: "#e4e4e7",
              }}
            >
              {cameraActive ? "Stop" : "Camera"}
            </Button>
            <Button
              variant="contained"
              disabled={verifying || !canAccess}
              onClick={handleVerify}
              sx={{
                textTransform: "none",
                fontSize: 12,
                ...sy,
                backgroundColor: "#7c3aed",
                "&:hover": { backgroundColor: "#6d28d9" },
              }}
            >
              {verifying ? "Verifying…" : "Verify QR"}
            </Button>
            {qrPayload && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setQrPayload("");
                  setScannedUserId("");
                }}
                sx={{
                  textTransform: "none",
                  color: "#71717a",
                  minWidth: 0,
                  px: 1,
                }}
              >
                <X size={14} />
              </Button>
            )}
          </Stack>

          {cameraActive && (
            <Box
              sx={{
                mb: 1.5,
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#050505",
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                style={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          )}

          {cameraError && (
            <Alert severity="warning" sx={{ mb: 1.5, fontSize: 11 }}>
              {cameraError}
            </Alert>
          )}

          <TextField
            multiline
            minRows={5}
            maxRows={8}
            fullWidth
            disabled={!canAccess}
            value={qrPayload}
            onChange={(e) => setQrPayload(e.target.value)}
            placeholder='Paste QR payload (e.g. {"t":"...","u":"..."})'
            sx={inputSx}
          />
        </Paper>

        {/* ── Right: Participant details + actions ── */}
        <Paper
          sx={{
            p: 2.5,
            background: "#0c0c0c",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <Typography
            sx={{
              color: "#f4f4f5",
              fontWeight: 700,
              mb: 1.5,
              fontSize: 13,
              ...sy,
            }}
          >
            Participant
          </Typography>

          {detailsLoading ? (
            <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={22} sx={{ color: "#a855f7" }} />
            </Box>
          ) : !participantDetails?.user ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <QrCode
                size={28}
                color="rgba(255,255,255,0.1)"
                style={{ marginBottom: 8 }}
              />
              <Typography
                sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", ...sy }}
              >
                Scan and verify a QR code to view participant profile
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* Profile */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "rgba(168,85,247,0.2)",
                    color: "#c084fc",
                    fontSize: 16,
                  }}
                >
                  {(participantDetails.user.name || "?")[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f4f4f5",
                      ...sy,
                    }}
                  >
                    {participantDetails.user.name || "Unnamed"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", ...sy }}
                  >
                    {participantDetails.user.email}
                    {participantDetails.user.collegeName
                      ? ` · ${participantDetails.user.collegeName}`
                      : ""}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

              {/* Fest attendance action */}
              {isGateVolunteer && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ShieldCheck size={14} color="#4ade80" />
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#e4e4e7",
                          ...sy,
                        }}
                      >
                        Fest / Gate Check-in
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          ...sy,
                        }}
                      >
                        Overall fest attendance
                      </Typography>
                    </Box>
                  </Box>
                  {hasFestAttendance ? (
                    <Chip
                      label="Marked"
                      size="small"
                      icon={<CheckCircle2 size={10} color="#4ade80" />}
                      sx={{
                        background: "rgba(34,197,94,0.12)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.2)",
                        fontSize: 10,
                        ...sy,
                      }}
                    />
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      disabled={marking === "fest"}
                      onClick={handleMarkFest}
                      sx={{
                        textTransform: "none",
                        fontSize: 11,
                        ...sy,
                        backgroundColor: "#16a34a",
                        "&:hover": { backgroundColor: "#15803d" },
                        "&.Mui-disabled": {
                          backgroundColor: "#27272a",
                          color: "#52525b",
                        },
                      }}
                    >
                      {marking === "fest" ? (
                        <CircularProgress size={12} sx={{ color: "#fff" }} />
                      ) : (
                        "Mark Check-in"
                      )}
                    </Button>
                  )}
                </Box>
              )}

              {/* Competition attendance actions */}
              {attendanceComps.length > 0 && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                      mb: 1,
                      ...sy,
                    }}
                  >
                    Competition Attendance
                  </Typography>
                  <Stack spacing={1}>
                    {attendanceComps.map((ac) => {
                      const comp = ac.competition;
                      const compId = comp?.id;
                      const registration = registrationMap.get(compId);
                      const isRegistered = !!registration;
                      const isAlreadyMarked =
                        markedComps.has(compId) ||
                        !!participantDetails?.competitionAttendance;
                      const isMarkingThis = marking === compId;

                      return (
                        <Box
                          key={compId}
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.07)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            opacity: !isRegistered ? 0.45 : 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              minWidth: 0,
                            }}
                          >
                            <Trophy size={13} color="#c084fc" />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#e4e4e7",
                                  ...sy,
                                }}
                                noWrap
                              >
                                {comp?.title || "Competition"}
                              </Typography>
                              {!isRegistered && (
                                <Typography
                                  sx={{ fontSize: 10, color: "#f87171", ...sy }}
                                >
                                  Not registered
                                </Typography>
                              )}
                              {isRegistered && (
                                <Chip
                                  label={registration.status}
                                  size="small"
                                  sx={{
                                    mt: 0.25,
                                    fontSize: 9,
                                    height: 16,
                                    background:
                                      registration.status === "APPROVED"
                                        ? "rgba(34,197,94,0.1)"
                                        : "rgba(255,255,255,0.05)",
                                    color:
                                      registration.status === "APPROVED"
                                        ? "#4ade80"
                                        : "#a1a1aa",
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {isRegistered &&
                            (isAlreadyMarked ? (
                              <Chip
                                label="Marked"
                                size="small"
                                icon={
                                  <CheckCircle2 size={10} color="#4ade80" />
                                }
                                sx={{
                                  background: "rgba(34,197,94,0.12)",
                                  color: "#4ade80",
                                  border: "1px solid rgba(34,197,94,0.2)",
                                  fontSize: 10,
                                  ...sy,
                                }}
                              />
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                disabled={!!marking}
                                onClick={() => handleMarkComp(compId)}
                                sx={{
                                  textTransform: "none",
                                  fontSize: 11,
                                  ...sy,
                                  backgroundColor: "#7c3aed",
                                  "&:hover": { backgroundColor: "#6d28d9" },
                                  "&.Mui-disabled": {
                                    backgroundColor: "#27272a",
                                    color: "#52525b",
                                  },
                                  flexShrink: 0,
                                }}
                              >
                                {isMarkingThis ? (
                                  <CircularProgress
                                    size={12}
                                    sx={{ color: "#fff" }}
                                  />
                                ) : (
                                  "Mark"
                                )}
                              </Button>
                            ))}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Registrations summary */}
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Typography
                sx={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  ...sy,
                }}
              >
                All Registrations (
                {participantDetails.registrations?.length || 0})
              </Typography>
              {(participantDetails.registrations || []).length === 0 ? (
                <Typography
                  sx={{ fontSize: 12, color: "rgba(255,255,255,0.2)", ...sy }}
                >
                  No registrations
                </Typography>
              ) : (
                <Stack spacing={0.6}>
                  {participantDetails.registrations.map((r) => (
                    <Box
                      key={r.registrationId}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: 1.25,
                        py: 0.75,
                        borderRadius: "7px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 12, color: "#d4d4d8", ...sy }}
                        noWrap
                      >
                        {r.competition?.title || "Competition"}
                      </Typography>
                      <Chip
                        label={r.status}
                        size="small"
                        sx={{
                          fontSize: 9,
                          height: 16,
                          ml: 1,
                          flexShrink: 0,
                          background:
                            r.status === "APPROVED"
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(255,255,255,0.05)",
                          color:
                            r.status === "APPROVED" ? "#4ade80" : "#a1a1aa",
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
