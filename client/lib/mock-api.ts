import {
  users,
  currentUser,
  meetings,
  chatMessages,
  captionLines,
  actionItems,
  joinRequests,
  aiSuggestions,
  notes,
  teams,
  notifications,
  defaultNotificationSettings,
  activity,
} from "./mock-data";
import type {
  AppUser,
  Meeting,
  MeetingStatus,
  ChatMessage,
  CaptionLine,
  ActionItem,
  JoinRequest,
  AiSuggestion,
  Note,
  Team,
  NotificationItem,
  NotificationSettings,
  ActivityItem,
} from "@/types";

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

// Date.now() alone collides for items created in the same millisecond, which
// produces duplicate React keys. Add a random suffix to keep ids unique.
function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Users

export async function getCurrentUser(): Promise<AppUser> {
  return delay(clone(currentUser), 150);
}

export async function getUsers(): Promise<AppUser[]> {
  return delay(clone(users), 300);
}

// Meetings

export async function getMeetings(status?: MeetingStatus): Promise<Meeting[]> {
  const list = status ? meetings.filter((meeting) => meeting.status === status) : meetings;
  return delay(clone(list), 500);
}

export async function getMeeting(id: string): Promise<Meeting | undefined> {
  return delay(clone(meetings.find((meeting) => meeting.id === id)), 400);
}

export interface ScheduleMeetingInput {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participantIds: string[];
  autoTranslate: boolean;
  recordAndSummarize: boolean;
  description?: string;
}

export async function scheduleMeeting(input: ScheduleMeetingInput): Promise<Meeting> {
  const id = createId("m");
  const meeting: Meeting = {
    id,
    title: input.title,
    roomName: input.title,
    meetingId: `meeting-${id}`,
    status: "upcoming",
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    participants: users.filter((user) => input.participantIds.includes(user.id)),
    autoTranslate: input.autoTranslate,
    recordAndSummarize: input.recordAndSummarize,
    description: input.description,
  };

  meetings.unshift(meeting);
  return delay(clone(meeting), 900);
}

// Meeting room: chat, captions, tasks, join requests, AI suggestions

export async function getChatMessages(): Promise<ChatMessage[]> {
  return delay(clone(chatMessages), 300);
}

export async function sendChatMessage(text: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: createId("c"),
    author: currentUser,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    isSelf: true,
  };

  chatMessages.push(message);
  return delay(clone(message), 250);
}

export async function getCaptionLines(): Promise<CaptionLine[]> {
  return delay(clone(captionLines), 300);
}

export async function getActionItems(): Promise<ActionItem[]> {
  return delay(clone(actionItems), 300);
}

export async function toggleActionItem(id: string): Promise<ActionItem | undefined> {
  const item = actionItems.find((actionItem) => actionItem.id === id);
  if (!item) return delay(undefined, 200);

  item.done = !item.done;
  return delay(clone(item), 300);
}

export async function getJoinRequests(): Promise<JoinRequest[]> {
  return delay(clone(joinRequests), 300);
}

export async function respondToJoinRequest(id: string, accept: boolean): Promise<void> {
  void accept;
  const index = joinRequests.findIndex((request) => request.id === id);
  if (index !== -1) joinRequests.splice(index, 1);
  return delay(undefined, 400);
}

export async function getAiSuggestions(): Promise<AiSuggestion[]> {
  return delay(clone(aiSuggestions), 300);
}

export async function dismissAiSuggestion(id: string): Promise<void> {
  const index = aiSuggestions.findIndex((suggestion) => suggestion.id === id);
  if (index !== -1) aiSuggestions.splice(index, 1);
  return delay(undefined, 200);
}

// Recordings

export async function getRecordings(): Promise<Recording[]> {
  return delay(clone(recordings), 500);
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  return delay(clone(recordings.find((recording) => recording.id === id)), 400);
}

export const PROCESSING_STAGES: ProcessingStage[] = [
  "uploading",
  "noise-canceling",
  "transcribing",
  "summarizing",
];

export async function* runProcessingStages(
  stageDurationMs = 1100
): AsyncGenerator<ProcessingStage> {
  for (const stage of PROCESSING_STAGES) {
    yield stage;
    await delay(undefined, stageDurationMs);
  }
}

export interface CompleteRecordingInput {
  title: string;
  source: RecordingSource;
}

export async function completeRecording(input: CompleteRecordingInput): Promise<Recording> {
  const template = recordings.find((recording) => recording.status === "ready") ?? recordings[0];
  const id = createId("rec");
  const recording: Recording = {
    ...clone(template),
    id,
    title: input.title,
    source: input.source,
    status: "ready",
    createdAt: "Just now",
    durationLabel: input.source === "live" ? "12 min" : "35 min",
  };

  recordings.unshift(recording);
  return delay(clone(recording), 600);
}

// Notes

export async function getNotes(): Promise<Note[]> {
  return delay(clone(notes), 500);
}

export async function getNote(id: string): Promise<Note | undefined> {
  return delay(clone(notes.find((note) => note.id === id)), 350);
}

// Teams

export async function getTeams(): Promise<Team[]> {
  return delay(clone(teams), 500);
}

export async function getTeam(id: string): Promise<Team | undefined> {
  return delay(clone(teams.find((team) => team.id === id)), 400);
}

// Notifications

export async function getNotifications(): Promise<NotificationItem[]> {
  return delay(clone(notifications), 350);
}

export async function markNotificationRead(id: string): Promise<void> {
  const item = notifications.find((notification) => notification.id === id);
  if (item) item.read = true;
  return delay(undefined, 200);
}

export async function markAllNotificationsRead(): Promise<void> {
  notifications.forEach((notification) => {
    notification.read = true;
  });
  return delay(undefined, 250);
}

let notificationSettings: NotificationSettings = clone(defaultNotificationSettings);

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return delay(clone(notificationSettings), 300);
}

export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<NotificationSettings> {
  notificationSettings = clone(settings);
  return delay(clone(notificationSettings), 400);
}

// Dashboard activity feed

export async function getActivity(): Promise<ActivityItem[]> {
  return delay(clone(activity), 450);
}
