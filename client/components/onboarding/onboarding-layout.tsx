"use client";

import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OnboardingBackContextValue = {
  registerBackHandler: (handler: (() => void) | null) => void;
};

const OnboardingBackContext = createContext<OnboardingBackContextValue | null>(
  null,
);

export function useOnboardingBackRegistration() {
  const context = useContext(OnboardingBackContext);
  if (!context) {
    throw new Error(
      "useOnboardingBackRegistration must be used within OnboardingShell",
    );
  }
  return context;
}

export function OnboardingBackButton({
  onClick,
  label = "Back",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}

export const ONBOARDING_TOTAL_STEPS = 5;

export const onboardingInputClassName =
  "w-full rounded-full border border-border bg-muted/50 px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-[#7c3aed]/60 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20";

export const onboardingTextareaClassName =
  "w-full resize-none rounded-2xl border border-border bg-muted/50 px-5 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-[#7c3aed]/60 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20";

export const onboardingSelectClassName =
  "h-11 rounded-full border border-border bg-muted/50 px-4 text-sm text-foreground focus:border-[#7c3aed]/60 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20";

export const onboardingPrimaryButtonClassName =
  "inline-flex h-12 min-w-[200px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-45";

export const onboardingPanelClassName =
  "rounded-2xl border border-border bg-card p-5 shadow-sm";

export const onboardingAccentColor = "#7c3aed";

export const onboardingAccentTextClassName = "text-[#7c3aed]";

export const onboardingAccentBgClassName = "bg-[#7c3aed]";

export const onboardingAccentIconClassName = "bg-[#7c3aed]/15 text-[#7c3aed]";

export const onboardingAccentBorderHoverClassName =
  "hover:border-[#7c3aed]/50 focus-visible:border-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/25";

export const onboardingAccentChipClassName =
  "rounded-full border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-3 py-1 text-[12px] font-medium text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/20 disabled:cursor-not-allowed disabled:opacity-50";

export function OnboardingChoiceCard({
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  className,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[168px] flex-col rounded-2xl bg-card p-5 text-left shadow-sm transition-[border-color,box-shadow] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
        onboardingAccentBorderHoverClassName,
        "hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 grid size-10 place-items-center rounded-xl",
          onboardingAccentIconClassName,
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

type OnboardingShellProps = {
  step: number;
  totalSteps?: number;
  children: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  maxWidth?: "md" | "lg" | "xl" | "full";
  fillHeight?: boolean;
  className?: string;
  contentClassName?: string;
};

const maxWidthClass = {
  md: "max-w-[520px]",
  lg: "max-w-[640px]",
  xl: "max-w-[760px]",
  full: "max-w-none",
} as const;

export function OnboardingShell({
  step,
  totalSteps = ONBOARDING_TOTAL_STEPS,
  children,
  onBack,
  showBack = true,
  maxWidth = "md",
  fillHeight = false,
  className,
  contentClassName,
}: OnboardingShellProps) {
  const progress = Math.min(100, ((step + 1) / totalSteps) * 100);
  const [stepBackHandler, setStepBackHandler] = useState<(() => void) | null>(
    null,
  );

  const registerBackHandler = useCallback((handler: (() => void) | null) => {
    setStepBackHandler(() => handler);
  }, []);

  const backContextValue = useMemo(
    () => ({ registerBackHandler }),
    [registerBackHandler],
  );

  const canGoBack = showBack && step > 0 && (stepBackHandler ?? onBack);
  const handleBack = () => {
    if (stepBackHandler) {
      stepBackHandler();
      return;
    }
    onBack?.();
  };

  return (
    <OnboardingBackContext.Provider value={backContextValue}>
      <div
        className={cn(
          "relative flex h-dvh flex-col bg-background pb-16 text-foreground",
          className,
        )}
      >
        <header className="shrink-0 px-6 pt-5 md:px-10">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-lg bg-[#7c3aed] text-sm font-bold text-white">
                B
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Brisk
              </span>
            </div>
            <div className="w-[148px]">
              <AuthThemeToggle />
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <main
          className={cn(
            "flex flex-1 flex-col items-center px-6 py-8 md:px-10 md:py-10",
            fillHeight && "min-h-0",
            contentClassName,
          )}
        >
          <div
            className={cn(
              "w-full",
              maxWidthClass[maxWidth],
              fillHeight && "flex min-h-0 flex-1 flex-col",
            )}
          >
            {children}
          </div>
        </main>

        <footer className="pointer-events-none fixed bottom-6 left-6 z-20 md:bottom-8 md:left-10">
          {canGoBack ? (
            <div className="pointer-events-auto">
              <OnboardingBackButton onClick={handleBack} />
            </div>
          ) : null}
        </footer>
      </div>
    </OnboardingBackContext.Provider>
  );
}

type OnboardingStepHeadingProps = {
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
};

export function OnboardingStepHeading({
  title,
  description,
  align = "center",
  className,
}: OnboardingStepHeadingProps) {
  return (
    <div
      className={cn(
        "mb-8",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-foreground md:text-[2rem]">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

type OnboardingContinueButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export function OnboardingContinueButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className,
}: OnboardingContinueButtonProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <button
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={onboardingPrimaryButtonClassName}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {children}
      </button>
    </div>
  );
}

type OnboardingStepActionsProps = {
  onContinue?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  skipLabel?: string;
  continueDisabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
};

export function OnboardingStepActions({
  onContinue,
  onSkip,
  continueLabel = "Continue",
  skipLabel = "Skip",
  continueDisabled = false,
  loading = false,
  type = "button",
  className,
}: OnboardingStepActionsProps) {
  return (
    <div className={cn("mt-10 space-y-4", className)}>
      <OnboardingContinueButton
        type={type}
        onClick={onContinue}
        disabled={continueDisabled}
        loading={loading}
      >
        {continueLabel}
      </OnboardingContinueButton>
      {onSkip ? (
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {skipLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
