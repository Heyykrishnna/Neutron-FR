"use client";

import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { FieldLabel } from "./CompetitionBasicInfoStep";

const toolbarButtonCss = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.75)",
  borderRadius: "6px",
  fontSize: 11,
  fontFamily: "'DM Mono', monospace",
  padding: "4px 8px",
  cursor: "pointer",
};

const sanitizeHtml = (html) => {
  if (!html) return "";
  if (typeof document === "undefined") return String(html).trim();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  wrapper.querySelectorAll("script,style,iframe,object,embed").forEach((el) => {
    el.remove();
  });

  wrapper.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  const normalized = wrapper.innerHTML.trim();
  if (
    !normalized ||
    normalized === "<br>" ||
    normalized === "<div><br></div>" ||
    normalized === "<p><br></p>"
  ) {
    return "";
  }

  return normalized;
};

function RulesHtmlEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const current = editorRef.current.innerHTML;
    const incoming = value || "";
    if (current !== incoming) {
      editorRef.current.innerHTML = incoming;
    }
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    onChange(sanitizeHtml(editorRef.current.innerHTML));
  };

  const runCommand = (command) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (command === "createLink") {
      const url = window.prompt("Enter URL");
      if (!url) return;
      document.execCommand("createLink", false, url);
    } else {
      document.execCommand(command, false);
    }

    emitChange();
  };

  const runFormatBlock = (tag) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, `<${tag}>`);
    emitChange();
  };

  const characterCount = (value || "").length;

  return (
    <Box
      sx={{
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.02)",
        display: "flex",
        flexDirection: "column",
        minHeight: 312,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1,
          py: 1,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("bold")}
        >
          B
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("italic")}
        >
          I
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("underline")}
        >
          U
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("insertUnorderedList")}
        >
          • List
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("insertOrderedList")}
        >
          1. List
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runFormatBlock("h3")}
        >
          H3
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("createLink")}
        >
          Link
        </button>
        <button
          type="button"
          style={toolbarButtonCss}
          onClick={() => runCommand("removeFormat")}
        >
          Clear
        </button>
      </Box>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        style={{
          width: "100%",
          minHeight: 240,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "rgba(255,255,255,0.85)",
          padding: "12px 14px",
          boxSizing: "border-box",
          fontFamily: "'Syne', sans-serif",
          fontSize: 13,
          lineHeight: 1.7,
          overflowY: "auto",
        }}
      />
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          HTML editor (custom)
        </Typography>
        <Typography
          sx={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {characterCount} / 20000
        </Typography>
      </Box>
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
            <RulesHtmlEditor
              value={field.value || ""}
              onChange={field.onChange}
            />
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
                "& ul": { pl: 2.5, mb: 0.75, listStyleType: "disc" },
                "& ol": { pl: 2.5, mb: 0.75, listStyleType: "decimal" },
                "& li": { mb: 0.25 },
                "& a": { color: "#a855f7", textDecoration: "underline" },
                "& strong": { color: "rgba(255,255,255,0.9)", fontWeight: 600 },
                "& em": { fontStyle: "italic" },
              }}
            >
              {field.value ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(field.value),
                  }}
                />
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
