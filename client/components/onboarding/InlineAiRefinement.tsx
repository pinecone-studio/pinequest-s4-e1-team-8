"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { REFINE_QUICK_ACTIONS } from "@/lib/onboarding/refine-actions";
import { requestRefineSelection } from "@/lib/onboarding/onboarding-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

type InlineAiRefinementProps = {
  blockTitle: string;
  containerRef: React.RefObject<HTMLElement | null>;
  content: string;
  onContentChange: (nextContent: string) => void;
};

type SelectionState = {
  selectedText: string;
  paragraphContext: string;
  rect: DOMRect;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

const MARKDOWN_NOISE = "[*_`#]*";
const MAX_FUZZY_SELECTION_LENGTH = 300;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The toolbar's selectedText comes from the rendered preview, where markdown
// syntax (**, `, #, -) is already stripped — so it rarely matches `content`
// (raw markdown) verbatim. This builds a pattern that tolerates markdown
// noise around/within the selection so the AI's reply can replace the same
// span of raw markdown the user actually highlighted.
function buildFuzzyContentPattern(selectedText: string): RegExp | null {
  if (!selectedText || selectedText.length > MAX_FUZZY_SELECTION_LENGTH) {
    return null;
  }

  let pattern = "";
  for (const char of selectedText) {
    pattern += MARKDOWN_NOISE;
    pattern += /\s/.test(char) ? "\\s+" : escapeRegExp(char);
  }
  pattern += MARKDOWN_NOISE;

  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

function findSelectionRange(content: string, selectedText: string): [number, number] | null {
  const exactIndex = content.indexOf(selectedText);
  if (exactIndex !== -1) {
    return [exactIndex, exactIndex + selectedText.length];
  }

  const pattern = buildFuzzyContentPattern(selectedText);
  const match = pattern?.exec(content);
  if (!match) {
    return null;
  }

  return [match.index, match.index + match[0].length];
}

export function InlineAiRefinement({
  blockTitle,
  containerRef,
  content,
  onContentChange,
}: InlineAiRefinementProps) {
  const { getToken } = useAuth();
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [instruction, setInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setInstruction("");
    setError(null);
  }, []);

  const updateSelection = useCallback(() => {
    if (isTypingTarget(document.activeElement)) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      clearSelection();
      return;
    }

    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.isCollapsed || nativeSelection.rangeCount === 0) {
      clearSelection();
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const selectedText = nativeSelection.toString().trim();
    if (!selectedText || !container.contains(range.commonAncestorContainer)) {
      clearSelection();
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      clearSelection();
      return;
    }

    setSelection({
      selectedText,
      paragraphContext: content,
      rect,
    });
  }, [clearSelection, containerRef, content]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateSelection]);

  const runRefinement = useCallback(
    async (nextInstruction: string) => {
      if (!selection || !nextInstruction.trim() || isRefining) {
        return;
      }

      setIsRefining(true);
      setError(null);

      try {
        const result = await requestRefineSelection(
          {
            blockTitle,
            paragraphContext: selection.paragraphContext,
            selectedText: selection.selectedText,
            instruction: nextInstruction.trim(),
          },
          () => getToken({ skipCache: true }),
        );

        const range = findSelectionRange(content, selection.selectedText);
        const nextContent = range
          ? `${content.slice(0, range[0])}${result.refinedText}${content.slice(range[1])}`
          : `${content}\n\n${result.refinedText}`;
        onContentChange(nextContent);

        window.getSelection()?.removeAllRanges();
        clearSelection();
      } catch (refineError) {
        setError(
          refineError instanceof Error ? refineError.message : "Refinement failed unexpectedly.",
        );
      } finally {
        setIsRefining(false);
      }
    },
    [blockTitle, clearSelection, content, getToken, isRefining, onContentChange, selection],
  );

  if (!selection) {
    return null;
  }

  const top = Math.max(12, selection.rect.top + window.scrollY - 56);
  const left = Math.min(
    Math.max(12, selection.rect.left + window.scrollX),
    window.innerWidth - 320,
  );

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 w-[min(320px,calc(100vw-24px))] rounded-xl border border-violet-500/30 bg-card p-3 shadow-xl"
      style={{ top, left }}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        <Wand2 className="size-3.5" />
        AI Refinement
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runRefinement(instruction);
        }}
      >
        <input
          type="text"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Ask AI to rewrite..."
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none ring-violet-500/30 focus:ring-2"
          disabled={isRefining}
          onKeyDown={(event) => event.stopPropagation()}
          onKeyUp={(event) => event.stopPropagation()}
        />
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {REFINE_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={isRefining}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void runRefinement(action.instruction)}
            className={cn(
              "rounded-full border border-violet-400/30 px-2.5 py-1 text-[11px] font-medium text-violet-800 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:text-violet-200 dark:hover:bg-violet-500/15",
            )}
          >
            {action.label}
          </button>
        ))}
      </div>

      {isRefining ? (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Refining selection
          <Sparkles className="size-3.5 text-violet-500" />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[12px] text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
