"use client";

import type { ContextualSuggestion } from "@/lib/onboarding/tdd-types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

type DiscoveryInteractionFooterProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions: ContextualSuggestion[];
  disabled?: boolean;
  isLoading?: boolean;
};

export function DiscoveryInteractionFooter({
  value,
  onChange,
  onSubmit,
  suggestions,
  disabled = false,
  isLoading = false,
}: DiscoveryInteractionFooterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

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
    const node = footerRef.current;
    if (!node) {
      return;
    }

    const stopGlobalShortcuts = (event: KeyboardEvent) => {
      event.stopPropagation();
    };

    node.addEventListener("keydown", stopGlobalShortcuts);
    node.addEventListener("keyup", stopGlobalShortcuts);
    return () => {
      node.removeEventListener("keydown", stopGlobalShortcuts);
      node.removeEventListener("keyup", stopGlobalShortcuts);
    };
  }, []);

  const injectSuggestion = useCallback(
    (text: string) => {
      onChange(text);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        resize();
      });
    },
    [onChange, resize],
  );

  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <footer
      ref={footerRef}
      className="shrink-0 px-6 pb-8 pt-4"
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
    >
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <AnimatePresence mode="popLayout">
          {suggestions.length > 0 ? (
            <motion.div
              key={suggestions.map((item) => item.display_label).join("|")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.display_label}-${index}`}
                  type="button"
                  disabled={disabled || isLoading}
                  onClick={() => injectSuggestion(suggestion.text_to_inject)}
                  className={cn(
                    "rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors",
                    "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45",
                  )}
                >
                  {suggestion.display_label}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="rounded-[28px] border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-end gap-3">
            <button
              type="button"
              disabled
              aria-hidden
              tabIndex={-1}
              className="mb-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground"
            >
              <Plus className="size-5" strokeWidth={1.75} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (
                  event.key === "Tab" &&
                  suggestions.length > 0 &&
                  !value.trim() &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  injectSuggestion(suggestions[0].text_to_inject);
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
              placeholder="Describe your idea in plain language — what should this app help people do?"
              className="mb-0.5 block max-h-32 min-h-[28px] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />

            <button
              type="button"
              aria-label="Send discovery response"
              disabled={!canSubmit}
              onClick={onSubmit}
              className={cn(
                "mb-0.5 grid size-9 shrink-0 place-items-center rounded-full transition-colors",
                canSubmit
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" strokeWidth={2.25} />
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
          Click a suggestion or press Tab to fill your answer. Press Enter to send.
        </p>
      </div>
    </footer>
  );
}
