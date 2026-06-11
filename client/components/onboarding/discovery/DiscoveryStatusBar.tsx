"use client";

import { HARD_ROUND_CAP, type DiscoveryStatusMetrics } from "@/lib/onboarding/discovery-types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

type DiscoveryStatusBarProps = {
  metrics: DiscoveryStatusMetrics;
  onBack?: () => void;
  mode?: "interview" | "canvas";
};

export function DiscoveryStatusBar({ metrics, onBack, mode = "interview" }: DiscoveryStatusBarProps) {
  const round = Math.max(metrics.round, 1);
  const progress = mode === "canvas" ? 100 : metrics.coverage;

  return (
    <header className="shrink-0 px-6 pt-6 pb-4">
      <div className={cn("mx-auto flex w-full flex-col gap-6", mode === "canvas" ? "max-w-5xl" : "max-w-3xl")}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold tracking-[0.2px] text-violet-700 dark:text-violet-400">
              Step {metrics.stepIndex + 1} of 5
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">AI Discovery & TDD Canvas</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-4 text-[13px]">
            <span className="font-medium text-foreground">
              Round {round} of {HARD_ROUND_CAP}
            </span>
            <span className="truncate text-muted-foreground">
              {mode === "canvas" ? "TDD Canvas Editor" : `${metrics.coverage}% covered`}
            </span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-violet-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
