"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  GithubAssignee,
  GithubComment,
  GithubIssueItem,
  GithubLabel,
  GithubMilestone,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Milestone, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { formatRelativeTime } from "./workflow-utils";

type IssueDetailProps = {
  issue: GithubIssueItem;
  comments: GithubComment[];
  labels: GithubLabel[];
  milestones: GithubMilestone[];
  assignableUsers: GithubAssignee[];
  loading: boolean;
  saving: boolean;
  onComment: (body: string) => Promise<void>;
  onCreateMilestone: (title: string) => Promise<void>;
  onUpdate: (fields: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
    milestone?: number | null;
  }) => Promise<void>;
};

export function IssueDetail({
  issue,
  comments,
  labels,
  milestones,
  assignableUsers,
  loading,
  saving,
  onComment,
  onCreateMilestone,
  onUpdate,
}: IssueDetailProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editBody, setEditBody] = useState(issue.body ?? "");
  const [selectedLabels, setSelectedLabels] = useState(issue.labels.map((l) => l.name));
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(
    issue.milestone?.number ?? null,
  );
  const [selectedAssignees, setSelectedAssignees] = useState(
    issue.assignees.map((a) => a.login),
  );
  const [newMilestone, setNewMilestone] = useState("");
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  async function submitComment() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onComment(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  async function createMilestone() {
    if (!newMilestone.trim()) return;
    setCreatingMilestone(true);
    try {
      await onCreateMilestone(newMilestone.trim());
      setNewMilestone("");
    } finally {
      setCreatingMilestone(false);
    }
  }

  async function saveEdit() {
    await onUpdate({
      title: editTitle.trim() || issue.title,
      body: editBody,
      labels: selectedLabels,
      assignees: selectedAssignees,
      milestone: selectedMilestone,
    });
    setEditing(false);
  }

  async function toggleState() {
    await onUpdate({ state: issue.state === "open" ? "closed" : "open" });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="shrink-0 border-b border-border/60 p-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
                  rows={6}
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                />
                {labels.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Labels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((l) => (
                        <button
                          key={l.name}
                          type="button"
                          onClick={() =>
                            setSelectedLabels((prev) =>
                              prev.includes(l.name)
                                ? prev.filter((n) => n !== l.name)
                                : [...prev, l.name],
                            )
                          }
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-opacity",
                            selectedLabels.includes(l.name) ? "opacity-100" : "opacity-40",
                          )}
                          style={{ backgroundColor: `#${l.color}22`, color: `#${l.color}` }}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {assignableUsers.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Assignees
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assignableUsers.map((u) => (
                        <button
                          key={u.login}
                          type="button"
                          onClick={() =>
                            setSelectedAssignees((prev) =>
                              prev.includes(u.login)
                                ? prev.filter((n) => n !== u.login)
                                : [...prev, u.login],
                            )
                          }
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors",
                            selectedAssignees.includes(u.login)
                              ? "border-violet-500/50 bg-violet-100 dark:bg-violet-500/10 text-violet-600"
                              : "border-border/60 text-muted-foreground hover:border-border",
                          )}
                        >
                          <Avatar className="size-4">
                            <AvatarImage src={u.avatar_url} />
                            <AvatarFallback>{u.login[0]}</AvatarFallback>
                          </Avatar>
                          {u.login}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Milestone
                  </p>
                  <select
                    value={selectedMilestone ?? ""}
                    onChange={(e) =>
                      setSelectedMilestone(e.target.value ? Number(e.target.value) : null)
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    <option value="">No milestone</option>
                    {milestones.map((m) => (
                      <option key={m.number} value={m.number}>
                        {m.title}
                        {m.state === "closed" ? " (closed)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      placeholder="New milestone title…"
                      className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!newMilestone.trim() || creatingMilestone}
                      onClick={() => void createMilestone()}
                    >
                      {creatingMilestone ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

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
                  <h2 className="text-lg font-semibold text-foreground">
                    #{issue.number} {issue.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(issue.title);
                      setEditBody(issue.body ?? "");
                      setSelectedLabels(issue.labels.map((l) => l.name));
                      setSelectedAssignees(issue.assignees.map((a) => a.login));
                      setSelectedMilestone(issue.milestone?.number ?? null);
                      setEditing(true);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                {issue.user ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {issue.user.login}
                    {issue.created_at ? ` · ${formatRelativeTime(issue.created_at)}` : ""}
                  </p>
                ) : null}
                {issue.body ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{issue.body}</p>
                ) : null}
                {issue.labels.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {issue.labels.map((l) => (
                      <span
                        key={l.name}
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `#${l.color}22`, color: `#${l.color}` }}
                      >
                        {l.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                {issue.assignees.length > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Assignees:</span>
                    {issue.assignees.map((a) => (
                      <Avatar key={a.login} className="size-6">
                        <AvatarImage src={a.avatar_url} />
                        <AvatarFallback>{a.login[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                ) : null}
                {issue.milestone ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Milestone className="size-3.5" />
                    {issue.milestone.title}
                  </div>
                ) : null}
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {issue.html_url ? (
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
              >
                View on GitHub
                <ExternalLink className="size-3" />
              </a>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void toggleState()}
            >
              {issue.state === "open" ? "Close issue" : "Reopen issue"}
            </Button>
          </div>
        </div>
      </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pt-3">
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Comments
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-violet-700 dark:text-violet-500" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No comments yet</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={c.user.avatar_url} />
                    <AvatarFallback>{c.user.login[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{c.user.login}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(c.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            ))
          )}

          {issue.state === "open" ? (
            <div className="rounded-xl border border-border/60 p-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="Add a comment..."
                className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
              <Button
                size="sm"
                className="mt-2 bg-violet-600 hover:bg-violet-700"
                disabled={submitting || !text.trim()}
                onClick={() => void submitComment()}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Comment"}
              </Button>
            </div>
          ) : null}
        </div>
        </div>
    </div>
  );
}
