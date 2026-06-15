import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type CallControlButtonProps = {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

export const CallControlButton = ({
  active,
  icon: Icon,
  label,
  onClick,
}: CallControlButtonProps) => {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        active
          ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
          : "border-transparent bg-red-500 text-white hover:bg-red-600",
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="size-5" />
    </button>
  );
};
