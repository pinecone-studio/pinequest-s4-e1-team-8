"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProjectMilestones } from "@/hooks/use-project-milestones";
import { cn } from "@/lib/utils";
import { Flag, Layers3 } from "lucide-react";
import Link from "next/link";

function statusLabel(status: string) {
  if (status === "todo") return "To do";
  if (status === "in progress") return "In progress";
  if (status === "completed") return "Done";
  return "Backlog";
}

function statusClassName(status: string) {
  if (status === "todo")
    return "bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300";
  if (status === "in progress")
    return "bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300";
  if (status === "completed")
    return "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
  return "bg-muted/40 text-muted-foreground";
}

export function TeamInsightsWidget() {
  const {
    milestones,
    isLoading,
    error,
    loaded,
    hasProject,
    projectName,
  } = useProjectMilestones();

  if (!loaded || isLoading) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
        <CardHeader className="px-4 pb-1">
          <div className="h-5 w-32 animate-pulse rounded bg-muted/50" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-48 animate-pulse rounded-2xl bg-muted/30" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="items-center pb-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Project Milestones</CardTitle>
          {milestones.length > 0 ? (
            <Badge variant="secondary">{milestones.length}</Badge>
          ) : null}
        </div>
        <CardAction>
          <Link
            href="/tasks"
            className="text-sm font-medium text-violet-700 dark:text-violet-500 hover:text-violet-800 dark:hover:text-violet-400"
          >
            View all
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!hasProject ? (
          <EmptyState
            title="No milestones yet"
            description="Set up your project and generate tasks to see milestones here."
            href="/onboarding"
            linkLabel="Complete onboarding"
          />
        ) : error ? (
          <EmptyState
            title="Could not load milestones"
            description={error}
            href="/onboarding"
            linkLabel="Try onboarding again"
          />
        ) : milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description={
              projectName
                ? `${projectName} has no generated phases yet. Run AI onboarding to create milestones.`
                : "Run AI onboarding to generate milestones and tasks."
            }
            href="/onboarding"
            linkLabel="Generate with AI"
          />
        ) : (
          <div className="max-h-64 space-y-0 overflow-y-auto pr-1">
            {milestones.map((milestone, index) => {
              const progress = Math.min(
                100,
                Math.max(0, milestone.progress ?? 0),
              );
              const isLast = index === milestones.length - 1;

              return (
                <div key={milestone.id} className="relative flex gap-3 pb-4">
                  {!isLast ? (
                    <span
                      aria-hidden
                      className="absolute top-8 left-[13px] h-[calc(100%-1rem)] w-px bg-border/70"
                    />
                  ) : null}
                  <div className="relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-violet-300 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-500/10 text-[11px] font-semibold text-violet-800 dark:text-violet-300">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {milestone.title}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium capitalize",
                          statusClassName(milestone.status),
                        )}
                      >
                        {statusLabel(milestone.status)}
                      </span>
                    </div>
                    {milestone.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {milestone.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {milestone.subtaskCount} task
                        {milestone.subtaskCount === 1 ? "" : "s"}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-violet-600 dark:bg-violet-500/70 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-8 text-center">
      <div className="rounded-xl bg-sky-100 dark:bg-sky-500/10 p-3 text-sky-700 dark:text-sky-400">
        <Layers3 className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-500 hover:text-violet-800 dark:hover:text-violet-400"
      >
        <Flag className="size-3" />
        {linkLabel}
      </Link>
    </div>
  );
}
