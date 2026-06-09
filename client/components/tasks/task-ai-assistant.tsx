"use client";

import { clientApi } from "@/app/lib/client-api";
import { sourceLabels } from "@/components/tasks/task-sources";
import {
  getTaskTeam,
  type TaskListItem,
  type TaskSource,
} from "@/components/tasks/task-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp, Bot, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const quickQuestions = [
  "What should we prioritize today?",
  "Which tasks are blocked or overdue?",
  "Summarize the board status",
  "Suggest next steps for the team",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type TaskAiAssistantProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: TaskListItem[];
  activeSource: TaskSource;
  activeTeam: string | null;
  selectedTask: TaskListItem | null;
  embedded?: boolean;
};

function buildTaskContext({
  tasks,
  activeSource,
  activeTeam,
  selectedTask,
  question,
}: {
  tasks: TaskListItem[];
  activeSource: TaskSource;
  activeTeam: string | null;
  selectedTask: TaskListItem | null;
  question: string;
}) {
  const byStatus = {
    backlog: tasks.filter((t) => t.status === "backlog").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    review: tasks.filter((t) => t.status === "review").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
  const blocked = tasks.filter((t) => t.blocked).length;
  const taskLines = tasks
    .slice(0, 12)
    .map(
      (task) =>
        `- ${task.title} (${task.status}, ${task.priority}${task.blocked ? ", blocked" : ""}${task.timeLeft ? `, ${task.timeLeft}` : ""})`,
    )
    .join("\n");

  const selectedLine = selectedTask
    ? [
        "",
        "Selected task:",
        `- ${selectedTask.title} (${selectedTask.status}, ${selectedTask.priority})`,
        selectedTask.description
          ? `  Description: ${selectedTask.description.slice(0, 200)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    "Task board context:",
    `Source: ${sourceLabels[activeSource]}`,
    activeTeam ? `Team filter: ${activeTeam}` : "Team filter: all teams",
    `Board: ${tasks.length} tasks · Backlog ${byStatus.backlog} · Doing ${byStatus.doing} · Review ${byStatus.review} · Done ${byStatus.done}`,
    blocked > 0 ? `Blocked tasks: ${blocked}` : "",
    `Visible tasks:\n${taskLines || "None"}`,
    selectedLine,
    "",
    question,
  ]
    .filter(Boolean)
    .join("\n");
}

function welcomeMessage(
  activeTeam: string | null,
  taskCount: number,
): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content:
      taskCount === 0
        ? "Hi! I can help you plan tasks, prioritize work, and suggest next steps. Load or create tasks, then ask me anything."
        : activeTeam
          ? `Hi! I can see ${taskCount} tasks for ${activeTeam}. Ask about priorities, blockers, or what to tackle next.`
          : `Hi! I can see ${taskCount} tasks on your board. Ask about priorities, blockers, or workflow suggestions.`,
  };
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
          "max-w-[88%] whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed",
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

export function TaskAiAssistantTrigger({
  open,
  onOpenChange,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={open ? "default" : "outline"}
      className={cn(
        "rounded-lg gap-1.5",
        open && "bg-violet-600 hover:bg-violet-700",
      )}
      disabled={disabled}
      onClick={() => onOpenChange(!open)}
    >
      <Sparkles className="size-4" />
      AI Assistant
    </Button>
  );
}

export function TaskAiAssistant({
  open,
  onOpenChange,
  tasks,
  activeSource,
  activeTeam,
  selectedTask,
  embedded = false,
}: TaskAiAssistantProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);

  const createMessageId = (role: ChatMessage["role"]) => {
    messageIdRef.current += 1;
    return `${role}-${messageIdRef.current}`;
  };

  useEffect(() => {
    if (!open) return;
    setMessages([welcomeMessage(activeTeam, tasks.length)]);
  }, [open, activeTeam, tasks.length, activeSource]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading, open]);

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
        question: buildTaskContext({
          tasks,
          activeSource,
          activeTeam,
          selectedTask,
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
            "Could not get an answer. Make sure the server is running with GEMINI_API_KEY configured.",
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

  if (!open) return null;

  const panel = (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border border-border/60 bg-card shadow-sm",
        embedded
          ? "min-h-[480px] w-[340px] shrink-0 rounded-lg"
          : "fixed inset-y-0 right-0 z-50 w-full max-w-[400px] border-l shadow-2xl animate-in slide-in-from-right duration-300",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-violet-100 dark:bg-violet-500/15">
            <Sparkles className="size-3.5 text-violet-700 dark:text-violet-400/80" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground/90">Tasks assistant</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {sourceLabels[activeSource]}
              {activeTeam ? ` · ${activeTeam}` : ""}
              {tasks.length > 0 ? ` · ${tasks.length} tasks` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close AI assistant"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-default min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isLoading ? (
          <div className="flex items-start gap-2">
            <div className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 dark:bg-violet-500/15">
              <Loader2 className="size-3 animate-spin text-violet-700 dark:text-violet-400/80" />
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
            placeholder="Ask about your tasks..."
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

  if (embedded) return panel;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        aria-label="Close AI assistant"
        onClick={() => onOpenChange(false)}
      />
      {panel}
    </>
  );
}
