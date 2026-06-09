import { cn } from "@/lib/utils";

const STEPS = ["Project Setup", "Invite Team", "Integrations", "AI Tasks"];

interface StepHeaderProps {
  step: number;
}

export function StepHeader({ step }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="whitespace-nowrap text-[13px] font-semibold tracking-[0.2px] text-violet-700 dark:text-violet-400">
          STEP {step + 1} OF 4
        </span>
        <span className="text-[13px] text-foreground">{STEPS[step]}</span>
      </div>
      <div className="flex gap-[7px]">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i <= step ? "bg-violet-600" : "bg-border dark:bg-[#2e2e33]",
            )}
          />
        ))}
      </div>
    </div>
  );
}
