"use client";

import type { GithubComment, GithubPullItem, GithubReview } from "@/lib/integrations/github";
import { formatRelativeTime } from "./workflow-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TimelineItem =
  | { kind: "comment"; data: GithubComment }
  | { kind: "review"; data: GithubReview };

type PrConversationProps = {
  pull: GithubPullItem;
  comments: GithubComment[];
  reviews: GithubReview[];
  loading: boolean;
  onComment: (body: string) => Promise<void>;
  onReview: (body: string, event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") => Promise<void>;
};

function reviewIcon(state: string) {
  if (state === "APPROVED") return <ThumbsUp className="size-3.5 text-emerald-500" />;
  if (state === "CHANGES_REQUESTED") return <ThumbsDown className="size-3.5 text-amber-500" />;
  return <MessageSquare className="size-3.5 text-muted-foreground" />;
}

export function PrConversation({
  pull,
  comments,
  reviews,
  loading,
  onComment,
  onReview,
}: PrConversationProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeline: TimelineItem[] = [
    ...comments.map((c) => ({ kind: "comment" as const, data: c })),
    ...reviews.map((r) => ({ kind: "review" as const, data: r })),
  ].sort((a, b) => {
    const aDate = a.kind === "comment" ? a.data.created_at : a.data.submitted_at;
    const bDate = b.kind === "comment" ? b.data.created_at : b.data.submitted_at;
    return aDate.localeCompare(bDate);
  });

  async function submit(event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") {
    if (!text.trim() && event === "COMMENT") return;
    setSubmitting(true);
    try {
      if (event === "COMMENT") {
        await onComment(text.trim());
      } else {
        await onReview(text.trim(), event);
      }
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {pull.body ? (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={pull.user.avatar_url} />
              <AvatarFallback>{pull.user.login[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{pull.user.login}</span>
            <span className="text-xs text-muted-foreground">
              opened {formatRelativeTime(pull.created_at)}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{pull.body}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-violet-700 dark:text-violet-500" />
        </div>
      ) : timeline.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No comments yet</p>
      ) : (
        timeline.map((item) => {
          const user = item.data.user;
          const date =
            item.kind === "comment" ? item.data.created_at : item.data.submitted_at;

          return (
            <div key={`${item.kind}-${item.data.id}`} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.login[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.login}</span>
                {item.kind === "review" ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {reviewIcon(item.data.state)}
                    {item.data.state.replace("_", " ").toLowerCase()}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">{formatRelativeTime(date)}</span>
              </div>
              {item.data.body ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{item.data.body}</p>
              ) : null}
            </div>
          );
        })
      )}

      {pull.state === "open" ? (
        <div className="sticky bottom-0 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Leave a comment..."
            className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={submitting || !text.trim()}
              onClick={() => void submit("COMMENT")}
            >
              Comment
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-amber-600"
                disabled={submitting}
                onClick={() => void submit("REQUEST_CHANGES")}
              >
                <ThumbsDown className="size-3.5" />
                Request changes
              </Button>
              <Button
                size="sm"
                className={cn("gap-1 bg-emerald-600 hover:bg-emerald-700")}
                disabled={submitting}
                onClick={() => void submit("APPROVE")}
              >
                <ThumbsUp className="size-3.5" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
