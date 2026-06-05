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
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex gap-2">
        <Button
          variant={mode === "pull" ? "default" : "outline"}
          className={cn("rounded-xl", mode === "pull" && "bg-violet-600 hover:bg-violet-700")}
          onClick={() => onModeChange("pull")}
        >
          Pull Request
        </Button>
        <Button
          variant={mode === "issue" ? "default" : "outline"}
          className={cn("rounded-xl", mode === "issue" && "bg-violet-600 hover:bg-violet-700")}
          onClick={() => onModeChange("issue")}
        >
          New Issue
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">
              {mode === "pull" ? "Create Pull Request" : "Create Issue"}
            </h2>
          </div>
          {mode === "pull" ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={generating || !headBranch || !baseBranch}
              onClick={() => void onGenerate()}
            >
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              AI generate
            </Button>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              className="h-10"
            />
          </div>

          {mode === "pull" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Head branch
                  </Label>
                  <select
                    value={headBranch}
                    onChange={(e) => onHeadChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Base branch
                  </Label>
                  <select
                    value={baseBranch}
                    onChange={(e) => onBaseChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
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

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </Label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              rows={8}
              placeholder={
                mode === "pull"
                  ? "## What changed\n\n## Why\n\n## Test plan\n\nCloses #N"
                  : "## Summary\n\n## Steps to reproduce\n\n## Expected behavior"
              }
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-violet-500/40"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
          <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/10">
            {selectedRepo}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClear}>
              Clear
            </Button>
            <Button
              className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700"
              disabled={submitting || !title.trim()}
              onClick={() => void onSubmit()}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {mode === "pull" ? "Create on GitHub" : "Create Issue"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
