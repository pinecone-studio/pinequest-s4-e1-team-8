"use client";

import type { OnboardingTranscriptMessage } from "@/lib/onboarding/tdd-types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

type DiscoveryFeedProps = {
  messages: OnboardingTranscriptMessage[];
  streamingContent: string;
  isLoading: boolean;
  round: number;
};

export function DiscoveryFeed({
  messages,
  streamingContent,
  isLoading,
  round,
}: DiscoveryFeedProps) {
  const displayRound = Math.max(round, 1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isLoading]);

  const isEmpty = messages.length === 0 && !isLoading && !streamingContent;

  return (
    <section
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 [-webkit-overflow-scrolling:touch]"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {isEmpty ? (
          <div className="flex min-h-[min(420px,50vh)] flex-col items-center justify-center px-4 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg space-y-3"
            >
              <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-foreground">
                Cognitive Product Architect
              </h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Describe your idea in plain language. The architect will ask a few rounds of
                grouped questions about your vision, users, features, and data — then build your
                TDD.
              </p>
            </motion.div>
          </div>
        ) : null}

        {!isEmpty ? (
          <div className="flex flex-col gap-8 py-8">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: message.role === "user" ? 12 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex w-full flex-col gap-2",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  {message.role === "assistant" ? (
                    <span className="text-[12px] text-muted-foreground">
                      Product Architect
                      {message.round ? ` · Round ${message.round}` : ""}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[85%] text-[15px] leading-relaxed",
                      message.role === "user"
                        ? "rounded-2xl bg-violet-600 px-4 py-3 text-white"
                        : "text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                  {message.questions && message.questions.length > 0 ? (
                    <ol className="flex max-w-[85%] flex-col gap-3">
                      {message.questions.map((question, index) => (
                        <li key={question.id} className="space-y-1 text-[15px] leading-relaxed text-foreground">
                          <p>
                            <span className="font-semibold">{index + 1}.</span> {question.prompt}
                          </p>
                          {question.examples && question.examples.length > 0 ? (
                            <p className="text-[13px] text-muted-foreground">
                              e.g. {question.examples.join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>

            {streamingContent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full flex-col gap-2"
              >
                <span className="text-[12px] text-muted-foreground">
                  Product Architect · Round {displayRound}
                </span>
                <div className="max-w-[85%] text-[15px] leading-relaxed text-foreground">
                  {streamingContent}
                  <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-muted-foreground/60" />
                </div>
              </motion.div>
            ) : null}

            {isLoading && !streamingContent ? (
              <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking through round {displayRound}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
