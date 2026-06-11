"use client";

import type { ContextualSuggestion } from "@/lib/onboarding/tdd-types";
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
  contextualSuggestions?: ContextualSuggestion[];
  onInjectSuggestion?: (text: string) => void;
  helperText?: string;
};

export function ScopingPromptBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  placeholder = "Describe your goals, timeline, and team…",
  contextualSuggestions = [],
  onInjectSuggestion,
  helperText,
}: ScopingPromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionIndexRef = useRef(0);

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

  useEffect(() => {
    suggestionIndexRef.current = 0;
  }, [contextualSuggestions]);

  const injectSuggestion = useCallback(
    (text: string) => {
      if (onInjectSuggestion) {
        onInjectSuggestion(text);
      } else {
        onChange(text);
      }
      textareaRef.current?.focus();
      resize();
    },
    [onChange, onInjectSuggestion, resize],
  );

  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className="shrink-0 pt-2">
      {contextualSuggestions.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {contextualSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.display_label}-${index}`}
              type="button"
              disabled={disabled || isLoading}
              onClick={() => injectSuggestion(suggestion.text_to_inject)}
              className="rounded-full border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 py-1 text-[12px] font-medium text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion.display_label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-2 rounded-[28px] border border-border/70 bg-secondary/70 px-3 py-2",
          "shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:bg-secondary/50 dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)]",
        )}
      >
        <Sparkles className="mb-2.5 size-5 shrink-0 text-[#7c3aed]" />
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Tab" &&
              contextualSuggestions.length > 0 &&
              !event.shiftKey
            ) {
              event.preventDefault();
              const suggestion =
                contextualSuggestions[suggestionIndexRef.current] ??
                contextualSuggestions[0];
              if (suggestion) {
                injectSuggestion(suggestion.text_to_inject);
                suggestionIndexRef.current =
                  (suggestionIndexRef.current + 1) % contextualSuggestions.length;
              }
              return;
            }
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
        {helperText ??
          (contextualSuggestions.length > 0
            ? "Click a chip or press Tab to inject a suggestion into the input."
            : "Brisk AI drafts milestones — review and edit before continuing.")}
      </p>
    </div>
  );
}
