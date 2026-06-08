import type { MeetingSummaryContent } from "../types/meeting-summary.types";

const toStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const toActionItems = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      action: typeof item.action === "string" ? item.action.trim() : "",
      owner: typeof item.owner === "string" && item.owner.trim() ? item.owner.trim() : "Unassigned",
    }))
    .filter((item) => item.action.length > 0);
};

// The Groq summary is stored as a raw JSON string with the shape
// { mainTopics: string[], keyDecisions: string[], actionItems: { owner, action }[] }.
// Parse it defensively since the model output, transcription status, or stored
// value could be missing, empty, or malformed.
export const parseMeetingSummary = (
  raw: string | null | undefined,
): MeetingSummaryContent | null => {
  if (!raw || !raw.trim()) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const candidate = parsed as Record<string, unknown>;
  const content: MeetingSummaryContent = {
    actionItems: toActionItems(candidate.actionItems),
    keyDecisions: toStringList(candidate.keyDecisions),
    mainTopics: toStringList(candidate.mainTopics),
  };

  const isEmpty =
    content.mainTopics.length === 0 &&
    content.keyDecisions.length === 0 &&
    content.actionItems.length === 0;

  return isEmpty ? null : content;
};
