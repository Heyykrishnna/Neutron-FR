"use client";

import { useEffect, useRef, useCallback } from "react";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { FieldLabel } from "./CompetitionBasicInfoStep";

// Lazily loaded Quill editor ─ avoids SSR issues
function QuillEditor({ value, onChange }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (quillRef.current) return;

    const init = async () => {
      const [{ default: Quill }] = await Promise.all([
        import("quill"),
        import("quill/dist/quill.snow.css"),
      ]);

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        placeholder: "Write competition rules, judging criteria, FAQs…",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ header: [1, 2, 3, false] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
          ],
        },
      });

      if (valueRef.current) {
        quill.root.innerHTML = valueRef.current;
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        onChange(html === "<p><br></p>" ? "" : html);
      });

      quillRef.current = quill;
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. switching back to this step after edit)
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  return (
    <Box
      sx={{
        "& .ql-toolbar": {
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1) !important",
          borderBottom: "none !important",
          borderRadius: "8px 8px 0 0",
          "& .ql-stroke": { stroke: "rgba(255,255,255,0.45) !important" },
          "& .ql-fill": { fill: "rgba(255,255,255,0.45) !important" },
          "& .ql-picker-label": {
            color: "rgba(255,255,255,0.45) !important",
            border: "none !important",
          },
          "& .ql-picker-options": {
            background: "#1a1a1a !important",
            border: "1px solid rgba(255,255,255,0.1) !important",
            borderRadius: "6px !important",
          },
          "& .ql-picker-item": { color: "rgba(255,255,255,0.6) !important" },
          "& button:hover .ql-stroke": { stroke: "#a855f7 !important" },
          "& button:hover .ql-fill": { fill: "#a855f7 !important" },
          "& .ql-active .ql-stroke": { stroke: "#a855f7 !important" },
          "& .ql-active .ql-fill": { fill: "#a855f7 !important" },
        },
        "& .ql-container": {
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.1) !important",
          borderRadius: "0 0 8px 8px",
          "& .ql-editor": {
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            minHeight: 260,
            lineHeight: 1.7,
            "&.ql-blank::before": {
              color: "rgba(255,255,255,0.2) !important",
              fontStyle: "normal !important",
            },
            "& h1, & h2, & h3": { color: "rgba(255,255,255,0.9)" },
            "& a": { color: "#a855f7" },
            "& ol, & ul": { paddingLeft: "1.5em" },
          },
        },
      }}
    >
      <div ref={containerRef} />
    </Box>
  );
}

export default function CompetitionRulesStep({ control, errors }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 2.5,
        minHeight: 360,
      }}
    >
      {/* Editor panel */}
      <Box>
        <FieldLabel>Rules & Guidelines</FieldLabel>
        <Controller
          name="rulesRichText"
          control={control}
          render={({ field }) => (
            <QuillEditor value={field.value || ""} onChange={field.onChange} />
          )}
        />
        {errors.rulesRichText && (
          <Typography
            sx={{
              fontSize: 11,
              color: "#f87171",
              mt: 0.5,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {errors.rulesRichText.message}
          </Typography>
        )}
      </Box>

      {/* Live preview panel */}
      <Controller
        name="rulesRichText"
        control={control}
        render={({ field }) => (
          <Box>
            <FieldLabel>Live Preview</FieldLabel>
            <Box
              sx={{
                height: "100%",
                minHeight: 312,
                p: 2,
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                overflowY: "auto",
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Syne', sans-serif",
                lineHeight: 1.7,
                "& h1": { fontSize: 20, color: "#f4f4f5", mt: 0.5, mb: 0.5 },
                "& h2": { fontSize: 16, color: "#e4e4e7", mt: 0.5, mb: 0.5 },
                "& h3": { fontSize: 14, color: "#d4d4d8", mt: 0.5, mb: 0.5 },
                "& p": { mb: 0.75, mt: 0 },
                "& ul, & ol": { pl: 2.5, mb: 0.75 },
                "& li": { mb: 0.25 },
                "& a": { color: "#a855f7", textDecoration: "underline" },
                "& strong": { color: "rgba(255,255,255,0.9)", fontWeight: 600 },
                "& em": { fontStyle: "italic" },
              }}
            >
              {field.value ? (
                <div dangerouslySetInnerHTML={{ __html: field.value }} />
              ) : (
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.15)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  Preview will appear here as you type…
                </Typography>
              )}
            </Box>
          </Box>
        )}
      />
    </Box>
  );
}
