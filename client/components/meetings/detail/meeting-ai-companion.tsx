"use client";

import {
  ASSISTANT_SUGGESTIONS,
  buildAssistantIntro,
  buildAssistantReply,
  type AssistantContext,
  type AssistantMessage,
} from "@/lib/meetings/meeting-assistant";
import { MicIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type MeetingAiCompanionProps = {
  context: AssistantContext;
};

export const MeetingAiCompanion = ({ context }: MeetingAiCompanionProps) => {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [buildAssistantIntro(context)]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: trimmed }]);
    setInput("");
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [...current, buildAssistantReply(trimmed, context)]);
      setIsThinking(false);
    }, 600);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-zinc-100 pb-4 dark:border-white/5">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SparklesIcon className="size-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Brisk AI assistant</span>
          <span className="text-xs text-muted-foreground">Ask anything about this meeting</span>
        </div>
      </header>

      <div ref={feedRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4 scrollbar-none">
        {messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-3.5 py-2 text-sm text-white"
            >
              {message.text}
            </div>
          ) : (
            <div key={message.id} className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
              <p>{message.text}</p>
              {message.bullets ? (
                <ul className="flex flex-col gap-1.5">
                  {message.bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span className="min-w-0 flex-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ),
        )}
        {isThinking ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-current" />
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {ASSISTANT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-foreground/10 transition-all duration-200 hover:text-foreground hover:ring-primary/30"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-2xl bg-card px-2 py-1.5 ring-1 ring-inset ring-foreground/10 transition-all duration-200 focus-within:ring-primary/40"
        >
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
            aria-label="Dictate message"
          >
            <MicIcon className="size-4" />
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Brisk AI..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/80 disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
