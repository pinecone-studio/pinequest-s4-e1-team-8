"use client";

import { StreamMarkdown } from "@/components/agent-workspace/stream-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAgentStream } from "@/hooks/useAgentStream";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  GitPullRequest,
  Loader2,
  Sparkles,
  Square,
  Ticket,
  UserPlus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type WorkerNodeId =
  | "onboarding_worker"
  | "metrics_worker"
  | "risk_worker"
  | "pr_generator_worker"
  | "issue_generator_worker";

type WorkerNode = {
  id: WorkerNodeId;
  label: string;
  description: string;
  icon: typeof UserPlus;
};

type WorkerStatus = "pending" | "running" | "done";

const WORKER_NODES: WorkerNode[] = [
  {
    id: "onboarding_worker",
    label: "Onboarding",
    description: "Project setup and team context",
    icon: UserPlus,
  },
  {
    id: "metrics_worker",
    label: "Metrics",
    description: "Velocity and delivery analysis",
    icon: BarChart3,
  },
  {
    id: "risk_worker",
    label: "Risk",
    description: "Blockers and risk identification",
    icon: AlertTriangle,
  },
  {
    id: "pr_generator_worker",
    label: "PR Generator",
    description: "Pull request drafts and diffs",
    icon: GitPullRequest,
  },
  {
    id: "issue_generator_worker",
    label: "Issue Generator",
    description: "Actionable issue breakdown",
    icon: Ticket,
  },
];

function getWorkerStatus(
  nodeId: WorkerNodeId,
  activeNode: string | null,
  nodeOutputs: Record<string, string>,
): WorkerStatus {
  if (activeNode === nodeId) {
    return "running";
  }

  if ((nodeOutputs[nodeId] ?? "").length > 0) {
    return "done";
  }

  return "pending";
}

function statusBadgeVariant(
  status: WorkerStatus,
): "default" | "secondary" | "outline" {
  if (status === "running") {
    return "default";
  }
  if (status === "done") {
    return "secondary";
  }
  return "outline";
}

function statusLabel(status: WorkerStatus): string {
  if (status === "running") {
    return "Running";
  }
  if (status === "done") {
    return "Done";
  }
  return "Pending";
}

