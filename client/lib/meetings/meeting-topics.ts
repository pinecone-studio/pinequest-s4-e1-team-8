import type { MeetingListItem } from "@/app/meeting";
import type { MeetingSummaryContent } from "@/app/meeting/types/meeting-summary.types";

const FALLBACK_TOPICS = [
  "Competitor analysis",
  "Design trends",
  "Wireframe review",
  "Roadmap prioritization",
  "Budget planning",
  "User feedback synthesis",
  "Onboarding flow",
  "Launch checklist",
];

export const getMeetingTopics = (
  meeting: MeetingListItem,
  summary: MeetingSummaryContent | null,
): string[] => {
  if (summary?.mainTopics?.length) return summary.mainTopics;

  const offset = meeting.id.charCodeAt(0) % FALLBACK_TOPICS.length;
  const count = 3 + (meeting.id.charCodeAt(meeting.id.length - 1) % 3);

  return Array.from({ length: count }, (_, index) => FALLBACK_TOPICS[(offset + index) % FALLBACK_TOPICS.length]);
};
