"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { MilestoneDraftRow } from "@/components/onboarding/milestone-draft-row";
import {
  getCompilingMilestoneId,
  parseMilestoneDrafts,
  type MilestoneDraft,
} from "@/lib/onboarding/parse-milestone-drafts";
import { streamOnboardingWorker } from "@/lib/onboarding/onboarding-stream";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function StreamCursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
    />
  );
}

type MilestoneCardProps = {
  draft: MilestoneDraft;
  isCompiling: boolean;
};

function MilestoneCard({ draft, isCompiling }: MilestoneCardProps) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4 transition-all duration-300",
        isCompiling
          ? "border-violet-500/50 bg-violet-500/8 shadow-[0_0_24px_rgba(139,92,246,0.12)]"
          : "border-border bg-secondary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{draft.title}</h3>
        {draft.isApproved ? (
          <span className="rounded-md bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            Approved
          </span>
        ) : null}
      </div>
      {draft.tasks.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {draft.tasks.map((task, index) => (
            <li
              key={`${draft.id}-task-${index}`}
              className="flex items-start gap-2 text-[13px] leading-snug text-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400/80" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-foreground/80">Awaiting scoped tasks…</p>
      )}
      {isCompiling ? (
        <div className="mt-2 inline-flex items-center">
          <StreamCursor />
        </div>
      ) : null}
    </article>
  );
}

type ScopingCanvasProps = {
  onStreamComplete?: () => void;
};

export function ScopingCanvas({ onStreamComplete }: ScopingCanvasProps) {
  const { getToken } = useAuth();
  const { setAiGoals, setMilestoneDrafts, step4 } = useOnboardingStore();
  const [prompt, setPrompt] = useState("");
  const [liveDrafts, setLiveDrafts] = useState<MilestoneDraft[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isEditable = !isStreaming && step4.milestoneDrafts.length > 0;

  const displayDrafts = isStreaming
    ? liveDrafts
    : step4.milestoneDrafts.length > 0
      ? step4.milestoneDrafts
      : liveDrafts;

  const compilingMilestoneId = useMemo(
    () => getCompilingMilestoneId(liveDrafts, isStreaming),
    [isStreaming, liveDrafts],
  );

  const updateDrafts = useCallback(
    (updater: (drafts: MilestoneDraft[]) => MilestoneDraft[]) => {
      setMilestoneDrafts(updater(step4.milestoneDrafts));
    },
    [setMilestoneDrafts, step4.milestoneDrafts],
  );

  const handleUpdateTitle = useCallback(
    (milestoneIndex: number, title: string) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) =>
          index === milestoneIndex ? { ...draft, title } : draft,
        ),
      );
    },
    [updateDrafts],
  );

  const handleUpdateTask = useCallback(
    (milestoneIndex: number, taskIndex: number, value: string) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) => {
          if (index !== milestoneIndex) {
            return draft;
          }
          const tasks = [...draft.tasks];
          tasks[taskIndex] = value;
          return { ...draft, tasks };
        }),
      );
    },
    [updateDrafts],
  );

  const handleAddTask = useCallback(
    (milestoneIndex: number) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) =>
          index === milestoneIndex
            ? { ...draft, tasks: [...draft.tasks, ""] }
            : draft,
        ),
      );
    },
    [updateDrafts],
  );

  const handleRemoveTask = useCallback(
    (milestoneIndex: number, taskIndex: number) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) => {
          if (index !== milestoneIndex) {
            return draft;
          }
          return {
            ...draft,
            tasks: draft.tasks.filter((_, taskIdx) => taskIdx !== taskIndex),
          };
        }),
      );
    },
    [updateDrafts],
  );

  const handleDeleteMilestone = useCallback(
    (milestoneIndex: number) => {
      updateDrafts((drafts) =>
        drafts.filter((_, index) => index !== milestoneIndex),
      );
    },
    [updateDrafts],
  );

  const handleToggleApproval = useCallback(
    (milestoneIndex: number) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) =>
          index === milestoneIndex
            ? { ...draft, isApproved: !draft.isApproved }
            : draft,
        ),
      );
    },
    [updateDrafts],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayDrafts, isStreaming]);

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setIsComplete(false);
    setIsStreaming(true);
    setLiveDrafts([]);
    setAiGoals(trimmed);

    let accumulated = "";

    try {
      await streamOnboardingWorker(
        trimmed,
        () => getToken({ skipCache: true }),
        {
          onChunk: (text) => {
            accumulated += text;
            setLiveDrafts(parseMilestoneDrafts(accumulated));
          },
          onDone: () => {
            const finalDrafts = parseMilestoneDrafts(accumulated);
            setMilestoneDrafts(finalDrafts);
            setLiveDrafts([]);
            setIsComplete(true);
            onStreamComplete?.();
          },
          onError: (message) => {
            setError(message);
          },
        },
        controller.signal,
      );
    } catch (streamError) {
      if (!(streamError instanceof Error) || streamError.name !== "AbortError") {
        setError(
          streamError instanceof Error
            ? streamError.message
            : "Onboarding stream failed unexpectedly.",
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [
    getToken,
    isStreaming,
    onStreamComplete,
    prompt,
    setAiGoals,
    setMilestoneDrafts,
  ]);

  const canSubmit = prompt.trim().length > 4 && !isStreaming;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollRef}
        className="max-h-[22rem] space-y-3 overflow-y-auto rounded-xl border border-border bg-secondary p-3"
      >
        {displayDrafts.length === 0 && !isStreaming ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 text-center">
            <Sparkles className="size-5 text-violet-700 dark:text-violet-400" />
            <p className="text-sm font-medium text-muted-foreground">
              Scoping canvas ready
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Submit a rough project brief below. The onboarding worker will
              stream milestone drafts in real time.
            </p>
          </div>
        ) : isEditable ? (
          displayDrafts.map((draft, milestoneIndex) => (
            <MilestoneDraftRow
              key={draft.id}
              draft={draft}
              milestoneIndex={milestoneIndex}
              onUpdateTitle={handleUpdateTitle}
              onUpdateTask={handleUpdateTask}
              onAddTask={handleAddTask}
              onRemoveTask={handleRemoveTask}
              onDeleteMilestone={handleDeleteMilestone}
              onToggleApproval={handleToggleApproval}
            />
          ))
        ) : (
          displayDrafts.map((draft) => (
            <MilestoneCard
              key={draft.id}
              draft={draft}
              isCompiling={draft.id === compilingMilestoneId}
            />
          ))
        )}
        {isStreaming && liveDrafts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5 px-4 py-6 text-sm text-violet-800 dark:text-violet-200">
            <Loader2 className="size-4 animate-spin" />
            Compiling first milestone draft
            <StreamCursor />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-100 dark:bg-rose-500/10 px-3 py-2 text-[13px] text-rose-800 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {isComplete ? (
        <p className="text-center text-xs text-emerald-800 dark:text-emerald-300">
          Milestone drafts saved — edit titles, tasks, and approvals below.
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-secondary p-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          rows={3}
          disabled={isStreaming}
          placeholder="Describe your unpolished goals — features, timeline, team constraints…"
          className="w-full resize-none bg-transparent text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Press Enter to scope · Shift+Enter for newline
          </p>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!canSubmit}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isStreaming ? "Streaming…" : "Scope milestones"}
          </button>
        </div>
      </div>
    </div>
  );
}
