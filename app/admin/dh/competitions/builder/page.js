"use client";

import { Box, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CompetitionFormModal from "@/src/components/forms/CompetitionFormModal";

export default function CompetitionBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = searchParams.get("competitionId");

  const competition = competitionId ? { id: competitionId } : null;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400 }}>
      <Box sx={{ mb: 2.5 }}>
        <button
          type="button"
          onClick={() => router.push("/admin/dh/competitions")}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.7)",
            borderRadius: 8,
            padding: "8px 12px",
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
          Back to Competitions
        </button>
      </Box>

      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 600,
          color: "#f4f4f5",
          fontFamily: "'Syne', sans-serif",
          mb: 2,
        }}
      >
        {competitionId ? "Edit Competition" : "Create Competition"}
      </Typography>

      <CompetitionFormModal
        mode="page"
        open
        onClose={() => router.push("/admin/dh/competitions")}
        competition={competition}
      />
    </Box>
  );
}
