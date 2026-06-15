import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type LobbyCanvasProps = {
  children: ReactNode;
  className?: string;
};

export function LobbyCanvas({ children, className }: LobbyCanvasProps) {
  return (
    <div
      className={cn(
        "relative flex h-screen items-center justify-center overflow-hidden bg-slate-50/40 p-6 md:p-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-purple-200/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-purple-200/20 blur-[120px]" />
      <div className="pointer-events-none absolute -top-32 right-0 size-[32rem] rounded-full bg-purple-200/10 blur-[140px]" />

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
