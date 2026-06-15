export type MediaToggle = "mic" | "camera" | "screenShare";

export type RecordingState = "recording" | "paused" | "stopped";

export type CallParticipant = {
  avatarGradient: string;
  id: string;
  initial: string;
  isMicOn: boolean;
  isSelf?: boolean;
  name: string;
};

export type PendingParticipant = {
  id: string;
  name: string;
};

export type CaptionLine = {
  id: string;
  speaker: string;
  text: string;
};

export type ChatTab = "room" | "participants";

export type ChatMessage = {
  author: string;
  id: string;
  isOwn: boolean;
  text: string;
  timestamp: string;
};

export type TaskItem = {
  completed: boolean;
  dueLabel?: string;
  id: string;
  label: string;
};

export type RoomData = {
  captions: CaptionLine[];
  locationLabel: string;
  messages: ChatMessage[];
  participants: CallParticipant[];
  pendingParticipant: PendingParticipant | null;
  roomName: string;
  summary: string;
  tasks: TaskItem[];
};
