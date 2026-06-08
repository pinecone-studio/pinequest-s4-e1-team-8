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
  Circle,
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

type WorkerStatus = "pending" | "active" | "complete";

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
  isComplete: boolean,
): WorkerStatus {
  if (activeNode === nodeId) {
    return "active";
  }

  const output = nodeOutputs[nodeId];
  if (output && output.length > 0) {
    return "complete";
  }

  if (isComplete && output && output.length > 0) {
    return "complete";
  }

  return "pending";
}

function statusBadgeVariant(status: WorkerStatus): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }
  if (status === "complete") {
    return "secondary";
  }
  return "outline";
}

function statusLabel(status: WorkerStatus): string {
  if (status === "active") {
    return "Running";
  }
  if (status === "complete") {
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
    <div className="flex min-h-full flex-1 flex-col bg-[#0f0f11] text-white">
      <header className="shrink-0 border-b border-white/[0.06] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-400" />
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Workspace
              </h1>
            </div>
            <p className="text-sm text-[#8b8b95]">
              Stream multi-agent pipeline output in real time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Badge variant="default" className="gap-1.5 bg-violet-600">
                <Loader2 className="size-3 animate-spin" />
                Streaming
              </Badge>
            ) : isComplete ? (
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="size-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline">Idle</Badge>
            )}
          </div>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-6 px-6 py-6">
        <Card className="border-white/[0.06] bg-[#16161a] text-white ring-white/[0.06]">
          <CardHeader className="border-b border-white/[0.06]">
            <CardTitle className="text-base text-white">Prompt</CardTitle>
            <CardDescription className="text-[#8b8b95]">
              Describe the task for the supervisor agent pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. Analyze our sprint metrics, identify delivery risks, and draft a PR plus follow-up issues for the auth refactor."
              rows={4}
              disabled={isLoading}
              className="w-full resize-y rounded-xl border border-white/[0.08] bg-[#0f0f11] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#5c5c66] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleRun}
                disabled={isLoading || prompt.trim().length === 0}
                className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {isLoading ? "Running pipeline…" : "Run pipeline"}
              </Button>
              {isLoading ? (
                <Button
                  variant="outline"
                  onClick={handleStop}
                  className="gap-2 rounded-xl border-white/[0.12] bg-transparent text-white hover:bg-white/[0.06]"
                >
                  <Square className="size-4" />
                  Stop
                </Button>
              ) : null}
              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-[#16161a] text-white ring-white/[0.06]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-white">
                  Pipeline tracker
                </CardTitle>
                <CardDescription className="text-[#8b8b95]">
                  Five specialized workers orchestrated by the supervisor
                </CardDescription>
              </div>
              <span className="text-xs tabular-nums text-[#8b8b95]">
                {pipelineProgress}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-sky-500 transition-all duration-500 ease-out"
                style={{ width: `${pipelineProgress}%` }}
              />
            </div>
            <ol className="grid gap-3 md:grid-cols-5">
              {WORKER_NODES.map((node, index) => {
                const status = getWorkerStatus(
                  node.id,
                  activeNode,
                  nodeOutputs,
                  isComplete,
                );
                const Icon = node.icon;

                return (
                  <li key={node.id} className="relative">
                    {index < WORKER_NODES.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute top-7 right-0 hidden h-px w-4 translate-x-full bg-white/[0.12] md:block"
                      />
                    ) : null}
                    <div
                      className={cn(
                        "flex h-full flex-col gap-3 rounded-xl border p-3 transition-all duration-300",
                        status === "active" &&
                          "border-violet-500/60 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.15)]",
                        status === "complete" &&
                          "border-emerald-500/30 bg-emerald-500/5",
                        status === "pending" &&
                          "border-white/[0.06] bg-[#0f0f11]/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg",
                            status === "active" && "bg-violet-500/20 text-violet-300",
                            status === "complete" && "bg-emerald-500/15 text-emerald-300",
                            status === "pending" && "bg-white/[0.04] text-[#8b8b95]",
                          )}
                        >
                          {status === "active" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : status === "complete" ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <Icon className="size-4" />
                          )}
                        </div>
                        <Badge variant={statusBadgeVariant(status)}>
                          {statusLabel(status)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">
                          {node.label}
                        </p>
                        <p className="text-xs leading-relaxed text-[#8b8b95]">
                          {node.description}
                        </p>
                      </div>
                      {status === "active" ? (
                        <div className="flex items-center gap-1.5 text-xs text-violet-300">
                          <Circle className="size-2 fill-current animate-pulse" />
                          Active worker
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {WORKER_NODES.map((node) => {
            const status = getWorkerStatus(
              node.id,
              activeNode,
              nodeOutputs,
              isComplete,
            );
            const output = nodeOutputs[node.id] ?? "";
            const Icon = node.icon;

            return (
              <Card
                key={node.id}
                className={cn(
                  "border-white/[0.06] bg-[#16161a] text-white ring-white/[0.06] transition-all duration-300",
                  status === "active" && "ring-1 ring-violet-500/40",
                )}
              >
                <CardHeader className="border-b border-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          status === "active" && "bg-violet-500/20 text-violet-300",
                          status === "complete" && "bg-emerald-500/15 text-emerald-300",
                          status === "pending" && "bg-white/[0.04] text-[#8b8b95]",
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
                <CardContent className="max-h-80 overflow-y-auto pt-4">
                  <StreamMarkdown content={output} />
                  {status === "active" && output.length > 0 ? (
                    <span className="mt-2 inline-block h-4 w-0.5 animate-pulse bg-violet-400" />
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
