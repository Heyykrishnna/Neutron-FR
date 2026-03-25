"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { FieldLabel } from "./CompetitionBasicInfoStep";

// ─── HTML sanitizer ───────────────────────────────────────────────────────────

const sanitizeHtml = (html) => {
  if (!html) return "";
  if (typeof document === "undefined") return String(html).trim();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  wrapper.querySelectorAll("script,style,iframe,object,embed").forEach((el) => el.remove());
  wrapper.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on") || attr.name === "href" && !/^https?:/.test(el.getAttribute("href"))) {
        el.removeAttribute(attr.name);
      }
    });
  });

  const normalized = wrapper.innerHTML.trim();
  if (!normalized || normalized === "<br>" || normalized === "<div><br></div>" || normalized === "<p><br></p>") {
    return "";
  }
  return normalized;
};

const getTextLength = (html) => {
  if (!html) return 0;
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "").length;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").length;
};

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({ label, title, active, onClick }) {
  return (
    <button
      type="button"
      title={title || label}
      onMouseDown={(e) => {
        e.preventDefault(); // Keep editor focus
        onClick();
      }}
      style={{
        border: active
          ? "1px solid rgba(168,85,247,0.55)"
          : "1px solid rgba(255,255,255,0.1)",
        background: active
          ? "rgba(168,85,247,0.18)"
          : "rgba(255,255,255,0.03)",
        color: active ? "#c084fc" : "rgba(255,255,255,0.65)",
        borderRadius: "5px",
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        padding: "4px 9px",
        cursor: "pointer",
        minWidth: 28,
        transition: "all 0.12s",
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: "1px",
        height: 16,
        background: "rgba(255,255,255,0.08)",
        mx: 0.5,
        alignSelf: "center",
      }}
    />
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function RulesHtmlEditor({ value, onChange, hasError }) {
  const editorRef = useRef(null);
  const suppressSyncRef = useRef(false);
  const [formats, setFormats] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const MAX_CHARS = 20000;

  // Sync external value changes into the DOM (edit-mode load)
  useEffect(() => {
    if (!editorRef.current || suppressSyncRef.current) return;
    const incoming = value || "";
    if (editorRef.current.innerHTML !== incoming) {
      editorRef.current.innerHTML = incoming;
    }
  }, [value]);

  const queryFormats = useCallback(() => {
    try {
      setFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // some browsers may throw if no selection
    }
  }, []);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    suppressSyncRef.current = true;
    const sanitized = sanitizeHtml(editorRef.current.innerHTML);
    onChange(sanitized);
    queryFormats();
    // Release suppression after React reconciles
    requestAnimationFrame(() => {
      suppressSyncRef.current = false;
    });
  }, [onChange, queryFormats]);

  const runCommand = useCallback((cmd, arg) => {
    if (!editorRef.current) return;
    document.execCommand(cmd, false, arg ?? null);
    emitChange();
  }, [emitChange]);

  const handleFormatBlock = useCallback((tag) => {
    if (!editorRef.current) return;
    document.execCommand("formatBlock", false, `<${tag}>`);
    emitChange();
  }, [emitChange]);

  const handleLink = useCallback(() => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || "";
    const url = window.prompt("Enter URL (https://...)");
    if (!url) return;
    if (selectedText) {
      runCommand("createLink", url);
    } else {
      document.execCommand("insertHTML", false, `<a href="${url}">${url}</a>`);
      emitChange();
    }
  }, [runCommand, emitChange]);

  // Strip HTML from paste — paste as plain text only
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const textLength = getTextLength(value);
  const overLimit = textLength > MAX_CHARS;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
          p: 1,
          borderRadius: "8px 8px 0 0",
          background: "rgba(255,255,255,0.015)",
          border: hasError
            ? "1px solid rgba(248,113,113,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
      >
        {/* Inline format */}
        <ToolbarBtn label="B" title="Bold (Ctrl+B)" active={formats.bold} onClick={() => runCommand("bold")} />
        <ToolbarBtn label="I" title="Italic (Ctrl+I)" active={formats.italic} onClick={() => runCommand("italic")} />
        <ToolbarBtn label="U" title="Underline (Ctrl+U)" active={formats.underline} onClick={() => runCommand("underline")} />

        <ToolbarDivider />

        {/* Block format */}
        <ToolbarBtn label="H2" title="Heading 2" onClick={() => handleFormatBlock("h2")} />
        <ToolbarBtn label="H3" title="Heading 3" onClick={() => handleFormatBlock("h3")} />
        <ToolbarBtn label="P" title="Paragraph" onClick={() => handleFormatBlock("p")} />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarBtn label="• List" title="Bullet List" active={formats.ul} onClick={() => runCommand("insertUnorderedList")} />
        <ToolbarBtn label="1. List" title="Numbered List" active={formats.ol} onClick={() => runCommand("insertOrderedList")} />

        <ToolbarDivider />

        {/* Misc */}
        <ToolbarBtn label="Link" title="Insert Link" onClick={handleLink} />
        <ToolbarBtn label="Clear" title="Remove Formatting" onClick={() => runCommand("removeFormat")} />

        {/* Preview toggle — pushed to far right */}
        <Box sx={{ ml: "auto" }}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowPreview((v) => !v); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              border: "1px solid rgba(255,255,255,0.1)",
              background: showPreview ? "rgba(255,255,255,0.06)" : "transparent",
              color: "rgba(255,255,255,0.45)",
              borderRadius: "5px",
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              padding: "4px 9px",
              cursor: "pointer",
            }}
          >
            {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPreview ? "Hide preview" : "Preview"}
          </button>
        </Box>
      </Box>

      {/* Editor area */}
      <Box
        sx={{
          border: hasError
            ? "1px solid rgba(248,113,113,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: showPreview ? "0" : "0 0 8px 8px",
          borderTop: "none",
          background: "rgba(255,255,255,0.02)",
          position: "relative",
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={emitChange}
          onKeyUp={queryFormats}
          onMouseUp={queryFormats}
          onPaste={handlePaste}
          style={{
            minHeight: 260,
            maxHeight: 480,
            overflowY: "auto",
            padding: "14px 16px",
            outline: "none",
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Syne', sans-serif",
            fontSize: 13,
            lineHeight: 1.75,
            // Render list styles inside contentEditable
            listStyle: "inherit",
          }}
        />

        {/* Footer: char count */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "flex-end",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: overLimit ? "#f87171" : "rgba(255,255,255,0.25)",
            }}
          >
            {textLength.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
          </Typography>
        </Box>
      </Box>

      {/* Inline preview */}
      {showPreview && (
        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "1px solid rgba(168,85,247,0.2)",
            borderRadius: "0 0 8px 8px",
            p: 2,
            background: "rgba(255,255,255,0.015)",
            minHeight: 80,
            maxHeight: 320,
            overflowY: "auto",
            "& h1,& h2,& h3,& h4": { color: "#f4f4f5", marginTop: "12px", marginBottom: "4px", fontFamily: "'Syne', sans-serif" },
            "& h1": { fontSize: 18 },
            "& h2": { fontSize: 15 },
            "& h3": { fontSize: 13 },
            "& p": { margin: "6px 0", color: "rgba(255,255,255,0.75)" },
            "& ul": { paddingLeft: 20, listStyleType: "disc", color: "rgba(255,255,255,0.75)" },
            "& ol": { paddingLeft: 20, listStyleType: "decimal", color: "rgba(255,255,255,0.75)" },
            "& li": { marginBottom: 2 },
            "& a": { color: "#a855f7" },
            "& strong": { color: "rgba(255,255,255,0.9)", fontWeight: 600 },
            "& em": { fontStyle: "italic" },
          }}
        >
          {value ? (
            <div
              style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
            />
          ) : (
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.18)", fontFamily: "'DM Mono', monospace" }}>
              Nothing to preview yet
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Step component ───────────────────────────────────────────────────────────

export default function CompetitionRulesStep({ control, errors }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 0.5 }}>
        <FieldLabel>Rules & Guidelines</FieldLabel>
        <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
          Optional — HTML formatting supported
        </Typography>
      </Box>

      <Controller
        name="rulesRichText"
        control={control}
        render={({ field }) => (
          <RulesHtmlEditor
            value={field.value || ""}
            onChange={field.onChange}
            hasError={Boolean(errors.rulesRichText)}
          />
        )}
      />

      {errors.rulesRichText && (
        <Typography sx={{ fontSize: 11, color: "#f87171", mt: 0.25, fontFamily: "'DM Mono', monospace" }}>
          {errors.rulesRichText.message}
        </Typography>
      )}
    </Box>
  );
}