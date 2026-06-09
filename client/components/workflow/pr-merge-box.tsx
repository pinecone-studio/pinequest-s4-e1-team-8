"use client";

import { Button } from "@/components/ui/button";
import type { GithubPullItem } from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, GitMerge, Loader2, XCircle } from "lucide-react";
import { canMerge, mergeableLabel } from "./workflow-utils";

type PrMergeBoxProps = {
  pull: GithubPullItem;
  mergeMethod: "merge" | "squash" | "rebase";
  merging: boolean;
  closing: boolean;
  onMergeMethodChange: (method: "merge" | "squash" | "rebase") => void;
  onMerge: () => Promise<void>;
  onClose: () => Promise<void>;
  onMarkReady: () => Promise<void>;
};

export function PrMergeBox({
  pull,
  mergeMethod,
  merging,
  closing,
  onMergeMethodChange,
  onMerge,
  onClose,
  onMarkReady,
}: PrMergeBoxProps) {
  const status = mergeableLabel(pull);
  const mergeable = canMerge(pull);

  const toneIcon = {
    ok: <CheckCircle2 className="size-4 text-emerald-500" />,
    warn: <AlertCircle className="size-4 text-amber-500" />,
    error: <XCircle className="size-4 text-destructive" />,
    muted: <AlertCircle className="size-4 text-muted-foreground" />,
  }[status.tone];

  if (pull.state !== "open") {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
        This pull request is {pull.merged ? "merged" : "closed"}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5 p-5">
      <div className="flex items-start gap-3">
        {toneIcon}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{status.text}</p>
          {pull.draft ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Draft pull requests cannot be merged until marked ready for review.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-violet-500/20 pt-4">
        {pull.draft ? (
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            disabled={closing}
            onClick={() => void onMarkReady()}
          >
            {closing ? <Loader2 className="size-4 animate-spin" /> : "Mark ready for review"}
          </Button>
        ) : (
          <>
            <select
              value={mergeMethod}
              onChange={(e) =>
                onMergeMethodChange(e.target.value as "merge" | "squash" | "rebase")
              }
              disabled={!mergeable || merging}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-50"
            >
              <option value="merge">Create a merge commit</option>
              <option value="squash">Squash and merge</option>
              <option value="rebase">Rebase and merge</option>
            </select>
            <Button
              className={cn("gap-1.5 bg-violet-600 hover:bg-violet-700")}
              disabled={!mergeable || merging}
              onClick={() => void onMerge()}
            >
              {merging ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Merge pull request
                  <GitMerge className="size-4" />
                </>
              )}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={closing}
          onClick={() => void onClose()}
        >
          {closing ? <Loader2 className="size-4 animate-spin" /> : "Close pull request"}
        </Button>
      </div>
    </div>
  );
}
