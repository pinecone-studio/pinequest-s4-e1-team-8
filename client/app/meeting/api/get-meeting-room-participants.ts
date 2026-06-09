import { MEETING_ENDPOINTS } from "./meeting-endpoints";
import { meetingApi } from "./meeting-api";

export type MeetingRoomParticipantSummary = {
  identity: string;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  metadata: string;
  name: string;
};

export type MeetingRoomParticipantsResponse = {
  count: number;
  participants: MeetingRoomParticipantSummary[];
};

export const getMeetingRoomParticipants = (roomName: string) =>
  meetingApi<MeetingRoomParticipantsResponse>(
    MEETING_ENDPOINTS.roomParticipants(roomName),
  );
