import type { MeetingListItem } from "@/app/meeting";

export function getMeetingDurationLabel(meeting: MeetingListItem): string | null {
  if (!meeting.createdAt || !meeting.updatedAt) return null;

  const minutes = Math.round(
    (new Date(meeting.updatedAt).getTime() - new Date(meeting.createdAt).getTime()) / 60000,
  );

  if (minutes <= 0) return null;

  return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} hr`;
}
