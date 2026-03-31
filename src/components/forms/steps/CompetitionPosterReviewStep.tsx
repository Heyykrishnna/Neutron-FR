"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Upload, ImageIcon, X } from "lucide-react";
import { FieldLabel } from "./CompetitionBasicInfoStep";

const STATUS_CONFIG = {
  DRAFT: { color: "#a1a1aa" },
  OPEN: { color: "#4ade80" },
  CLOSED: { color: "#fbbf24" },
  ARCHIVED: { color: "#38bdf8" },
  CANCELLED: { color: "#f87171" },
  POSTPONED: { color: "#fb923c" },
};

function ReviewRow({ label, value }: any) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        py: 1,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        alignItems: "baseline",
      }}
    >
      <Typography
        sx={{
          fontSize: 9.5,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
          fontFamily: "'Syne', sans-serif",
          minWidth: 140,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          color: "rgba(255,255,255,0.65)",
          fontFamily: "'DM Mono', monospace",
          wordBreak: "break-word",
        }}
      >
        {String(value)}
      </Typography>
    </Box>
  );
}

function ReviewSection({ title, children }: any) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.18)",
          fontFamily: "'Syne', sans-serif",
          mb: 1,
          mt: 2,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          px: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function CompetitionPosterReviewStep({
  watch,
  poster,
  onPosterChange,
  existingPosterPath,
  banner,
  onBannerChange,
  existingBannerPath,
}: any) {
  const fileInputRef = useRef<any>(null);
  const bannerInputRef = useRef<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);

  const formValues = watch();

  const toPreviewUrl = (file: any, existingPath: any) => {
    if (file) {
      return URL.createObjectURL(file);
    }

    if (!existingPath) return null;

    if (/^https?:\/\//i.test(existingPath)) {
      return existingPath;
    }

    const base =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = existingPath.startsWith("/")
      ? existingPath
      : `/${existingPath}`;

    return `${normalizedBase}${normalizedPath}`;
  };

  const previewUrl = useMemo(
    () => toPreviewUrl(poster, existingPosterPath),
    [poster, existingPosterPath],
  );

  const bannerPreviewUrl = useMemo(
    () => toPreviewUrl(banner, existingBannerPath),
    [banner, existingBannerPath],
  );

  useEffect(() => {
    return () => {
      if (poster && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      if (banner && bannerPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
    };
  }, [poster, previewUrl, banner, bannerPreviewUrl]);

  function handleFiles(files: any, onChange: any) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    onChange(file);
  }

  const fmtDate = (d: any) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  const boolLabel = (v: any) => (v ? "Yes" : "No");
  const statusValue =
    typeof formValues.status === "object" && formValues.status !== null
      ? formValues.status.value || formValues.status.label || ""
      : formValues.status;
  const subVenueSummary = Array.isArray(formValues.subVenues)
    ? formValues.subVenues
      .map((venue: any) => String(venue?.name || "").trim())
      .filter(Boolean)
    : [];

  const promoCodeSummary = Array.isArray(formValues.promoCodes)
    ? formValues.promoCodes
      .map((promo: any) => String(promo?.code || "").trim())
      .filter(Boolean)
    : [];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 3 }}>
      {/* ── Poster upload column ── */}
      <Box>
        <FieldLabel>Event Poster</FieldLabel>

        {/* Drop zone */}
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files, onPosterChange);
          }}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            position: "relative",
            height: previewUrl ? "auto" : 200,
            borderRadius: "10px",
            border: dragOver
              ? "2px solid rgba(168,85,247,0.6)"
              : "2px dashed rgba(255,255,255,0.1)",
            background: dragOver
              ? "rgba(168,85,247,0.06)"
              : "rgba(255,255,255,0.02)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            transition: "all 0.15s",
            overflow: "hidden",
            "&:hover": {
              borderColor: "rgba(168,85,247,0.4)",
              background: "rgba(168,85,247,0.03)",
            },
          }}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Poster preview"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                  "&:hover": { background: "rgba(0,0,0,0.45)" },
                  "& .upload-hint": { opacity: 0, transition: "opacity 0.15s" },
                  "&:hover .upload-hint": { opacity: 1 },
                }}
              >
                <Box className="upload-hint" sx={{ textAlign: "center" }}>
                  <Upload size={20} color="rgba(255,255,255,0.8)" />
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "'Syne', sans-serif",
                      mt: 0.5,
                    }}
                  >
                    Click to replace
                  </Typography>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <ImageIcon size={28} color="rgba(255,255,255,0.2)" />
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Syne', sans-serif",
                  textAlign: "center",
                }}
              >
                Drag & drop or{" "}
                <span style={{ color: "#a855f7" }}>click to upload</span>
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                JPEG · PNG · WebP · max 8 MB
              </Typography>
            </>
          )}
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files, onPosterChange)}
        />

        {poster && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: "8px",
              background: "rgba(168,85,247,0.06)",
              border: "1px solid rgba(168,85,247,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#c084fc",
                  fontFamily: "'DM Mono', monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 180,
                }}
              >
                {poster.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {(poster.size / 1024).toFixed(0)} KB
              </Typography>
            </Box>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPosterChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.35)",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </Box>
        )}

        {!poster && existingPosterPath && (
          <Typography
            sx={{
              mt: 1,
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Existing poster will be kept
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <FieldLabel>Event Banner</FieldLabel>
        </Box>

        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverBanner(true);
          }}
          onDragLeave={() => setDragOverBanner(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverBanner(false);
            handleFiles(e.dataTransfer.files, onBannerChange);
          }}
          onClick={() => bannerInputRef.current?.click()}
          sx={{
            position: "relative",
            height: bannerPreviewUrl ? "auto" : 200,
            borderRadius: "10px",
            border: dragOverBanner
              ? "2px solid rgba(168,85,247,0.6)"
              : "2px dashed rgba(255,255,255,0.1)",
            background: dragOverBanner
              ? "rgba(168,85,247,0.06)"
              : "rgba(255,255,255,0.02)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            transition: "all 0.15s",
            overflow: "hidden",
            mt: 1,
            "&:hover": {
              borderColor: "rgba(168,85,247,0.4)",
              background: "rgba(168,85,247,0.03)",
            },
          }}
        >
          {bannerPreviewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerPreviewUrl}
                alt="Banner preview"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 320,
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                  "&:hover": { background: "rgba(0,0,0,0.45)" },
                  "& .upload-hint": { opacity: 0, transition: "opacity 0.15s" },
                  "&:hover .upload-hint": { opacity: 1 },
                }}
              >
                <Box className="upload-hint" sx={{ textAlign: "center" }}>
                  <Upload size={20} color="rgba(255,255,255,0.8)" />
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "'Syne', sans-serif",
                      mt: 0.5,
                    }}
                  >
                    Click to replace
                  </Typography>
                </Box>
              </Box>
            </>
          ) : (
            <>
              <ImageIcon size={28} color="rgba(255,255,255,0.2)" />
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Syne', sans-serif",
                  textAlign: "center",
                }}
              >
                Drag & drop or{" "}
                <span style={{ color: "#a855f7" }}>click to upload</span>
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                JPEG · PNG · WebP · max 8 MB
              </Typography>
            </>
          )}
        </Box>

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files, onBannerChange)}
        />

        {banner && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: "8px",
              background: "rgba(168,85,247,0.06)",
              border: "1px solid rgba(168,85,247,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: "#c084fc",
                  fontFamily: "'DM Mono', monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 180,
                }}
              >
                {banner.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {(banner.size / 1024).toFixed(0)} KB
              </Typography>
            </Box>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBannerChange(null);
                if (bannerInputRef.current) bannerInputRef.current.value = "";
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.35)",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </Box>
        )}

        {!banner && existingBannerPath && (
          <Typography
            sx={{
              mt: 1,
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Existing banner will be kept
          </Typography>
        )}
      </Box>

      {/* ── Review column ── */}
      <Box 
      data-lenis-prevent
      sx={{ overflowY: "auto", maxHeight: 420, pr: 0.5 }}>
        <FieldLabel>Review Summary</FieldLabel>

        <ReviewSection title="Basic Info">
          <ReviewRow label="Title" value={formValues.title} />
          <ReviewRow
            label="Short Description"
            value={formValues.shortDescription}
          />
          <ReviewRow label="Category" value={formValues.category} />
          <ReviewRow label="Event Type" value={formValues.eventType} />
          <ReviewRow label="Participation" value={formValues.type} />
          <ReviewRow label="Status" value={statusValue} />
        </ReviewSection>

        <ReviewSection title="Schedule & Venue">
          <ReviewRow label="Start" value={fmtDate(formValues.startTime)} />
          <ReviewRow label="End" value={fmtDate(formValues.endTime)} />
          <ReviewRow
            label="Reg. Deadline"
            value={fmtDate(formValues.registrationDeadline)}
          />
          <ReviewRow label="Venue" value={formValues.venueName} />
          <ReviewRow label="Room" value={formValues.venueRoom} />
          <ReviewRow label="Floor" value={formValues.venueFloor} />
          <ReviewRow
            label="Sub Venues"
            value={subVenueSummary.length ? subVenueSummary.join(", ") : "None"}
          />
        </ReviewSection>

        <ReviewSection title="Registration Config">
          <ReviewRow label="Fee (₹)" value={formValues.registrationFee} />
          <ReviewRow
            label="Max Registrations"
            value={formValues.maxRegistrations || "Unlimited"}
          />
          {formValues.type === "TEAM" && (
            <>
              <ReviewRow label="Min Team Size" value={formValues.minTeamSize} />
              <ReviewRow label="Max Team Size" value={formValues.maxTeamSize} />
            </>
          )}
          <ReviewRow
            label="Reg. Open"
            value={boolLabel(formValues.registrationsOpen)}
          />
          <ReviewRow
            label="Requires Approval"
            value={boolLabel(formValues.requiresApproval)}
          />
          <ReviewRow
            label="Auto-Approve"
            value={boolLabel(formValues.autoApproveTeams)}
          />
          <ReviewRow label="Paid" value={boolLabel(formValues.isPaid)} />
          <ReviewRow
            label="Per Person"
            value={boolLabel(formValues.perPerson)}
          />
          <ReviewRow
            label="Attendance Req."
            value={boolLabel(formValues.attendanceRequired)}
          />
          <ReviewRow
            label="Promo Codes"
            value={
              promoCodeSummary.length ? promoCodeSummary.join(", ") : "None"
            }
          />
        </ReviewSection>
      </Box>
    </Box>
  );
}
