"use client";

import { cn } from "@/lib/utils";
import type { GithubIssueItem, GithubPullItem, PrFilter } from "@/lib/integrations/github";
import { formatRelativeTime, prStatusBadge } from "./workflow-utils";
import { AlertCircle, CheckCircle2, Circle, GitBranch, GitPullRequest } from "lucide-react";

type FeedTab = "pulls" | "issues";

type PrFeedProps = {
  pulls: GithubPullItem[];
  issues: GithubIssueItem[];
  selectedPull: GithubPullItem | null;
  selectedIssue: GithubIssueItem | null;
  feedTab: FeedTab;
  prFilter: PrFilter;
  onFeedTabChange: (tab: FeedTab) => void;
  onPrFilterChange: (filter: PrFilter) => void;
  onSelectPull: (pull: GithubPullItem) => void;
  onSelectIssue: (issue: GithubIssueItem) => void;
};

const FILTERS: { value: PrFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

export function PrFeed({
  pulls,
  issues,
  selectedPull,
  selectedIssue,
  feedTab,
  prFilter,
  onFeedTabChange,
  onPrFilterChange,
  onSelectPull,
  onSelectIssue,
}: PrFeedProps) {
  return (
    <section className="flex min-h-0 w-full shrink-0 flex-col gap-2 overflow-hidden sm:w-[280px]">
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onFeedTabChange("pulls")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            feedTab === "pulls"
              ? "border-violet-500/50 bg-violet-100 dark:bg-violet-500/10 text-violet-600"
              : "border-border/60 text-muted-foreground hover:border-border",
          )}
        >
          Pull Requests
        </button>
        <button
          type="button"
          onClick={() => onFeedTabChange("issues")}
          className={cn(
            "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
            feedTab === "issues"
              ? "border-violet-500/50 bg-violet-100 dark:bg-violet-500/10 text-violet-600"
              : "border-border/60 text-muted-foreground hover:border-border",
          )}
        >
          Issues
        </button>
      </div>

      {feedTab === "pulls" ? (
        <div className="flex shrink-0 gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onPrFilterChange(f.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                prFilter === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="scrollbar-default flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
        {feedTab === "pulls" ? (
          pulls.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No pull requests
            </p>
          ) : (
            pulls.map((pull) => {
              const badge = prStatusBadge(pull.merged ? "merged" : pull.state);
              const isSelected = selectedPull?.number === pull.number;

              return (
                <button
                  key={pull.number}
                  type="button"
                  onClick={() => onSelectPull(pull)}
                  className={cn(
                    "shrink-0 rounded-lg border bg-card p-2.5 text-left transition-colors",
                    isSelected
                      ? "border-violet-500/50 ring-1 ring-violet-400 dark:ring-violet-500/30"
                      : "border-border/60 hover:border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1 text-xs font-semibold text-foreground">
                      <GitPullRequest className="size-3 shrink-0 text-violet-700 dark:text-violet-500" />
                      <span className="truncate">#{pull.number}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {pull.draft ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          Draft
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground">{pull.title}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <GitBranch className="size-3 shrink-0" />
                    <span className="truncate">
                      {pull.head.ref} → {pull.base.ref}
                    </span>
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{formatRelativeTime(pull.created_at)}</span>
                    {pull.mergeable_state === "clean" ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    ) : pull.mergeable === false || pull.mergeable_state === "dirty" ? (
                      <AlertCircle className="size-3.5 text-destructive" />
                    ) : (
                      <Circle className="size-3.5 text-amber-500" />
                    )}
                  </div>
                </button>
              );
            })
          )
        ) : issues.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            No issues
          </p>
        ) : (
          issues.map((issue) => {
            const badge = prStatusBadge(issue.state);
            const isSelected = selectedIssue?.number === issue.number;

            return (
              <button
                key={issue.number}
                type="button"
                onClick={() => onSelectIssue(issue)}
                className={cn(
                  "shrink-0 rounded-lg border bg-card p-2.5 text-left transition-colors",
                  isSelected
                    ? "border-violet-500/50 ring-1 ring-violet-400 dark:ring-violet-500/30"
                    : "border-border/60 hover:border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-foreground">#{issue.number}</div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground">{issue.title}</p>
                {issue.labels.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {issue.labels.slice(0, 3).map((l) => (
                      <span
                        key={l.name}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: `#${l.color}22`, color: `#${l.color}` }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
