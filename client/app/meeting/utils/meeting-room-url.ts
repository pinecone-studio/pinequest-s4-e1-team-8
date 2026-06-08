import type { MeetingRoomListItem } from "../types/meeting-room.types";

export const getMeetingRoomHref = (room: MeetingRoomListItem) => {
  const params = new URLSearchParams({
    meetingId: room.meetingId,
    roomName: room.roomName,
  });

  return `/meeting?${params.toString()}`;
};

export const getMeetingRoomSelectionKey = (
  room: Pick<MeetingRoomListItem, "meetingId" | "roomName">,
) => `${room.meetingId}:${room.roomName}`;
