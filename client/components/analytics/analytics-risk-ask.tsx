"use client";

import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsRiskItem, AnalyticsRisks } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { ArrowUp, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const quickQuestions = [
  "What should we prioritize this week?",
  "Which risks are most critical?",
  "How can we reduce blocked tasks?",
];

function buildPortfolioQuestion(risks: AnalyticsRisks, question: string) {
  const topItems = risks.items
    .slice(0, 5)
    .map(
      (item) =>
        `- ${item.title} (${item.team}, ${item.level}): ${item.reason}`,
    )
    .join("\n");

  return [
    "Risk dashboard context:",
    `Blocked: ${risks.blocked}, Due this week: ${risks.dueThisWeek}, Urgent: ${risks.urgent}`,
    `Active risk items:\n${topItems || "None"}`,
    "",
    question,
  ].join("\n");
}

export function AnalyticsRisksAskPanel({ risks }: { risks: AnalyticsRisks }) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topRisk = useMemo(
    () =>
      risks.items.find((item) => item.level === "high") ?? risks.items[0] ?? null,
    [risks.items],
  );

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setAnswer(null);
    setIsLoading(true);

    try {
      const { data } = await clientApi.post<{ answer: string }>("/analytics/ask", {
        question: buildPortfolioQuestion(risks, trimmed),
      });
      setAnswer(data.answer);
    } catch {
      setError("Could not get an answer. Is the server running with GEMINI_API_KEY?");
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async () => {
    const question = input.trim();
    if (!question) return;
    setInput("");
    await ask(question);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border/50 bg-card/60 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-violet-700 dark:text-violet-400/70" />
        <p className="text-xs font-medium text-foreground/80">Ask AI</p>
      </div>

      {topRisk ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Focus: {topRisk.title} · {topRisk.level} risk
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isLoading}
            onClick={() => void ask(question)}
            className="rounded-full border border-border/50 bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-foreground/80 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          className="h-8 min-w-0 flex-1 rounded-lg border border-border/50 bg-secondary/80 px-3 text-sm text-foreground/90 outline-none placeholder:text-muted-foreground focus:border-violet-500/40"
          placeholder="Ask about your risks..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg bg-violet-700/80 text-white transition-colors hover:bg-violet-600/80 disabled:opacity-50",
          )}
        >
          <ArrowUp className="size-4" />
        </button>
      </form>

      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Thinking...</p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-400/80">{error}</p> : null}

      {answer ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/85">
          {answer}
        </p>
      ) : null}
    </div>
  );
}

function getQuickQuestions(item: AnalyticsRiskItem): string[] {
  const questions: string[] = [];

  if (item.reason.toLowerCase().includes("blocked")) {
    questions.push("How do we unblock this?");
  }

  if (item.level === "high") {
    questions.push("Why is this high severity?");
  } else if (item.level === "medium") {
    questions.push("Why is this medium risk?");
  } else {
    questions.push("Can this be deprioritized?");
  }

  questions.push("What's the next step?");

  return questions.slice(0, 3);
}

function buildQuestion(item: AnalyticsRiskItem, question: string) {
  return [
    `Task: "${item.title}"`,
    `Team: ${item.team}`,
    `Risk: ${item.reason} (${item.level})`,
    "",
    question,
  ].join("\n");
}

export function AnalyticsRiskAsk({ item }: { item: AnalyticsRiskItem }) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickQuestionsForItem = getQuickQuestions(item);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setAnswer(null);
    setIsLoading(true);

    try {
      const { data } = await clientApi.post<{ answer: string }>("/analytics/ask", {
        question: buildQuestion(item, trimmed),
      });
      setAnswer(data.answer);
    } catch {
      setError("Could not get an answer. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async () => {
    const question = input.trim();
    if (!question) return;
    setInput("");
    await ask(question);
  };

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-card/60 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-violet-700 dark:text-violet-400/70" />
        <p className="text-xs font-medium text-foreground/80">
          Ask AI — {item.title}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {quickQuestionsForItem.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isLoading}
            onClick={() => void ask(question)}
            className="rounded-full border border-border/50 bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-violet-500/30 hover:text-foreground/80 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          className="h-8 min-w-0 flex-1 rounded-lg border border-border/50 bg-secondary/80 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-violet-500/40"
          placeholder="Ask a question..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg bg-violet-700/80 text-white transition-colors hover:bg-violet-600/80 disabled:opacity-50",
          )}
        >
          <ArrowUp className="size-4" />
        </button>
      </form>

      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Thinking...</p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-400/80">{error}</p> : null}

      {answer ? (
        <p className="mt-2 text-sm leading-relaxed text-foreground/85">{answer}</p>
      ) : null}
    </div>
  );
}
