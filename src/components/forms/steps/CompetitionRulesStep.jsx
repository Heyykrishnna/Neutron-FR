"use client";

import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { FieldLabel } from "./CompetitionBasicInfoStep";

// ─── Escape helpers ───────────────────────────────────────────────────────────

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ─── Inline markdown (bold, italic, code, links) ─────────────────────────────

const renderInline = (line) => {
  const escaped = escapeHtml(line);
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
    );
};

// ─── Block-level markdown → HTML ─────────────────────────────────────────────

const renderMarkdownToHtml = (markdownValue = "") => {
  if (!markdownValue.trim()) return "";

  // Normalise line endings
  const lines = markdownValue.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];

  // Parser state
  let inFencedCode = false;
  let fenceLang = "";
  let codeLines = [];
  let listStack = []; // [{type:'ul'|'ol', indent:number}]

  // ── helpers ──────────────────────────────────────────────────────────────

  const currentList = () => listStack[listStack.length - 1] ?? null;

  /** Close list levels whose indent is deeper than `toIndent`. */
  const closeListsDeeper = (toIndent) => {
    while (listStack.length && currentList().indent > toIndent) {
      blocks.push(`</${listStack.pop().type}>`);
    }
  };

  /** Close all open lists. */
  const closeAllLists = () => {
    while (listStack.length) {
      blocks.push(`</${listStack.pop().type}>`);
    }
  };

  /** Push an opening list tag and track it. */
  const openList = (type, indent) => {
    blocks.push(`<${type}>`);
    listStack.push({ type, indent });
  };

  // ── line loop ─────────────────────────────────────────────────────────────

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // Preserve raw for code blocks; use trimmed for block detection
    const trimmed = raw.trimEnd();

    // ── fenced code block ──────────────────────────────────────────────────
    const fenceMatch = trimmed.match(/^(\s*)```(\w*)$/);
    if (fenceMatch) {
      if (inFencedCode) {
        // Close fence
        const langAttr = fenceLang ? ` class="language-${fenceLang}"` : "";
        blocks.push(
          `<pre><code${langAttr}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        codeLines = [];
        fenceLang = "";
        inFencedCode = false;
      } else {
        // Open fence
        closeAllLists();
        fenceLang = fenceMatch[2] || "";
        inFencedCode = true;
      }
      continue;
    }

    if (inFencedCode) {
      codeLines.push(raw); // Keep raw to preserve indentation inside code
      continue;
    }

    // ── indented code block (4 spaces or 1 tab) ───────────────────────────
    const indentedCode = raw.match(/^(?:    |\t)(.*)$/);
    if (indentedCode) {
      closeAllLists();
      // Collect consecutive indented lines
      const codeSegment = [indentedCode[1]];
      while (i + 1 < lines.length && lines[i + 1].match(/^(?:    |\t)/)) {
        i++;
        codeSegment.push(lines[i].replace(/^(?:    |\t)/, ""));
      }
      blocks.push(
        `<pre><code>${escapeHtml(codeSegment.join("\n"))}</code></pre>`,
      );
      continue;
    }

    // ── blank line ─────────────────────────────────────────────────────────
    if (!trimmed.trim()) {
      // Don't close lists on blank lines — only close if next non-blank
      // line is not a list item at the same or deeper indent.
      // Peek ahead to decide.
      let nextNonBlank = null;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim()) {
          nextNonBlank = lines[j];
          break;
        }
      }
      const nextIsListItem =
        nextNonBlank !== null &&
        (nextNonBlank.match(/^(\s*)[-*]\s+/) ||
          nextNonBlank.match(/^(\s*)\d+\.\s+/));
      if (!nextIsListItem) {
        closeAllLists();
      }
      continue;
    }

    // ── measure leading indent ────────────────────────────────────────────
    const indentMatch = raw.match(/^(\s*)/);
    const indentStr = indentMatch ? indentMatch[1] : "";
    // Convert tabs to 2 spaces for indent counting
    const indent = indentStr.replace(/\t/g, "  ").length;
    const content = raw.slice(indentStr.length).trimEnd();

    // ── unordered list item ───────────────────────────────────────────────
    const ulMatch = content.match(/^[-*+]\s+([\s\S]*)$/);
    if (ulMatch) {
      // Close deeper lists
      closeListsDeeper(indent);
      // Open new list if needed
      if (!currentList() || currentList().indent < indent) {
        openList("ul", indent);
      } else if (currentList().type !== "ul") {
        blocks.push(`</${listStack.pop().type}>`);
        openList("ul", indent);
      }
      blocks.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    // ── ordered list item ─────────────────────────────────────────────────
    const olMatch = content.match(/^\d+[.)]\s+([\s\S]*)$/);
    if (olMatch) {
      closeListsDeeper(indent);
      if (!currentList() || currentList().indent < indent) {
        openList("ol", indent);
      } else if (currentList().type !== "ol") {
        blocks.push(`</${listStack.pop().type}>`);
        openList("ol", indent);
      }
      blocks.push(`<li>${renderInline(olMatch[1])}</li>`);
      continue;
    }

    // ── non-list line → close all lists ───────────────────────────────────
    closeAllLists();

    // ── headings ──────────────────────────────────────────────────────────
    const headingMatch = content.match(/^(#{1,6})\s+([\s\S]*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // ── horizontal rule ───────────────────────────────────────────────────
    if (/^[-*_]{3,}$/.test(content)) {
      blocks.push("<hr />");
      continue;
    }

    // ── blockquote ────────────────────────────────────────────────────────
    if (content.startsWith("> ")) {
      blocks.push(`<blockquote>${renderInline(content.slice(2))}</blockquote>`);
      continue;
    }

    // ── paragraph ─────────────────────────────────────────────────────────
    blocks.push(`<p>${renderInline(content)}</p>`);
  }

  // Close any dangling fenced code block
  if (inFencedCode) {
    const langAttr = fenceLang ? ` class="language-${fenceLang}"` : "";
    blocks.push(
      `<pre><code${langAttr}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
    );
  }

  closeAllLists();

  return blocks.join("\n");
};

// ─── Editor component ─────────────────────────────────────────────────────────

function RulesMarkdownEditor({ value, onChange, hasError }) {
  const markdownValue = value || "";
  const previewHtml = renderMarkdownToHtml(markdownValue);

  return (
    <Box
      sx={{
        border: hasError
          ? "1px solid rgba(248,113,113,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          minHeight: 320,
        }}
      >
        {/* ── Left: textarea ── */}
        <Box
          sx={{
            borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.06)" },
            borderBottom: {
              xs: "1px solid rgba(255,255,255,0.06)",
              md: "none",
            },
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Markdown Input
            </Typography>
          </Box>
          <textarea
            value={markdownValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              "# Rules\n\n- Rule 1\n- Rule 2\n\nUse **bold**, *italic*, `code`, and [links](https://example.com)"
            }
            spellCheck={false}
            style={{
              flex: 1,
              width: "100%",
              minHeight: 278,
              border: "none",
              resize: "vertical",
              padding: "14px 16px",
              outline: "none",
              background: "transparent",
              color: "rgba(255,255,255,0.86)",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              lineHeight: 1.7,
              boxSizing: "border-box",
              tabSize: 2,
              // Preserve all whitespace faithfully
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "auto",
            }}
          />
        </Box>

        {/* ── Right: preview ── */}
        <Box
          sx={{
            background: "rgba(255,255,255,0.015)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Live Preview
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              flex: 1,
              minHeight: 278,
              overflowX: "auto",
              color: "rgba(255,255,255,0.78)",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              lineHeight: 1.7,
              "& h1,& h2,& h3,& h4,& h5,& h6": {
                color: "#f4f4f5",
                margin: "12px 0 6px",
                lineHeight: 1.3,
              },
              "& h1": { fontSize: 22, fontWeight: 700 },
              "& h2": { fontSize: 18, fontWeight: 600 },
              "& h3": { fontSize: 15, fontWeight: 600 },
              "& h4": { fontSize: 14, fontWeight: 600 },
              "& p": { margin: "6px 0" },
              // Lists — use standard browser defaults for indentation
              "& ul": {
                margin: "6px 0",
                paddingLeft: "1.5em",
                listStyleType: "disc",
              },
              "& ol": {
                margin: "6px 0",
                paddingLeft: "1.5em",
                listStyleType: "decimal",
              },
              // Nested lists tighter
              "& ul ul, & ol ol, & ul ol, & ol ul": {
                margin: "2px 0",
              },
              "& li": { marginBottom: "3px" },
              // Inline code
              "& :not(pre) > code": {
                background: "rgba(255,255,255,0.08)",
                borderRadius: "4px",
                padding: "1px 5px",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: "rgba(255,255,255,0.9)",
              },
              // Code blocks
              "& pre": {
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                padding: "12px 14px",
                overflowX: "auto",
                margin: "8px 0",
              },
              "& pre code": {
                background: "transparent",
                padding: 0,
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                color: "rgba(255,255,255,0.86)",
                // Critical: preserve all whitespace & indentation inside pre
                whiteSpace: "pre",
              },
              "& blockquote": {
                borderLeft: "3px solid rgba(168,85,247,0.7)",
                paddingLeft: "12px",
                margin: "8px 0",
                color: "rgba(255,255,255,0.7)",
              },
              "& a": { color: "#c084fc", textDecoration: "underline" },
              "& hr": {
                border: "none",
                borderTop: "1px solid rgba(255,255,255,0.12)",
                margin: "12px 0",
              },
              "& strong": { color: "#f4f4f5", fontWeight: 600 },
              "& em": { fontStyle: "italic", color: "rgba(255,255,255,0.85)" },
              "& s": { opacity: 0.5 },
            }}
          >
            {previewHtml ? (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <Typography
                sx={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Live preview will appear here as you type markdown.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Step component ───────────────────────────────────────────────────────────

export default function CompetitionRulesStep({ control, errors }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <FieldLabel>Rules & Guidelines</FieldLabel>
        <Typography
          sx={{
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Markdown editor with live preview
        </Typography>
      </Box>

      <Controller
        name="rulesRichText"
        control={control}
        render={({ field }) => (
          <RulesMarkdownEditor
            value={field.value || ""}
            onChange={field.onChange}
            hasError={Boolean(errors.rulesRichText)}
          />
        )}
      />

      {errors.rulesRichText && (
        <Typography
          sx={{
            fontSize: 11,
            color: "#f87171",
            mt: 0.25,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {errors.rulesRichText.message}
        </Typography>
      )}
    </Box>
  );
}
