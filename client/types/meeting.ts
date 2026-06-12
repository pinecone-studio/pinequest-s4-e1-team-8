import type { AppUser } from "./user";

export type MeetingStatus = "ongoing" | "upcoming" | "ended" | "canceled";

export type Meeting = {
  id: string;
  title: string;
  roomName: string;
  meetingId: string;
  status: MeetingStatus;
  date: string;
  startTime: string;
  endTime: string;
  participants: AppUser[];
  autoTranslate: boolean;
  recordAndSummarize: boolean;
  description?: string;
  highlighted?: boolean;
};

export type ChatMessage = {
  id: string;
  author: AppUser;
  text: string;
  timestamp: string;
  isSelf?: boolean;
};

export type CaptionLine = {
  id: string;
  speaker: string;
  textEn: string;
  textMn: string;
  timestamp: string;
};

export type ActionItem = {
  id: string;
  text: string;
  done: boolean;
  dueLabel?: string;
};

export type JoinRequest = {
  id: string;
  user: AppUser;
};

export type AiSuggestion = {
  id: string;
  triggerText: string;
  title: string;
  actions: Array<{
    id: string;
    label: string;
    kind: "calendar" | "docs" | "sheets";
  }>;
};
