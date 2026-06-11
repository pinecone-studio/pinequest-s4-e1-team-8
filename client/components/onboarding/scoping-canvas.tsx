"use client";

import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import {
  OnboardingChoiceCard,
  onboardingAccentChipClassName,
  onboardingAccentTextClassName,
} from "@/components/onboarding/onboarding-layout";
import { MilestoneDraftRow } from "@/components/onboarding/milestone-draft-row";
import { ScopingPromptBar } from "@/components/onboarding/scoping-prompt-bar";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";
import {
  requestScopingTurn,
  type ScopingChatMessage,
  type ScopingMilestoneResult,
} from "@/lib/onboarding/scoping-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { Loader2, PenLine, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function StreamCursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse rounded-full bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.55)]"
    />
  );
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions: string[];
};

type PlanningMode = "choose" | "ai" | "manual";

let chatMessageSequence = 0;

function nextChatMessageId(): string {
  chatMessageSequence += 1;
  return `chat-message-${chatMessageSequence}`;
}

function milestoneResultsToDrafts(milestones: ScopingMilestoneResult[]): MilestoneDraft[] {
  return milestones.map((milestone, index) => ({
    id: `milestone-${index}`,
    title: milestone.title,
    tasks: milestone.tasks,
    isApproved: false,
  }));
}

function createManualMilestone(index = 0): MilestoneDraft {
  return {
    id: `milestone-${index}`,
    title: `Milestone ${index + 1}`,
    tasks: [""],
    isApproved: false,
  };
}

type ScopingCanvasProps = {
  onStreamComplete?: () => void;
  disabled?: boolean;
  seedFromTdd?: boolean;
};

