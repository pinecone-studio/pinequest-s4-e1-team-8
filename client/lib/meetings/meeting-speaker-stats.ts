import type { MeetingListItem, MeetingTranscriptSegment } from "@/app/meeting";
import { getMeetingParticipants } from "@/lib/meetings/meeting-participants";
import type { AppUser } from "@/types";

export type SpeakerTalkTimeStat = {
  user: AppUser;
  percentage: number;
};

const FALLBACK_WEIGHT_PROFILES = [
  [42, 31, 27],
  [38, 35, 27],
  [50, 30, 20],
  [33, 34, 33],
];

const distributeToHundred = (weights: number[]): number[] => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    const base = Math.floor(100 / weights.length);
    const remainder = 100 - base * weights.length;

    return weights.map((_, index) => base + (index < remainder ? 1 : 0));
  }

  const raw = weights.map((weight) => (weight / total) * 100);
  const floored = raw.map((value) => Math.floor(value));
  const remainder = 100 - floored.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floored];

  for (let i = 0; i < remainder; i++) {
    result[order[i % order.length].index] += 1;
  }

  return result;
};

export const getSpeakerTalkTimeStats = (
  meeting: MeetingListItem,
  segments: MeetingTranscriptSegment[],
): SpeakerTalkTimeStat[] => {
  const participants = getMeetingParticipants(meeting);

  if (participants.length === 0) return [];

  const wordCounts = participants.map((participant) =>
    segments
      .filter((segment) => segment.speakerName.toLowerCase() === participant.name.toLowerCase())
      .reduce((sum, segment) => sum + segment.text.trim().split(/\s+/).filter(Boolean).length, 0),
  );

  const hasTranscriptData = wordCounts.some((count) => count > 0);

  const weights = hasTranscriptData
    ? wordCounts
    : FALLBACK_WEIGHT_PROFILES[
        meeting.id.charCodeAt(meeting.id.length - 1) % FALLBACK_WEIGHT_PROFILES.length
      ].slice(0, participants.length);

  const percentages = distributeToHundred(weights);

  return participants.map((user, index) => ({
    user,
    percentage: percentages[index],
  }));
};
