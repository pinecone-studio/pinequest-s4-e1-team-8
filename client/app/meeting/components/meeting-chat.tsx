"use client";

import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type Room,
} from "livekit-client";
import {
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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

type MeetingChatProps = {
  connectionState: ConnectionState;
  participants: MeetingSessionParticipant[];
  room: Room | null;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

export function MeetingChat({
  connectionState,
  participants,
  room,
}: MeetingChatProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [hasInitializedLayout, setHasInitializedLayout] = useState(false);
  const [messages, setMessages] = useState<MeetingChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isConnected = connectionState === ConnectionState.Connected;
  const localParticipant = room?.localParticipant ?? null;
  const localMeetingParticipant = participants.find((participant) => participant.isLocal);
  const participantByIdentity = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.identity, participant]),
      ),
    [participants],
  );

  useEffect(() => {
    if (hasInitializedLayout || typeof window === "undefined") return;

    setIsOpen(window.matchMedia("(min-width: 1024px)").matches);
    setHasInitializedLayout(true);
  }, [hasInitializedLayout]);

  useEffect(() => {
    if (!isOpen) return;

    setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, messages]);

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

      if (!isOpen) {
        setUnreadCount((current) => current + 1);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [isOpen, participantByIdentity, room]);

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
      setIsOpen(true);
    } catch (caughtError) {
      console.warn("[meeting] Chat message failed to send", caughtError);
      setSendError("Message could not be sent.");
    }
  }, [
    draft,
    isConnected,
    localMeetingParticipant?.avatarUrl,
    localParticipant,
    room,
  ]);

  const panel = (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-white/[0.08] bg-[#111118] text-white shadow-2xl shadow-black/30",
        "fixed inset-x-0 bottom-0 z-50 h-[76vh] rounded-t-3xl border-t p-0 lg:static lg:h-full lg:w-[340px] lg:shrink-0 lg:rounded-3xl lg:border",
        !isOpen && "hidden lg:flex lg:w-14",
      )}
    >
      {isOpen ? (
        <>
          <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">Chat</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isConnected ? "Room messages" : "Connect to send"}
              </p>
            </div>
            <button
              className="inline-flex size-9 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40"
              onClick={() => setIsOpen(false)}
              title="Collapse chat"
              type="button"
            >
              <X className="size-4 lg:hidden" />
              <PanelRightClose className="hidden size-4 lg:block" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length ? (
              messages.map((message) => (
                <article
                  className={cn(
                    "flex gap-3",
                    message.isLocal && "flex-row-reverse",
                  )}
                  key={message.id}
                >
                  <Avatar className="mt-0.5 size-8 border border-white/10 bg-white/[0.04]">
                    {message.senderAvatarUrl ? (
                      <AvatarImage
                        alt={message.senderName}
                        src={message.senderAvatarUrl}
                      />
                    ) : null}
                    <AvatarFallback className="bg-violet-500/15 text-xs font-semibold text-violet-100">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "min-w-0 max-w-[78%]",
                      message.isLocal && "text-right",
                    )}
                  >
                    <div
                      className={cn(
                        "flex min-w-0 items-baseline gap-2",
                        message.isLocal && "justify-end",
                      )}
                    >
                      <span className="truncate text-xs font-semibold text-zinc-100">
                        {message.isLocal ? "You" : message.senderName}
                      </span>
                      <time className="shrink-0 text-[11px] text-zinc-500">
                        {formatMessageTime(message.timestamp)}
                      </time>
                    </div>
                    <p
                      className={cn(
                        "mt-1 whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-sm leading-5",
                        message.isLocal
                          ? "bg-violet-500/25 text-violet-50"
                          : "bg-white/[0.06] text-zinc-100",
                      )}
                    >
                      {message.text}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-zinc-500">
                No messages yet
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="shrink-0 border-t border-white/[0.08] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            {sendError ? (
              <p className="mb-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {sendError}
              </p>
            ) : null}
            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2">
              <textarea
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isConnected}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey) return;
                  event.preventDefault();
                  void sendMessage();
                }}
                placeholder={isConnected ? "Message the room" : "Connecting..."}
                rows={1}
                value={draft}
              />
              <button
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isConnected || !draft.trim()}
                title="Send message"
                type="submit"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <button
          className="relative flex h-full w-full items-start justify-center rounded-3xl pt-4 text-zinc-300 transition hover:bg-white/[0.04] hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500/40"
          onClick={() => setIsOpen(true)}
          title="Open chat"
          type="button"
        >
          <PanelRightOpen className="size-5" />
          {unreadCount ? (
            <span className="absolute right-1.5 top-1.5 min-w-5 rounded-full bg-violet-500 px-1.5 py-0.5 text-center text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      )}
    </aside>
  );

  return (
    <>
      {panel}
      {!isOpen ? (
        <button
          className="fixed bottom-5 right-5 z-40 inline-flex size-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-black/30 transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/40 lg:hidden"
          onClick={() => setIsOpen(true)}
          title="Open chat"
          type="button"
        >
          <MessageCircle className="size-5" />
          {unreadCount ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </>
  );
}
