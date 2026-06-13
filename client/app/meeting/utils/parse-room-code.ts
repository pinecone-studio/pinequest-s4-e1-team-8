import { slugifyRoomName } from "./slugify-room-name";

export type ParsedRoomCode = {
  meetingId: string;
  roomName: string;
};

export const parseRoomCodeInput = (input: string): ParsedRoomCode | null => {
  const trimmed = input.trim();

  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const meetingId = url.searchParams.get("meetingId");
    const roomName = url.searchParams.get("roomName");

    if (meetingId && roomName) {
      return { meetingId, roomName };
    }
  } catch {
    // Not a URL, fall through to treating the input as a room title/code.
  }

  const meetingId = slugifyRoomName(trimmed);

  if (!meetingId) return null;

  return { meetingId, roomName: trimmed };
};
