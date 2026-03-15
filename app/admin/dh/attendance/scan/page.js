"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useSnackbar } from "notistack";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMarkFestAttendance,
  useParticipantDetails,
  useVerifyQRCode,
  useVolunteerAttendanceProfile,
} from "@/src/hooks/api/useAttendance";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "rgba(255,255,255,0.9)",
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(168,85,247,0.75)" },
    "& textarea": {
      color: "rgba(255,255,255,0.92)",
      fontFamily: "'Syne', sans-serif",
      fontSize: 12,
      lineHeight: 1.45,
    },
  },
};

const renderAnswer = (field) => {
  if (field?.jsonValue !== null && field?.jsonValue !== undefined) {
    if (Array.isArray(field.jsonValue)) {
      return field.jsonValue.join(", ");
    }

    if (typeof field.jsonValue === "object") {
      return JSON.stringify(field.jsonValue);
    }

    return String(field.jsonValue);
  }

  if (field?.value) return String(field.value);
  if (field?.fileUrl) return field.fileUrl;
  return "—";
};

export default function AttendanceQRScannerPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [qrPayload, setQrPayload] = useState("");
  const [scannedUserId, setScannedUserId] = useState("");
  const [verifiedUserPreview, setVerifiedUserPreview] = useState(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [markingFest, setMarkingFest] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const { mutateAsync: verifyQRCode, isPending: verifying } = useVerifyQRCode();
  const { mutateAsync: markFestAttendance } = useMarkFestAttendance();
  const { data: volunteerProfile, isSuccess: profileLoaded } =
    useVolunteerAttendanceProfile();
  const { data: participantDetails, isLoading: detailsLoading } =
    useParticipantDetails(scannedUserId || null);

  const isDH = user?.role === "DH";
  const canMarkFestAttendance =
    user?.role === "SA" || !!volunteerProfile?.isRegistrationDeskVolunteer;
  const canAccessAttendanceWorkflow =
    user?.role === "SA" ||
    user?.role === "DH" ||
    !!volunteerProfile?.isRegistrationDeskVolunteer ||
    !!volunteerProfile?.assignedCompetitions?.some(
      (ac) => ac.competition?.attendanceRequired,
    );

  const bindStreamToVideo = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.muted = true;
    video.setAttribute("playsinline", "true");

    try {
      await video.play();
    } catch {
      // Playback can be delayed by browser policies; retried by effect below.
    }

    return true;
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const handleScanSubmit = async () => {
    const payload = qrPayload.trim();

    if (!payload) {
      enqueueSnackbar("Paste QR payload or use camera scan first", {
        variant: "warning",
      });
      return;
    }

    try {
      const verified = await verifyQRCode({ qrData: payload });
      setVerifiedUserPreview(verified);
      setScannedUserId(verified?.id || "");
      enqueueSnackbar("QR verified", { variant: "success" });
    } catch (error) {
      setVerifiedUserPreview(null);
      setScannedUserId("");
      enqueueSnackbar(
        error?.response?.data?.message || error?.message || "Invalid QR code",
        { variant: "error" },
      );
    }
  };

  const handleMarkFestAttendance = async () => {
    if (!participantDetails?.user?.id) {
      enqueueSnackbar("Scan a participant first", { variant: "warning" });
      return;
    }

    setMarkingFest(true);
    try {
      await markFestAttendance({ userId: participantDetails.user.id });
      enqueueSnackbar("Fest attendance marked", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to mark fest attendance",
        { variant: "error" },
      );
    } finally {
      setMarkingFest(false);
    }
  };

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

      const attached = await bindStreamToVideo();
      if (!attached) {
        requestAnimationFrame(() => {
          void bindStreamToVideo();
        });
      }

      if (!detector) {
        setCameraError(
          "Camera preview is active, but this browser cannot auto-detect QR codes. Paste QR payload manually after scanning with another app.",
        );
        return;
      }

      scanTimerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const codes = await detector.detect(canvas);
        if (!codes?.length) return;

        const rawValue = codes[0]?.rawValue;
        if (!rawValue) return;

        setQrPayload(rawValue);
        stopCamera();
        enqueueSnackbar("QR captured from camera", { variant: "success" });
      }, 650);
    } catch (error) {
      stopCamera();
      setCameraError(
        error?.message ||
          "Unable to start camera. Check permissions and retry.",
      );
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;
    void bindStreamToVideo();
  }, [cameraActive]);

  const registrations = participantDetails?.registrations || [];
  const formSubmissions = participantDetails?.formSubmissions || [];
  const hasFestAttendance = !!participantDetails?.festAttendance;

  const formSummary = useMemo(
    () =>
      formSubmissions.reduce(
        (sum, submission) => sum + (submission?.totalFieldsSubmitted || 0),
        0,
      ),
    [formSubmissions],
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1300 }}>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <QrCode size={18} color="#a78bfa" />
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#f4f4f5" }}>
            QR Attendance Scanner
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/admin/dh/attendance"
          variant="outlined"
          startIcon={<ArrowLeft size={14} />}
          sx={{
            textTransform: "none",
            borderColor: "rgba(255,255,255,0.2)",
            color: "#e4e4e7",
          }}
        >
          Back to Attendance
        </Button>
      </Box>

      {profileLoaded && !canAccessAttendanceWorkflow && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, fontFamily: "'Syne', sans-serif" }}
        >
          Access restricted — you must be assigned as a gate volunteer or
          assigned to a competition with attendance tracking enabled.
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 2.5,
              background: "#0c0c0c",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
              mb: 2,
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
              Scan QR
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <Button
                startIcon={<Camera size={14} />}
                variant="outlined"
                disabled={!canAccessAttendanceWorkflow}
                onClick={cameraActive ? stopCamera : handleStartCamera}
                sx={{
                  textTransform: "none",
                  borderColor: "rgba(255,255,255,0.22)",
                  color: "#e4e4e7",
                }}
              >
                {cameraActive ? "Stop Camera" : "Scan with Camera"}
              </Button>
              <Button
                variant="contained"
                disabled={verifying || !canAccessAttendanceWorkflow}
                onClick={handleScanSubmit}
                sx={{
                  textTransform: "none",
                  backgroundColor: "#7c3aed",
                  "&:hover": { backgroundColor: "#6d28d9" },
                }}
              >
                {verifying ? "Verifying…" : "Verify QR"}
              </Button>
            </Stack>

            {cameraActive && (
              <Box
                sx={{
                  mb: 1.5,
                  minHeight: 220,
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "#050505",
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
                    maxHeight: 300,
                    minHeight: 220,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            )}

            {cameraError && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                {cameraError}
              </Alert>
            )}

            <TextField
              multiline
              minRows={5}
              maxRows={9}
              fullWidth
              disabled={!canAccessAttendanceWorkflow}
              value={qrPayload}
              onChange={(event) => setQrPayload(event.target.value)}
              placeholder='QR payload (JSON like {"t":"...","u":"...","v":1})'
              sx={inputSx}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 2.5,
              background: "#0c0c0c",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 700, mb: 1.5 }}>
              Participant Details
            </Typography>

            {detailsLoading ? (
              <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={22} sx={{ color: "#a855f7" }} />
              </Box>
            ) : !participantDetails?.user ? (
              <Typography variant="body2" sx={{ color: "#71717a" }}>
                Scan and verify a QR code to view participant profile,
                registrations, and submitted forms.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                      {participantDetails.user.name || "Unnamed User"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#a1a1aa" }}>
                      {participantDetails.user.email}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={participantDetails.user.role}
                      size="small"
                      sx={{ backgroundColor: "#27272a", color: "#fff" }}
                    />
                    <Chip
                      label={
                        hasFestAttendance ? "Fest Attended" : "Fest Not Marked"
                      }
                      size="small"
                      color={hasFestAttendance ? "success" : "default"}
                      icon={
                        hasFestAttendance ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <UserCheck size={12} />
                        )
                      }
                    />
                  </Stack>
                </Box>

                {verifiedUserPreview && (
                  <Typography variant="caption" sx={{ color: "#71717a" }}>
                    QR verified for user ID: {verifiedUserPreview.id}
                  </Typography>
                )}

                <Divider sx={{ borderColor: "#27272a" }} />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: "wrap", gap: 1 }}
                >
                  <Chip
                    label={`Competitions: ${registrations.length}`}
                    size="small"
                    sx={{ backgroundColor: "#1f2937", color: "#bfdbfe" }}
                  />
                  <Chip
                    label={`Form Submissions: ${formSubmissions.length}`}
                    size="small"
                    sx={{ backgroundColor: "#1f2937", color: "#c4b5fd" }}
                  />
                  <Chip
                    label={`Total Answers: ${formSummary}`}
                    size="small"
                    sx={{ backgroundColor: "#1f2937", color: "#86efac" }}
                  />
                </Stack>

                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.8 }}>
                    Registered Competitions
                  </Typography>
                  {registrations.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#71717a" }}>
                      No registrations found
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {registrations.map((registration) => (
                        <Paper
                          key={registration.registrationId}
                          variant="outlined"
                          sx={{
                            p: 1.2,
                            background: "#090909",
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Typography
                            sx={{ color: "#f4f4f5", fontWeight: 600 }}
                          >
                            {registration.competition?.title ||
                              "Untitled Competition"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#71717a" }}
                          >
                            Status: {registration.status}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.8 }}>
                    Forms Submitted (All fields & answers)
                  </Typography>
                  {formSubmissions.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#71717a" }}>
                      No form submissions found
                    </Typography>
                  ) : (
                    <Stack spacing={1.2}>
                      {formSubmissions.map((submission) => (
                        <Paper
                          key={submission.competitionId}
                          variant="outlined"
                          sx={{
                            p: 1.2,
                            background: "#090909",
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Typography
                            sx={{ color: "#fff", fontWeight: 600, mb: 0.8 }}
                          >
                            {submission.competitionTitle || "Competition"}
                          </Typography>

                          <Stack spacing={0.8}>
                            {submission.fields?.map((field) => (
                              <Box
                                key={field.responseId}
                                sx={{
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: "8px",
                                  p: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#e4e4e7", fontWeight: 600 }}
                                >
                                  {field.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#71717a" }}
                                >
                                  {field.fieldType} • {field.scope}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#c4b5fd",
                                    mt: 0.4,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {renderAnswer(field)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>

                {!isDH && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      pt: 0.5,
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<ShieldCheck size={15} />}
                      disabled={
                        !canMarkFestAttendance ||
                        hasFestAttendance ||
                        markingFest
                      }
                      onClick={handleMarkFestAttendance}
                      sx={{
                        textTransform: "none",
                        backgroundColor: "#16a34a",
                        "&:hover": { backgroundColor: "#15803d" },
                        "&.Mui-disabled": {
                          backgroundColor: "#3f3f46",
                          color: "#71717a",
                        },
                      }}
                    >
                      {markingFest ? "Marking…" : "Mark Fest Attendance"}
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
