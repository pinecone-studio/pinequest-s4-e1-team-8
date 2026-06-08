"use client";

import { clientApi } from "@/app/lib/client-api";
import type { AnalyticsRiskItem } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";
import { ArrowUp, Sparkles } from "lucide-react";
import { useState } from "react";

function getQuickQuestions(item: AnalyticsRiskItem): string[] {
  const questions: string[] = [];

  if (item.reason.toLowerCase().includes("blocked")) {
    questions.push("Яаж blocker-ийг арилгах вэ?");
  }

  if (item.level === "high") {
    questions.push("Эрсдэлийн ноцтой байдал?");
  } else if (item.level === "medium") {
    questions.push("Яагаад энэ эрсдэл дунд түвшинд байна?");
  } else {
    questions.push("Энэ ажлыг хойшлуулах боломжтой юу?");
  }

  questions.push("Дараагийн алхам?");

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

  const quickQuestions = getQuickQuestions(item);

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
      setError("Хариулт авахад алдаа гарлаа. Сервер ажиллаж байгаа эсэхийг шалгана уу.");
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
    <div className="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-sky-400" />
        <p className="text-xs font-medium text-sky-300">
          Ask AI — {item.title}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isLoading}
            onClick={() => void ask(question)}
            className="rounded-full border border-border/60 bg-[#1c1d22] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-sky-500/40 hover:text-foreground disabled:opacity-50"
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
          className="h-8 min-w-0 flex-1 rounded-lg border border-sky-500/30 bg-[#1c1d22] px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-sky-500/60"
          placeholder="Асуулт тавь..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:opacity-50",
          )}
        >
          <ArrowUp className="size-4" />
        </button>
      </form>

      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Бодож байна...</p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}

      {answer ? (
        <p className="mt-2 text-sm leading-relaxed text-foreground">{answer}</p>
      ) : null}
    </div>
  );
}
