import type { Meeting } from "@/types";

export const TODAY = "2026-06-12";

export function meetingJoinHref(meeting: Meeting) {
  const params = new URLSearchParams({
    meetingId: meeting.meetingId,
    roomName: meeting.roomName,
  });
  return `/meeting?${params.toString()}`;
}

export function formatMeetingDate(date: string) {
  if (date === TODAY) return "Today";

  const today = new Date(`${TODAY}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 1) return "Tomorrow";

  return target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatMeetingDateLong(date: string) {
  if (date === TODAY) return "Today";

  const today = new Date(`${TODAY}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 1) return "Tomorrow";

  return target.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
