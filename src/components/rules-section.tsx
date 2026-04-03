"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "./modal";
import { motion } from "framer-motion";

interface RulesSectionProps {
  rules: string[] | string;
  title?: string;
}

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInline = (line: string) => {
  const escaped = escapeHtml(line);
  return escaped
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-4 max-w-full rounded-xl border border-white/10" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, (match, text, href) => {
      const external = /^https?:\/\//i.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noreferrer noopener"' : ""} class="text-white underline underline-offset-4 hover:text-white/80">${text}</a>`;
    })
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-[0.9em] text-white/90">$1</code>');
};

const renderMarkdownToHtml = (markdownValue = "") => {
  if (!markdownValue.trim()) return "";

  const lines = markdownValue.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let activeList: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const closeList = () => {
    if (!activeList) return;
    blocks.push(`</${activeList}>`);
    activeList = null;
  };

  const flushCode = () => {
    if (!codeLines.length) return;
    blocks.push(
      `<pre class="rounded-2xl bg-black/60 border border-white/10 p-4 overflow-x-auto mb-4"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
    );
    codeLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inCodeBlock) codeLines.push("");
      else closeList();
      continue;
    }

    if (line === "```" || line === "~~~") {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      closeList();
      blocks.push("<hr class=\"my-6 border-white/10\" />");
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const sizeClass =
        level === 1
          ? "text-3xl md:text-4xl font-bold mb-4"
          : level === 2
            ? "text-2xl md:text-3xl font-bold mb-4"
            : level === 3
              ? "text-xl md:text-2xl font-semibold mb-3"
              : level === 4
                ? "text-lg md:text-xl font-semibold mb-3"
                : level === 5
                  ? "text-base md:text-lg font-semibold mb-2"
                  : "text-sm md:text-base font-semibold mb-2";
      blocks.push(
        `<h${level} class="${sizeClass} text-white">${renderInline(headingMatch[2])}</h${level}>`,
      );
      continue;
    }

    const unordered = line.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      if (activeList !== "ul") {
        closeList();
        activeList = "ul";
        blocks.push('<ul class="list-disc ml-5 space-y-2 mb-4 text-white/75">');
      }
      blocks.push(`<li class="leading-relaxed">${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      if (activeList !== "ol") {
        closeList();
        activeList = "ol";
        blocks.push('<ol class="list-decimal ml-5 space-y-2 mb-4 text-white/75">');
      }
      blocks.push(`<li class="leading-relaxed">${renderInline(ordered[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s*(.+)$/);
    if (quote) {
      closeList();
      blocks.push(
        `<blockquote class="border-l-4 border-white/20 pl-4 italic text-white/70 mb-4">${renderInline(quote[1])}</blockquote>`,
      );
      continue;
    }

    closeList();
    blocks.push(`<p class="text-white/75 leading-relaxed mb-3">${renderInline(rawLine)}</p>`);
  }

  if (inCodeBlock) flushCode();
  closeList();

  return blocks.join("\n");
};

export default function RulesSection({
  rules,
  title = "Rules & Guidelines",
}: RulesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const markdownSource = useMemo(
    () => (Array.isArray(rules) ? rules.join("\n") : String(rules || "")),
    [rules],
  );
  const previewHtml = useMemo(
    () => renderMarkdownToHtml(markdownSource.split(/\r?\n/).filter(Boolean).slice(0, 12).join("\n")),
    [markdownSource],
  );
  const fullHtml = useMemo(() => renderMarkdownToHtml(markdownSource), [markdownSource]);
  const hasMore = markdownSource.split(/\r?\n/).filter(Boolean).length > 12;

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-px bg-white/40"></div>
        <h2 className="text-2xl tracking-widest uppercase font-medium text-white/80">{title}</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />

      {hasMore && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-fit underline text-sm font-mono uppercase tracking-[0.2em] text-white/70 hover:text-white/40 transition-all duration-300 group"
        >
          <span className="flex items-center cursor-pointer">
            View All Rules
            <svg 
              className="ml-3 group-hover:translate-x-1 transition-transform" 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
      >
        <div className="space-y-10 py-4">
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: fullHtml }} />
          
          <div className="pt-16 mt-16 border-t border-white/5 flex flex-col items-center space-y-4">
             <div className="flex items-center space-x-4 opacity-20">
               <div className="h-px w-8 bg-white" />
               <p className="text-[10px] font-mono text-white uppercase tracking-[0.5em]">
                 Neutron Space Protocol
               </p>
               <div className="h-px w-8 bg-white" />
             </div>
             <p className="text-[8px] font-mono text-white/10 uppercase tracking-[1em]">
               System Integrity Verified • Access Granted
             </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
