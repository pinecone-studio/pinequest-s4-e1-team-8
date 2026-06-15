"use client";

import { cn } from "@/lib/utils";
import { Mic, MicOff, Send, Smile } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { CallParticipant, ChatMessage, ChatTab } from "../types";

type ChatPanelProps = {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  participants: CallParticipant[];
};

export const ChatPanel = ({
  messages,
  onSendMessage,
  participants,
}: ChatPanelProps) => {
  const [activeTab, setActiveTab] = useState<ChatTab>("room");
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = draft.trim();
    if (!text) return;

    onSendMessage(text);
    setDraft("");
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-zinc-200 bg-white">
      <div className="shrink-0 p-3">
        <div className="flex rounded-full bg-zinc-100 p-1">
          <button
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition",
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
              "flex-1 rounded-full py-1.5 text-sm font-medium transition",
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
            {messages.map((message) => (
              <div
                className={cn(
                  "flex flex-col gap-1",
                  message.isOwn && "items-end",
                )}
                key={message.id}
              >
                <span className="text-xs text-zinc-400">
                  {message.author} · {message.timestamp}
                </span>
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.isOwn
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-zinc-100 text-zinc-900",
                  )}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>
          <form
            className="absolute inset-x-0 bottom-0 flex items-center gap-2 rounded-b-[24px] border-t border-zinc-200 bg-white p-3"
            onSubmit={handleSubmit}
          >
            <button
              aria-label="Add emoji"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              type="button"
            >
              <Smile className="size-4" />
            </button>
            <input
              className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-ring/50"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message"
              value={draft}
            />
            <button
              aria-label="Send message"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.trim()}
              type="submit"
            >
              <Send className="size-4" />
            </button>
          </form>
        </>
      ) : (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-4 pt-1">
          {participants.map((participant) => (
            <div
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-zinc-50"
              key={participant.id}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                  participant.avatarGradient,
                )}
              >
                {participant.initial}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                {participant.isSelf ? "You" : participant.name}
              </span>
              {participant.isMicOn ? (
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
