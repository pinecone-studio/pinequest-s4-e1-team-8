"use client";

import { Check, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { parseMeetingSummary } from "../utils/parse-meeting-summary";
import type { MeetingSummaryContent } from "../types/meeting-summary.types";

type MeetingSummarySidebarCardProps = {
  isLoading: boolean;
  summary?: string | null;
};

const buildSummaryText = (content: MeetingSummaryContent | null) => {
  if (!content) return "";

  const sections: string[] = [];

  if (content.mainTopics.length) {
    sections.push(content.mainTopics.join(" "));
  }

  if (content.keyDecisions.length) {
    sections.push(`Key decisions: ${content.keyDecisions.join(" ")}`);
  }

  if (content.actionItems.length) {
    sections.push(
      `Action items: ${content.actionItems
        .map((item) => `${item.owner} – ${item.action}`)
        .join(" ")}`,
    );
  }

  return sections.join(" ");
};

export const MeetingSummarySidebarCard = ({
  isLoading,
  summary,
}: MeetingSummarySidebarCardProps) => {
  const derivedSummary = buildSummaryText(parseMeetingSummary(summary));
  const placeholder = isLoading
    ? "Generating summary from the live transcript..."
    : "The summary will appear here once the conversation has enough context.";
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(derivedSummary);

  useEffect(() => {
    if (isEditing) return;
    setValue(derivedSummary);
  }, [derivedSummary, isEditing]);

  return (
    <section className="relative rounded-2xl border border-emerald-100/50 bg-emerald-50/60 p-4 pb-12 transition-all duration-200">
      <h3 className="text-sm font-semibold text-emerald-950">Summary</h3>
      {isEditing ? (
        <textarea
          className="mt-2 w-full resize-none rounded-xl border border-emerald-200/60 bg-white/70 p-2 text-sm leading-relaxed text-emerald-950/80 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-300"
          onChange={(event) => setValue(event.target.value)}
          rows={6}
          value={value}
        />
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-emerald-950/70">
          {value || placeholder}
        </p>
      )}
      <button
        aria-label={isEditing ? "Save summary" : "Edit summary"}
        className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/70 text-emerald-700 shadow-sm transition-all duration-200 hover:bg-white"
        onClick={() => setIsEditing((current) => !current)}
        type="button"
      >
        {isEditing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
      </button>
    </section>
  );
};
