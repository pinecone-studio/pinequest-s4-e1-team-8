"use client";

import { DiscoveryFeed } from "@/components/onboarding/discovery/DiscoveryFeed";
import { DiscoveryInteractionFooter } from "@/components/onboarding/discovery/DiscoveryInteractionFooter";
import { DiscoveryStatusBar } from "@/components/onboarding/discovery/DiscoveryStatusBar";
import { TddDraggableCanvas } from "@/components/onboarding/TddDraggableCanvas";
import { useOnboardingStore } from "@/app/onboarding/use-onboarding-store";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  exportGoogleDoc,
  getOnboardingSession,
  patchOnboardingSession,
  streamOnboardingChat,
  type OnboardingTranscriptMessage,
} from "@/lib/onboarding/onboarding-chat";
import {
  computeDiscoveryMetrics,
  flattenQuestionExamples,
  resolveVisibleSuggestions,
} from "@/lib/onboarding/discovery-types";
import type { DiscoveryQuestion, TddLayoutState } from "@/lib/onboarding/tdd-types";
import { getGithubRepo } from "@/lib/integrations/github";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, ExternalLink, FileText, Link2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type WorkspacePhase = "interview" | "canvas";

const GOOGLE_OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google Workspace connection was cancelled.",
  missing_state: "Google Workspace connection expired. Please try again.",
  invalid_state: "Google Workspace connection expired. Please try again.",
  state_mismatch: "Google Workspace connection could not be verified. Please try again.",
  missing_client_credentials: "Google Workspace integration is not configured.",
  token_exchange_failed: "Google Workspace authorization failed. Please try again.",
  missing_user_id: "Google Workspace connection failed. Please sign in again.",
  save_failed: "Google Workspace connected, but saving credentials failed. Please try again.",
};

function googleOAuthErrorMessage(code: string): string {
  return GOOGLE_OAUTH_ERROR_MESSAGES[code] ?? `Google Workspace connection failed (${code}).`;
}

type OnboardingWorkspaceProps = {
  onTddConfirmed: () => void;
  onBack?: () => void;
};

function createMessageId(): string {
  return crypto.randomUUID();
}

