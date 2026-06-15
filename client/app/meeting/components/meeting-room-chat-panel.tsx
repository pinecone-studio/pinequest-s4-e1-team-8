"use client";

import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type Room,
} from "livekit-client";
import { Mic, MicOff, Send, Smile } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { MeetingSessionParticipant } from "./meeting-session-provider";
import { getParticipantDisplayName } from "./participant-tile";

const CHAT_TOPIC = "meeting-chat";
const MAX_MESSAGE_LENGTH = 2000;

type MeetingChatPayload = {
  id: string;
  senderAvatarUrl?: string;
  senderIdentity: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: "meeting-chat-message";
};

type MeetingChatMessage = MeetingChatPayload & {
  isLocal: boolean;
};

type MeetingRoomChatPanelProps = {
  connectionState: ConnectionState;
  participants: MeetingSessionParticipant[];
  room: Room | null;
};

type ChatTab = "room" | "participants";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const AVATAR_GRADIENTS = [
  "from-emerald-400 to-emerald-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-cyan-400 to-cyan-600",
];

const createMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

const formatMessageTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const getAvatarGradient = (identity: string) => {
  let hash = 0;
  for (let index = 0; index < identity.length; index += 1) {
    hash = (hash * 31 + identity.charCodeAt(index)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

const parseChatPayload = (payload: Uint8Array): MeetingChatPayload | null => {
  try {
    const parsed = JSON.parse(textDecoder.decode(payload)) as Partial<MeetingChatPayload>;

    if (
      parsed.type !== "meeting-chat-message" ||
      typeof parsed.id !== "string" ||
      typeof parsed.senderIdentity !== "string" ||
      typeof parsed.senderName !== "string" ||
      typeof parsed.text !== "string" ||
      typeof parsed.timestamp !== "number" ||
      !parsed.id ||
      !parsed.senderIdentity ||
      !parsed.senderName ||
      !parsed.text.trim()
    ) {
      return null;
    }

    return {
      id: parsed.id,
      senderAvatarUrl:
        typeof parsed.senderAvatarUrl === "string"
          ? parsed.senderAvatarUrl
          : undefined,
      senderIdentity: parsed.senderIdentity,
      senderName: parsed.senderName,
      text: parsed.text.slice(0, MAX_MESSAGE_LENGTH),
      timestamp: parsed.timestamp,
      type: "meeting-chat-message",
    };
  } catch {
    return null;
  }
};

export const MeetingRoomChatPanel = ({
  connectionState,
  participants,
  room,
}: MeetingRoomChatPanelProps) => {
  const [activeTab, setActiveTab] = useState<ChatTab>("room");
  const [messages, setMessages] = useState<MeetingChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isConnected = connectionState === ConnectionState.Connected;
  const localParticipant = room?.localParticipant ?? null;
  const localMeetingParticipant = participants.find((participant) => participant.isLocal);
  const participantByIdentity = useMemo(
    () => new Map(participants.map((participant) => [participant.identity, participant])),
    [participants],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: Participant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== CHAT_TOPIC) return;

      const parsed = parseChatPayload(payload);
      if (!parsed || parsed.senderIdentity === room.localParticipant.identity) return;

      const participantDisplayName = participant
        ? getParticipantDisplayName(participant, parsed.senderName)
        : parsed.senderName;
      const knownParticipant = participantByIdentity.get(parsed.senderIdentity);
      const message: MeetingChatMessage = {
        ...parsed,
        senderAvatarUrl: knownParticipant?.avatarUrl ?? parsed.senderAvatarUrl,
        senderName: participantDisplayName,
        isLocal: false,
      };

      setMessages((current) => {
        if (current.some((existing) => existing.id === message.id)) return current;
        return [...current, message];
      });
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [participantByIdentity, room]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!room || !localParticipant || !isConnected || !text) return;

    const message: MeetingChatMessage = {
      id: createMessageId(),
      senderAvatarUrl: localMeetingParticipant?.avatarUrl,
      senderIdentity: localParticipant.identity,
      senderName: getParticipantDisplayName(localParticipant),
      text: text.slice(0, MAX_MESSAGE_LENGTH),
      timestamp: Date.now(),
      type: "meeting-chat-message",
      isLocal: true,
    };

    setSendError("");

    try {
      await localParticipant.publishData(
        textEncoder.encode(
          JSON.stringify({
            id: message.id,
            senderAvatarUrl: message.senderAvatarUrl,
            senderIdentity: message.senderIdentity,
            senderName: message.senderName,
            text: message.text,
            timestamp: message.timestamp,
            type: message.type,
          } satisfies MeetingChatPayload),
        ),
        { reliable: true, topic: CHAT_TOPIC },
      );

      setMessages((current) => [...current, message]);
      setDraft("");
    } catch (caughtError) {
      console.warn("[meeting] Chat message failed to send", caughtError);
      setSendError("Message could not be sent.");
    }
  }, [draft, isConnected, localMeetingParticipant?.avatarUrl, localParticipant, room]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200">
      <div className="shrink-0 p-3">
        <div className="flex rounded-full bg-zinc-100 p-1">
          <button
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition-all duration-200",
              activeTab === "room"
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900",
            )}
            onClick={() => setActiveTab("room")}
            type="button"
          >
            Room Chat
          </button>
          <button
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition-all duration-200",
              activeTab === "participants"
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900",
            )}
            onClick={() => setActiveTab("participants")}
            type="button"
          >
            Participant
          </button>
        </div>
      </div>

      {activeTab === "room" ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-24 pt-1">
            {messages.length ? (
              messages.map((message) => (
                <div
                  className={cn("flex flex-col gap-1", message.isLocal && "items-end")}
                  key={message.id}
                >
                  <span className="text-xs text-zinc-400">
                    {message.isLocal ? "You" : message.senderName} ·{" "}
                    {formatMessageTime(message.timestamp)}
                  </span>
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.isLocal
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-zinc-100 text-zinc-900",
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-zinc-400">
                No messages yet
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="absolute inset-x-0 bottom-0 flex flex-col gap-2 rounded-b-2xl border-t border-zinc-200 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            {sendError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {sendError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                aria-label="Add emoji"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900"
                type="button"
              >
                <Smile className="size-4" />
              </button>
              <input
                className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isConnected}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isConnected ? "Type a message" : "Connecting..."}
                value={draft}
              />
              <button
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isConnected || !draft.trim()}
                type="submit"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4 pt-1">
          {participants.map((participant) => (
            <div
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-zinc-50"
              key={participant.identity}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                  getAvatarGradient(participant.identity),
                )}
              >
                {getInitials(participant.displayName)}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                {participant.isLocal ? "You" : participant.displayName}
              </span>
              {participant.isMicrophoneEnabled ? (
                <Mic className="size-4 text-emerald-600" />
              ) : (
                <MicOff className="size-4 text-zinc-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
