import type { MeetingListItem } from "@/app/meeting";
import { teams } from "@/lib/mock-data";

export type MeetingFolder = {
  id: string;
  label: string;
};

export const MEETING_FOLDERS: MeetingFolder[] = teams.map((team) => ({
  id: team.id,
  label: `${team.tag} team`,
}));

export function getMeetingFolder(meeting: MeetingListItem): MeetingFolder {
  const index = meeting.id.charCodeAt(meeting.id.length - 1) % MEETING_FOLDERS.length;
  return MEETING_FOLDERS[index];
}