export function OnboardingWorkspace({ onTddConfirmed, onBack }: OnboardingWorkspaceProps) {
  const { getToken } = useAuth();
  const { userId } = useInternalUserId();
  const searchParams = useSearchParams();
  const { step1, onboardingSessionId, setOnboardingSessionId, tddLayoutState, setTddLayoutState } =
    useOnboardingStore();

  const [phase, setPhase] = useState<WorkspacePhase>(
    tddLayoutState ? "canvas" : "interview",
  );
  const [messages, setMessages] = useState<OnboardingTranscriptMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [activeQuestions, setActiveQuestions] = useState<DiscoveryQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const hasHandledGoogleOAuthCallbackRef = useRef(false);

  useEffect(() => {
    if (tddLayoutState && phase === "interview") {
      setPhase("canvas");
    }
  }, [phase, tddLayoutState]);

  useEffect(() => {
    if (phase !== "canvas" || !onboardingSessionId || docUrl) {
      return;
    }

    let cancelled = false;
    void getOnboardingSession(onboardingSessionId, () => getToken({ skipCache: true }))
      .then((session) => {
        if (!cancelled && session.docUrl) {
          setDocUrl(session.docUrl);
        }
      })
      .catch(() => {
        // Best-effort restore — keep silently falling back to the export button.
      });

    return () => {
      cancelled = true;
    };
  }, [docUrl, getToken, onboardingSessionId, phase]);

  useEffect(() => {
    const node = workspaceRef.current;
    if (!node) {
      return;
    }

    const isolateKeyboard = (event: KeyboardEvent) => {
      event.stopPropagation();
    };

    node.addEventListener("keydown", isolateKeyboard);
    node.addEventListener("keyup", isolateKeyboard);
    return () => {
      node.removeEventListener("keydown", isolateKeyboard);
      node.removeEventListener("keyup", isolateKeyboard);
    };
  }, []);

  const runChatTurn = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setStreamingContent("");

      const userMessage: OnboardingTranscriptMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
      };
      setMessages((current) => [...current, userMessage]);
      setInputValue("");

      let assistantContent = "";

      try {
        await streamOnboardingChat(
          {
            sessionId: onboardingSessionId || undefined,
            projectName: step1.projectName,
            description: step1.description,
            message: trimmed,
          },
          () => getToken({ skipCache: true }),
          (event) => {
            if (event.type === "session") {
              setOnboardingSessionId(event.sessionId);
            }
            if (event.type === "token") {
              assistantContent += event.token;
              setStreamingContent(assistantContent);
            }
            if (event.type === "complete") {
              assistantContent = event.message;
              setStreamingContent("");
              setRound(event.round);
              setCoverage(event.coverage);
              setActiveQuestions(event.questions);
              setMessages((current) => {
                const last = current[current.length - 1];
                if (
                  last?.role === "assistant" &&
                  last.content === event.message &&
                  last.round === event.round
                ) {
                  return current;
                }
                return [
                  ...current,
                  {
                    id: createMessageId(),
                    role: "assistant",
                    content: event.message,
                    round: event.round,
                    questions: event.questions,
                  },
                ];
              });
            }
            if (event.type === "synthesis") {
              setStreamingContent("");
              setActiveQuestions([]);
              setTddLayoutState(event.tddLayoutState);
              setPhase("canvas");
              setMessages((current) => [
                ...current,
                {
                  id: createMessageId(),
                  role: "assistant",
                  content:
                    "Discovery complete. Your TDD document is ready — arrange blocks on the canvas and refine any section.",
                },
              ]);
            }
            if (event.type === "error") {
              throw new Error(event.error);
            }
          },
          controller.signal,
        );

        if (assistantContent) {
          setStreamingContent("");
        }
      } catch (chatError) {
        if (!(chatError instanceof Error) || chatError.name !== "AbortError") {
          setError(
            chatError instanceof Error ? chatError.message : "Discovery chat failed unexpectedly.",
          );
        }
      } finally {
        isSubmittingRef.current = false;
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [
      getToken,
      isLoading,
      onboardingSessionId,
      setOnboardingSessionId,
      setTddLayoutState,
      step1.description,
      step1.projectName,
    ],
  );

  const handleLayoutChange = useCallback(
    (layout: TddLayoutState) => {
      setTddLayoutState(layout);
      if (onboardingSessionId) {
        void patchOnboardingSession(
          onboardingSessionId,
          { tddLayoutState: layout, status: "CANVAS_EDIT" },
          () => getToken({ skipCache: true }),
        );
      }
    },
    [getToken, onboardingSessionId, setTddLayoutState],
  );

  const handleExportGoogleDoc = useCallback(async () => {
    if (!tddLayoutState || !onboardingSessionId) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await exportGoogleDoc({
        sessionId: onboardingSessionId,
        projectName: step1.projectName,
        tddLayoutState,
      });
      setDocUrl(result.docUrl);
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : "Google Docs export failed.";
      if (message.includes("GOOGLE_NOT_CONNECTED") || message.includes("not connected")) {
        const returnTo = encodeURIComponent("/onboarding/step2");
        window.location.href = `/api/auth/google?userId=${encodeURIComponent(userId)}&returnTo=${returnTo}`;
        return;
      }
      setError(message);
    } finally {
      setIsExporting(false);
    }
  }, [onboardingSessionId, step1.projectName, tddLayoutState, userId]);

  useEffect(() => {
    if (hasHandledGoogleOAuthCallbackRef.current) {
      return;
    }

    const connected = searchParams.get("google_connected");
    const errorCode = searchParams.get("google_error");
    if (connected !== "1" && !errorCode) {
      return;
    }

    hasHandledGoogleOAuthCallbackRef.current = true;
    window.history.replaceState({}, "", "/onboarding/step2");

    if (errorCode) {
      setError(googleOAuthErrorMessage(errorCode));
      return;
    }

    if (tddLayoutState && onboardingSessionId && !docUrl) {
      void handleExportGoogleDoc();
    }
  }, [docUrl, handleExportGoogleDoc, onboardingSessionId, searchParams, tddLayoutState]);

  const handleConfirmTdd = useCallback(async () => {
    if (!tddLayoutState) {
      return;
    }

    if (onboardingSessionId) {
      await patchOnboardingSession(
        onboardingSessionId,
        { tddLayoutState, status: "CONCLUDED" },
        () => getToken({ skipCache: true }),
      );
    }

    onTddConfirmed();
  }, [getToken, onboardingSessionId, onTddConfirmed, tddLayoutState]);

  const githubRepo = getGithubRepo();
  const repoUrl = githubRepo ? `https://github.com/${githubRepo.owner}/${githubRepo.repo}` : null;

  const metrics = computeDiscoveryMetrics(round, coverage);
  const visibleSuggestions = resolveVisibleSuggestions(
    round,
    messages,
    flattenQuestionExamples(activeQuestions),
  );

  if (phase === "canvas" && tddLayoutState) {
    return (
      <div
        ref={workspaceRef}
        className="flex h-full min-h-0 flex-col bg-background text-foreground"
      >
        <DiscoveryStatusBar metrics={metrics} onBack={onBack} mode="canvas" />
        <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-6">
            <div>
              <p className="text-[15px] font-medium text-foreground">TDD Canvas</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Drag blocks to reorder, select text to refine, then confirm to generate milestones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleExportGoogleDoc()}
                disabled={isExporting}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
                Sync to Google Docs
              </button>
              {docUrl ? (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-violet-700 hover:text-violet-600 dark:text-violet-400"
                >
                  Open doc
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-y-contain">
            <TddDraggableCanvas
              layout={tddLayoutState}
              onLayoutChange={handleLayoutChange}
              projectName={step1.projectName}
            />
            <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 dark:border-violet-500/20 dark:bg-violet-500/10">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                  <Link2 className="size-3.5" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">Links</h3>
              </div>
              <ul className="space-y-1.5 pl-1">
                {repoUrl ? (
                  <li>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-violet-700 underline underline-offset-2 hover:text-violet-600 dark:text-violet-300"
                    >
                      Repository
                      <ExternalLink className="size-3" />
                    </a>
                  </li>
                ) : null}
                {docUrl ? (
                  <li>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-violet-700 underline underline-offset-2 hover:text-violet-600 dark:text-violet-300"
                    >
                      TDD Document
                      <ExternalLink className="size-3" />
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          {error ? (
            <p className="mx-auto mt-4 w-full max-w-5xl rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}
          <div className="mx-auto mt-8 flex w-full max-w-5xl shrink-0 justify-start pt-2">
            <button
              type="button"
              onClick={() => void handleConfirmTdd()}
              className="flex h-11 min-w-[220px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Confirm TDD & Generate Milestones
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={workspaceRef}
      className="flex h-full min-h-0 flex-col bg-background text-foreground"
    >
      <DiscoveryStatusBar metrics={metrics} onBack={onBack} mode="interview" />
      <DiscoveryFeed
        messages={messages}
        streamingContent={streamingContent}
        isLoading={isLoading}
        round={round}
      />
      {error ? (
        <p className="mx-auto mb-2 w-full max-w-3xl shrink-0 px-6 text-[13px] text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <DiscoveryInteractionFooter
        value={inputValue}
        onChange={setInputValue}
        onSubmit={() => void runChatTurn(inputValue)}
        suggestions={visibleSuggestions}
        disabled={isLoading}
        isLoading={isLoading}
      />
    </div>
  );
}
