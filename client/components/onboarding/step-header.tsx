const STEPS = ["Project Setup", "Invite Team", "Integrations", "AI Tasks"];

interface StepHeaderProps {
  step: number;
}

export function StepHeader({ step }: StepHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[13px] font-semibold tracking-[0.2px] text-[#6366F1] whitespace-nowrap">
          STEP {step + 1} OF 4
        </span>
        <span className="text-[13px] text-[#64748B]">{STEPS[step]}</span>
      </div>
      <div className="flex gap-[7px]">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors duration-300"
            style={{ background: i <= step ? "#6366F1" : "#E4E5E9" }}
          />
        ))}
      </div>
    </div>
  );
}
