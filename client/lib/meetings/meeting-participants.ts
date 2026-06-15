import type { MeetingListItem } from "@/app/meeting";
import { users } from "@/lib/mock-data";
import type { AppUser } from "@/types";

export function getMeetingParticipants(meeting: MeetingListItem): AppUser[] {
  return users.slice(0, 1 + (meeting.id.charCodeAt(0) % 3));
}