export function ScopingCanvas({ onStreamComplete, disabled = false, seedFromTdd = false }: ScopingCanvasProps) {
  const { getToken } = useAuth();
  const { step1, setMilestoneDrafts, step4, tddLayoutState } = useOnboardingStore();
  const [mode, setMode] = useState<PlanningMode>(
    step4.milestoneDrafts.length > 0 ? "manual" : "choose",
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const milestoneDrafts = step4.milestoneDrafts;
  const hasMilestones = milestoneDrafts.length > 0;

  const updateDrafts = useCallback(
    (updater: (drafts: MilestoneDraft[]) => MilestoneDraft[]) => {
      setMilestoneDrafts(updater(milestoneDrafts));
    },
    [milestoneDrafts, setMilestoneDrafts],
  );

  const handleUpdateTitle = useCallback(
    (milestoneIndex: number, title: string) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) => (index === milestoneIndex ? { ...draft, title } : draft)),
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
          index === milestoneIndex ? { ...draft, tasks: [...draft.tasks, ""] } : draft,
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
      const next = milestoneDrafts.filter((_, index) => index !== milestoneIndex);
      setMilestoneDrafts(next);
      if (next.length === 0) {
        setMode("choose");
      }
    },
    [milestoneDrafts, setMilestoneDrafts],
  );

  const handleToggleApproval = useCallback(
    (milestoneIndex: number) => {
      updateDrafts((drafts) =>
        drafts.map((draft, index) =>
          index === milestoneIndex ? { ...draft, isApproved: !draft.isApproved } : draft,
        ),
      );
    },
    [updateDrafts],
  );

  const buildTddContext = useCallback((): string | undefined => {
    if (!seedFromTdd || !tddLayoutState) {
      return undefined;
    }
    const content = tddLayoutState.blocks
      .map((block) => `## ${block.title}\n${block.content}`)
      .join("\n\n")
      .trim();
    return content || undefined;
  }, [seedFromTdd, tddLayoutState]);

  const runScopingTurn = useCallback(
    async (history: ChatMessage[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      const messages: ScopingChatMessage[] = history.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      try {
        const result = await requestScopingTurn(
          {
            projectName: step1.projectName,
            description: step1.description,
            messages,
            tddContext: buildTddContext(),
          },
          () => getToken({ skipCache: true }),
          controller.signal,
        );

        if (result.isClarification) {
          setChatMessages((current) => [
            ...current,
            {
              id: nextChatMessageId(),
              role: "assistant",
              content: result.message,
              suggestions: result.suggestions,
            },
          ]);
        } else {
          setChatMessages((current) => [
            ...current,
            {
              id: nextChatMessageId(),
              role: "assistant",
              content: result.message,
              suggestions: [],
            },
          ]);
          setMilestoneDrafts(milestoneResultsToDrafts(result.milestones));
          onStreamComplete?.();
        }
      } catch (turnError) {
        if (!(turnError instanceof Error) || turnError.name !== "AbortError") {
          setError(
            turnError instanceof Error
              ? turnError.message
              : "Scoping request failed unexpectedly.",
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [
      buildTddContext,
      getToken,
      onStreamComplete,
      setMilestoneDrafts,
      step1.description,
      step1.projectName,
    ],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const handleUserReply = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      const next: ChatMessage[] = [
        ...chatMessages.map((message) => ({ ...message, suggestions: [] })),
        { id: nextChatMessageId(), role: "user", content: trimmed, suggestions: [] },
      ];

      setChatMessages(next);
      setInputValue("");
      void runScopingTurn(next);
    },
    [chatMessages, isLoading, runScopingTurn],
  );

  const handleMakeWithAi = () => {
    if (disabled) {
      return;
    }
    setMode("ai");
    setError(null);
    if (!inputValue.trim()) {
      setInputValue(
        seedFromTdd && tddLayoutState
          ? "Generate milestones from my finalized TDD."
          : "Help me draft milestones for this project.",
      );
    }
  };

  const handleAddManually = () => {
    if (disabled) {
      return;
    }
    setMode("manual");
    setMilestoneDrafts([createManualMilestone()]);
  };

  const handleAddMilestone = () => {
    setMilestoneDrafts([...milestoneDrafts, createManualMilestone(milestoneDrafts.length)]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]"
      >
        {hasMilestones ? (
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-foreground">
                {milestoneDrafts.length} milestone
                {milestoneDrafts.length === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Approve at least one to continue
              </p>
            </div>
            <div className="space-y-5">
              {milestoneDrafts.map((draft, milestoneIndex) => (
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
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-[#7c3aed]/40 hover:text-[#7c3aed]"
            >
              <PenLine className="size-3.5" />
              Add another milestone
            </button>
          </div>
        ) : mode === "choose" ? (
          <div className="flex min-h-[280px] flex-col justify-center py-4">
            <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
              <div className="grid gap-4 sm:grid-cols-2">
                <OnboardingChoiceCard
                  icon={Sparkles}
                  title="Make it with AI"
                  description="Brisk drafts milestones from your TDD, timeline, and project context."
                  onClick={handleMakeWithAi}
                  disabled={disabled}
                />
                <OnboardingChoiceCard
                  icon={PenLine}
                  title="Add manually"
                  description="Create milestones yourself and add tasks one by one."
                  onClick={handleAddManually}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[180px] flex-col gap-4 pb-2">
            {chatMessages.length === 0 && !isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <Sparkles className={cn("size-6", onboardingAccentTextClassName)} />
                <p className="max-w-xs text-sm text-muted-foreground">
                  Tell Brisk about your timeline, team size, and what you want to ship.
                </p>
              </div>
            ) : null}

            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-2",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    message.role === "user"
                      ? "bg-[#7c3aed] text-white"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {message.content}
                </div>
                {message.suggestions.length > 0 ? (
                  <div className="flex max-w-[90%] flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={`${message.id}-suggestion-${index}`}
                        type="button"
                        onClick={() => handleUserReply(suggestion)}
                        disabled={isLoading}
                        className={onboardingAccentChipClassName}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {isLoading ? (
              <div className="flex items-center gap-2 self-start rounded-2xl bg-secondary px-3.5 py-2.5 text-[13px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Drafting milestones
                <StreamCursor />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-2 shrink-0 rounded-lg border border-rose-500/30 bg-rose-100 px-3 py-2 text-[13px] text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {!hasMilestones && mode === "ai" && !disabled ? (
        <ScopingPromptBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => handleUserReply(inputValue)}
          disabled={isLoading}
          isLoading={isLoading}
        />
      ) : null}
    </div>
  );
}
