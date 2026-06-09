"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

type WorkflowMode = "issue" | "pull";

type CreatePrFormProps = {
  mode: WorkflowMode;
  title: string;
  body: string;
  headBranch: string;
  baseBranch: string;
  branches: string[];
  draft: boolean;
  selectedRepo: string;
  submitting: boolean;
  generating: boolean;
  error?: string;
  onModeChange: (mode: WorkflowMode) => void;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onHeadChange: (v: string) => void;
  onBaseChange: (v: string) => void;
  onDraftChange: (v: boolean) => void;
  onSubmit: () => Promise<void>;
  onGenerate: () => Promise<void>;
  onClear: () => void;
};

export function CreatePrForm({
  mode,
  title,
  body,
  headBranch,
  baseBranch,
  branches,
  draft,
  selectedRepo,
  submitting,
  generating,
  error,
  onModeChange,
  onTitleChange,
  onBodyChange,
  onHeadChange,
  onBaseChange,
  onDraftChange,
  onSubmit,
  onGenerate,
  onClear,
}: CreatePrFormProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 gap-1.5">
        <Button
          size="sm"
          variant={mode === "pull" ? "default" : "outline"}
          className={cn("h-8 rounded-lg px-3", mode === "pull" && "bg-violet-600 hover:bg-violet-700")}
          onClick={() => onModeChange("pull")}
        >
          Pull Request
        </Button>
        <Button
          size="sm"
          variant={mode === "issue" ? "default" : "outline"}
          className={cn("h-8 rounded-lg px-3", mode === "issue" && "bg-violet-600 hover:bg-violet-700")}
          onClick={() => onModeChange("issue")}
        >
          New Issue
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-violet-700 dark:text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">
              {mode === "pull" ? "Create Pull Request" : "Create Issue"}
            </h2>
          </div>
          {mode === "pull" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={generating || !headBranch || !baseBranch}
              onClick={() => void onGenerate()}
            >
              {generating ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              AI generate
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={
                mode === "pull"
                  ? "feat(auth): implement JWT authentication"
                  : "Bug: login button not responding"
              }
              className="h-9"
            />
          </div>

          {mode === "pull" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Head branch
                  </Label>
                  <select
                    value={headBranch}
                    onChange={(e) => onHeadChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Base branch
                  </Label>
                  <select
                    value={baseBranch}
                    onChange={(e) => onBaseChange(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft}
                  onChange={(e) => onDraftChange(e.target.checked)}
                  className="rounded border-input"
                />
                Create as draft pull request
              </label>
            </>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </Label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={
                mode === "pull"
                  ? "## What changed\n\n## Why\n\n## Test plan\n\nCloses #N"
                  : "## Summary\n\n## Steps to reproduce\n\n## Expected behavior"
              }
              className="min-h-[88px] w-full flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-violet-500/40"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5">
          <Badge className="max-w-[12rem] truncate bg-violet-100 text-violet-600 dark:bg-violet-500/10">
            {selectedRepo}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={onClear}>
              Clear
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 rounded-lg bg-violet-600 hover:bg-violet-700"
              disabled={submitting || !title.trim()}
              onClick={() => void onSubmit()}
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  {mode === "pull" ? "Create on GitHub" : "Create Issue"}
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
