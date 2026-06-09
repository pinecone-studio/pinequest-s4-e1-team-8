"use client";

import { Button } from "@/components/ui/button";
import type {
  GithubCheckRun,
  GithubComment,
  GithubPullFile,
  GithubPullItem,
  GithubReview,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { ExternalLink, GitBranch, GitCommit, Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { PrConversation } from "./pr-conversation";
import { PrDiff } from "./pr-diff";
import { PrMergeBox } from "./pr-merge-box";
import { formatRelativeTime } from "./workflow-utils";

type PrTab = "conversation" | "files" | "commits" | "checks";

type PrDetailProps = {
  pull: GithubPullItem;
  files: GithubPullFile[];
  commits: { sha: string; commit: { message: string; author: { name: string; date: string } } }[];
  comments: GithubComment[];
  reviews: GithubReview[];
  checks: { state: string; total_count: number; check_runs: GithubCheckRun[] } | null;
  loading: boolean;
  mergeMethod: "merge" | "squash" | "rebase";
  merging: boolean;
  closing: boolean;
  onMergeMethodChange: (method: "merge" | "squash" | "rebase") => void;
  onMerge: () => Promise<void>;
  onClose: () => Promise<void>;
  onMarkReady: () => Promise<void>;
  onComment: (body: string) => Promise<void>;
  onReview: (body: string, event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") => Promise<void>;
  onUpdate: (fields: { title?: string; body?: string }) => Promise<void>;
};

const TABS: { id: PrTab; label: string }[] = [
  { id: "conversation", label: "Conversation" },
  { id: "files", label: "Files changed" },
  { id: "commits", label: "Commits" },
  { id: "checks", label: "Checks" },
];

export function PrDetail({
  pull,
  files,
  commits,
  comments,
  reviews,
  checks,
  loading,
  mergeMethod,
  merging,
  closing,
  onMergeMethodChange,
  onMerge,
  onClose,
  onMarkReady,
  onComment,
  onReview,
  onUpdate,
}: PrDetailProps) {
  const [tab, setTab] = useState<PrTab>("conversation");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(pull.title);
  const [editBody, setEditBody] = useState(pull.body ?? "");
  const [saving, setSaving] = useState(false);

  async function saveEdit() {
    setSaving(true);
    try {
      await onUpdate({
        title: editTitle.trim() || pull.title,
        body: editBody,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="shrink-0 p-3 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={saving} onClick={() => void saveEdit()}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold leading-snug text-foreground">
                    #{pull.number} {pull.title}
                  </h2>
                  {pull.draft ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      Draft
                    </span>
                  ) : null}
                  {pull.state === "open" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(pull.title);
                        setEditBody(pull.body ?? "");
                        setEditing(true);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pull.user.login} opened {formatRelativeTime(pull.created_at)}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <GitBranch className="size-3" />
                  {pull.head.ref} → {pull.base.ref}
                </p>
              </>
            )}
          </div>
          <a
            href={pull.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
          >
            View on GitHub
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="mt-3 flex gap-1 border-b border-border/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "border-b-2 px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "border-violet-500 text-violet-600"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "files" && files.length > 0 ? (
                <span className="ml-1.5 text-xs text-muted-foreground">{files.length}</span>
              ) : null}
            </button>
          ))}
        </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-2">
          {tab === "conversation" ? (
            <PrConversation
              pull={pull}
              comments={comments}
              reviews={reviews}
              loading={loading}
              onComment={onComment}
              onReview={onReview}
            />
          ) : null}
          {tab === "files" ? <PrDiff files={files} loading={loading} /> : null}
          {tab === "commits" ? (
            loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-violet-700 dark:text-violet-500" />
              </div>
            ) : commits.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No commits</p>
            ) : (
              <div className="space-y-2">
                {commits.map((c) => (
                  <div
                    key={c.sha}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-4 py-3"
                  >
                    <GitCommit className="mt-0.5 size-4 shrink-0 text-violet-700 dark:text-violet-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {c.commit.message.split("\n")[0]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.commit.author.name} · {formatRelativeTime(c.commit.author.date)} ·{" "}
                        <span className="font-mono">{c.sha.slice(0, 7)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
          {tab === "checks" ? (
            loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-violet-700 dark:text-violet-500" />
              </div>
            ) : !checks ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No checks</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Overall: <span className="font-medium text-foreground">{checks.state}</span> (
                  {checks.total_count} checks)
                </p>
                {checks.check_runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
                  >
                    <span className="text-sm font-medium">{run.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          run.conclusion === "success"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600"
                            : run.conclusion === "failure"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber-100 dark:bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {run.conclusion ?? run.status}
                      </span>
                      <a
                        href={run.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
      <PrMergeBox
        pull={pull}
        mergeMethod={mergeMethod}
        merging={merging}
        closing={closing}
        onMergeMethodChange={onMergeMethodChange}
        onMerge={onMerge}
        onClose={onClose}
        onMarkReady={onMarkReady}
      />
      </div>
    </div>
  );
}
