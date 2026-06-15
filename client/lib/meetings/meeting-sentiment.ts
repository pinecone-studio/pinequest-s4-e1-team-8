import type { MeetingListItem } from "@/app/meeting";

export type MeetingSentiment = {
  positive: number;
  neutral: number;
  negative: number;
};

const SENTIMENT_PROFILES: MeetingSentiment[] = [
  { neutral: 53, positive: 43, negative: 4 },
  { neutral: 48, positive: 39, negative: 13 },
  { neutral: 61, positive: 31, negative: 8 },
  { neutral: 57, positive: 36, negative: 7 },
  { neutral: 45, positive: 50, negative: 5 },
];

export const getMeetingSentiment = (meeting: MeetingListItem): MeetingSentiment => {
  const index = meeting.id.charCodeAt(0) % SENTIMENT_PROFILES.length;

  return SENTIMENT_PROFILES[index];
};
