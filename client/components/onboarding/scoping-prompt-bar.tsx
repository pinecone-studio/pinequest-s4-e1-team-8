"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

type ScopingPromptBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
};

export function ScopingPromptBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  placeholder = "Describe your goals, timeline, and team…",
}: ScopingPromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize, value]);

  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className="shrink-0 pt-2">
      <div
        className={cn(
          "flex items-end gap-2 rounded-[28px] border border-border/70 bg-secondary/70 px-3 py-2",
          "shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:bg-secondary/50 dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)]",
        )}
      >
        <Sparkles className="mb-2.5 size-5 shrink-0 text-violet-500 dark:text-violet-400" />
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSubmit) {
                onSubmit();
              }
            }
          }}
          disabled={disabled || isLoading}
          placeholder={placeholder}
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Send prompt"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="mb-1 grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Brisk AI drafts milestones — review and edit before continuing.
      </p>
    </div>
  );
}
