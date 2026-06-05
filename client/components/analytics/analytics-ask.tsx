"use client";

import { AnalyticsSectionHeader } from "@/components/analytics/analytics-section-header";
import { clientApi } from "@/app/lib/client-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Send } from "lucide-react";
import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export function AnalyticsAsk() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setInput("");
    setError(null);
    setMessages((current) => [...current, { role: "user", text: question }]);
    setIsLoading(true);

    try {
      const { data } = await clientApi.post<{ answer: string }>("/analytics/ask", {
        question,
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer },
      ]);
    } catch {
      setError("Could not get an answer. Is /analytics/ask available on the server?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-border/60 bg-[#16171b] p-4 shadow-sm">
      <AnalyticsSectionHeader
        icon={<Bot className="size-3.5 text-emerald-400" />}
        title="Ask AI"
      />

      <div className="flex min-h-48 flex-col rounded-lg border border-border/60 bg-[#1c1d22]">
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask about blocked tasks, risks, progress, or what to focus on this week.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-violet-600 text-white"
                    : "bg-[#25262b] text-foreground",
                )}
              >
                {message.text}
              </div>
            ))
          )}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Thinking...</p>
          ) : null}
        </div>

        {error ? <p className="px-3 pb-2 text-sm text-rose-400">{error}</p> : null}

        <form
          className="flex gap-2 border-t border-border/60 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion();
          }}
        >
          <input
            className="h-9 min-w-0 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-violet-500"
            placeholder="e.g. What should we prioritize this week?"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-lg bg-violet-600 hover:bg-violet-500"
            disabled={isLoading || !input.trim()}
          >
            <Send className="size-4" />
            Ask
          </Button>
        </form>
      </div>
    </section>
  );
}
