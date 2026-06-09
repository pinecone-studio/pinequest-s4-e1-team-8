"use client";

import { clientApi } from "@/app/lib/client-api";
import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import type { AnalyticsWeekly } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const quickQuestions = [
  "Summarize this team's week",
  "What should we prioritize next?",
  "Which tasks are falling behind?",
  "Where are the bottlenecks?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function buildWeeklyQuestion({
  activeTeam,
  weekly,
  teamTasks,
  question,
}: {
  activeTeam: string | null;
  weekly: AnalyticsWeekly | null;
  teamTasks: TaskListItem[];
  question: string;
}) {
  const scope = activeTeam ?? "the workspace";
  const taskLines = teamTasks
    .slice(0, 6)
    .map(
      (task) =>
        `- ${task.title} (${task.status}, ${task.progress}%): ${task.timeLeft || "no deadline"}`,
    )
    .join("\n");

  return [
    `Weekly summary context for ${scope}:`,
    weekly
      ? `Completed: ${weekly.totals.completed}, Started: ${weekly.totals.started}`
      : "Weekly metrics unavailable",
    weekly
      ? `Daily breakdown: ${weekly.days.map((day) => `${day.label} ${day.completed} done`).join(", ")}`
      : "",
    `Team tasks:\n${taskLines || "None"}`,
    "",
    question,
  ]
    .filter(Boolean)
    .join("\n");
}

function welcomeMessage(activeTeam: string | null): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: activeTeam
      ? `Hi! I can help you understand ${activeTeam}'s weekly progress. Pick a suggestion or ask me anything.`
      : "Hi! Select a team above, or ask me about workspace-wide weekly progress.",
  };
}

export function AnalyticsWeekly({
  activeTeam,
  tasks,
  className,
}: {
  activeTeam: string | null;
  tasks: TaskListItem[];
  className?: string;
}) {
  const [weekly, setWeekly] = useState<AnalyticsWeekly | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  const createMessageId = (role: ChatMessage["role"]) => {
    messageIdRef.current += 1;
    return `${role}-${messageIdRef.current}`;
  };

  const teamTasks = useMemo(
    () =>
      activeTeam
        ? tasks.filter((task) => getTaskTeam(task) === activeTeam)
        : tasks,
    [activeTeam, tasks],
  );

  useEffect(() => {
    let cancelled = false;

    setIsLoadingWeekly(true);

    const query = activeTeam
      ? `?team=${encodeURIComponent(activeTeam)}`
      : "";

    clientApi
      .get<{ weekly: AnalyticsWeekly }>(`/analytics/weekly${query}`)
      .then((response) => {
        if (!cancelled) {
          setWeekly(response.data.weekly);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeekly(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingWeekly(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeam]);

  useEffect(() => {
    setMessages([welcomeMessage(activeTeam)]);
  }, [activeTeam]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const { data } = await clientApi.post<{ answer: string }>("/analytics/ask", {
        question: buildWeeklyQuestion({
          activeTeam,
          weekly,
          teamTasks,
          question: trimmed,
        }),
      });

      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          content:
            "Could not get an answer. Is the server running with GEMINI_API_KEY?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async () => {
    const question = input.trim();
    if (!question) return;
    setInput("");
    await ask(question);
  };

  return (
    <section
      className={cn(
        "flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="grid size-7 place-items-center rounded-full bg-violet-100 dark:bg-violet-500/15">
          <Sparkles className="size-3.5 text-violet-700 dark:text-violet-400/80" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground/90">Weekly assistant</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {activeTeam ?? "All teams"}
            {weekly && !isLoadingWeekly
              ? ` · ${weekly.totals.completed} done · ${weekly.totals.started} started`
              : ""}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isLoading ? (
          <div className="flex items-start gap-2">
            <div className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 dark:bg-violet-500/15">
              <Bot className="size-3 text-violet-700 dark:text-violet-400/80" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-secondary px-3 py-2 text-xs text-muted-foreground">
              Thinking...
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-border/50 bg-card/80 px-3 py-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={isLoading}
              onClick={() => void ask(question)}
              className="rounded-full border border-border/50 bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-foreground/80 disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>

        <form
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary px-2 py-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground/90 outline-none placeholder:text-muted-foreground"
            placeholder="Message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "items-start gap-2")}>
      {!isUser ? (
        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 dark:bg-violet-500/15">
          <Bot className="size-3 text-violet-700 dark:text-violet-400/80" />
        </div>
      ) : null}

      <div
        className={cn(
          "max-w-[88%] px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-tr-sm bg-violet-600/90 text-white"
            : "rounded-2xl rounded-tl-sm bg-secondary text-foreground/85",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
