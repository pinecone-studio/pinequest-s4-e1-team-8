import type { MeetingRoomListItem } from "./types/meeting-room.types";

export const predefinedMeetingRooms = [
  {
    createdAt: 0, 
    id: "design-review",
    isDefault: true,
    meetingId: "meeting-design-review",
    roomName: "Design Review",
  },
  {
    createdAt: 0,
    id: "daily-standup",
    isDefault: true,
    meetingId: "meeting-standup",
    roomName: "Daily Standup",
  },
  {
    createdAt: 0,
    id: "engineering",
    isDefault: true,
    meetingId: "meeting-engineering",
    roomName: "Engineering",
  },
  {
    createdAt: 0,
    id: "product-sync",
    isDefault: true,
    meetingId: "meeting-product",
    roomName: "Product Sync",
  },
] satisfies MeetingRoomListItem[];