export default function AgentWorkspacePage() {
  const { stream, activeNode, nodeOutputs, isLoading, isComplete, abort } =
    useAgentStream();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeIndex = useMemo(
    () => WORKER_NODES.findIndex((node) => node.id === activeNode),
    [activeNode],
  );

  const pipelineProgress = useMemo(() => {
    if (isComplete) {
      return 100;
    }
    if (activeIndex < 0) {
      return isLoading ? 4 : 0;
    }
    return Math.round(((activeIndex + 1) / WORKER_NODES.length) * 100);
  }, [activeIndex, isComplete, isLoading]);

  const handleRun = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setError(null);

    try {
      await stream(trimmed);
    } catch (streamError) {
      setError(
        streamError instanceof Error
          ? streamError.message
          : "Agent stream failed unexpectedly.",
      );
    }
  }, [isLoading, prompt, stream]);

  const handleStop = useCallback(() => {
    abort();
  }, [abort]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0a0a0c] text-white">
      <header className="shrink-0 border-b border-white/6 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25">
                <Sparkles className="size-4 text-violet-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Agent Workspace
                </h1>
                <p className="text-sm text-[#8b8b95]">
                  Multi-agent orchestration viewport
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLoading ? (
              <Badge
                variant="default"
                className="h-7 gap-1.5 rounded-lg bg-violet-600 px-3 text-xs"
              >
                <Loader2 className="size-3.5 animate-spin" />
                Pipeline Active
              </Badge>
            ) : null}
            {isComplete ? (
              <Badge
                variant="secondary"
                className="h-7 gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-xs text-emerald-300"
              >
                <CheckCircle2 className="size-3.5" />
                Orchestration Complete
              </Badge>
            ) : null}
            {!isLoading && !isComplete ? (
              <Badge
                variant="outline"
                className="h-7 rounded-lg border-white/12 px-3 text-xs text-[#8b8b95]"
              >
                Awaiting Input
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-white/6 bg-[#0a0a0c]/90 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Command Center</p>
              <p className="text-xs text-[#8b8b95]">
                Direct the supervisor agent pipeline
              </p>
            </div>
            <span className="text-xs tabular-nums text-[#6b6b73]">
              {pipelineProgress}% routed
            </span>
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the orchestration task — metrics review, risk scan, PR draft, and issue generation."
            rows={3}
            disabled={isLoading}
            className="w-full resize-none rounded-2xl border border-white/8 bg-[#121216] px-4 py-3.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all placeholder:text-[#5c5c66] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleRun}
              disabled={isLoading || prompt.trim().length === 0}
              className="h-10 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-medium shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-fuchsia-500"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Run Agent Orchestration
            </Button>
            {isLoading ? (
              <Button
                variant="outline"
                onClick={handleStop}
                className="h-10 gap-2 rounded-xl border-red-500/30 bg-red-500/5 px-5 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Square className="size-3.5 fill-current" />
                Stop Execution
              </Button>
            ) : null}
            {error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : null}
          </div>
        </div>
      </div>

      <section className="shrink-0 border-b border-white/6 px-6 py-6">
        <div className="mx-auto w-full max-w-6xl space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-white">
                Pipeline Timeline
              </h2>
              <p className="text-xs text-[#8b8b95]">
                Five specialized worker stages
              </p>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-600 to-cyan-500 transition-all duration-500 ease-out"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>
          </div>

          <ol className="relative flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
            {WORKER_NODES.map((node, index) => {
              const status = getWorkerStatus(
                node.id,
                activeNode,
                nodeOutputs,
              );
              const Icon = node.icon;
              const isLast = index === WORKER_NODES.length - 1;

              return (
                <li
                  key={node.id}
                  className={cn(
                    "relative flex flex-1 flex-col",
                    !isLast && "md:pr-4",
                  )}
                >
                  {!isLast ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-6 right-0 z-0 hidden h-px w-full translate-x-1/2 md:block",
                        status === "done"
                          ? "bg-emerald-500/40"
                          : "bg-white/10",
                      )}
                      style={{ width: "calc(100% - 3rem)", left: "calc(50% + 1.5rem)" }}
                    />
                  ) : null}
                  <div
                    className={cn(
                      "relative z-10 flex h-full flex-col gap-3 rounded-2xl border p-4 transition-all duration-300",
                      status === "running" &&
                        "animate-pulse border-violet-500/70 bg-violet-500/10 shadow-[0_0_32px_rgba(139,92,246,0.2)] ring-1 ring-violet-400/40",
                      status === "done" &&
                        "border-emerald-500/35 bg-emerald-500/5",
                      status === "pending" &&
                        "border-white/6 bg-[#121216]/80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors",
                          status === "running" &&
                            "bg-violet-500/20 text-violet-200 ring-violet-500/30",
                          status === "done" &&
                            "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
                          status === "pending" &&
                            "bg-white/4 text-[#8b8b95] ring-white/6",
                        )}
                      >
                        {status === "running" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : status === "done" ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </div>
                      <Badge
                        variant={statusBadgeVariant(status)}
                        className={cn(
                          "rounded-lg text-[10px] uppercase tracking-wide",
                          status === "running" && "bg-violet-600",
                          status === "done" &&
                            "bg-emerald-500/15 text-emerald-300",
                        )}
                      >
                        {statusLabel(status)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">
                        {node.label}
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#8b8b95]">
                        {node.description}
                      </p>
                    </div>
                    <p className="mt-auto font-mono text-[10px] text-[#5c5c66]">
                      {node.id}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid w-full max-w-6xl gap-4 xl:grid-cols-2">
          {WORKER_NODES.map((node) => {
            const status = getWorkerStatus(
              node.id,
              activeNode,
              nodeOutputs,
            );
            const output = nodeOutputs[node.id] ?? "";
            const Icon = node.icon;

            return (
              <Card
                key={node.id}
                className={cn(
                  "border-white/6 bg-[#121216] text-white ring-white/6 transition-all duration-300",
                  status === "running" &&
                    "ring-1 ring-violet-500/40 shadow-[0_0_24px_rgba(139,92,246,0.08)]",
                )}
              >
                <CardHeader className="border-b border-white/6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          status === "running" &&
                            "bg-violet-500/20 text-violet-300",
                          status === "done" &&
                            "bg-emerald-500/15 text-emerald-300",
                          status === "pending" &&
                            "bg-white/4 text-[#8b8b95]",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm text-white">
                          {node.label}
                        </CardTitle>
                        <CardDescription className="text-xs text-[#8b8b95]">
                          {node.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(status)}>
                      {statusLabel(status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="max-h-72 overflow-y-auto pt-4">
                  <StreamMarkdown
                    content={output}
                    isActive={activeNode === node.id}
                    workerLabel={node.label}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
