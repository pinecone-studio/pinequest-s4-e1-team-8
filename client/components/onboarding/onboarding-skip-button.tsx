"use client";

import { cn } from "@/lib/utils";

type OnboardingSkipButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function OnboardingSkipButton({
  onClick,
  disabled = false,
  className,
  label = "Skip",
}: OnboardingSkipButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "px-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-violet-400",
        className,
      )}
    >
      {label}
    </button>
  );
}
