"use client";

import { cn } from "@/lib/utils";
import { ChevronRight, Mic, MicOff } from "lucide-react";
import { useRef } from "react";
import type { CallParticipant } from "../types";

type ParticipantFilmstripProps = {
  onSelectParticipant: (id: string) => void;
  participants: CallParticipant[];
};

export const ParticipantFilmstrip = ({
  onSelectParticipant,
  participants,
}: ParticipantFilmstripProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollNext = () => {
    const container = scrollRef.current;
    if (!container) return;

    const atEnd =
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - 8;

    container.scrollTo({
      behavior: "smooth",
      left: atEnd ? 0 : container.scrollLeft + container.clientWidth,
    });
  };

  return (
    <div className="relative flex h-36 w-full items-center gap-3">
      <div
        className="flex h-full min-w-0 flex-1 gap-3 overflow-x-auto scroll-smooth scrollbar-none"
        ref={scrollRef}
      >
        {participants.map((participant) => (
          <button
            className="group relative h-full min-w-[200px] flex-1 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            key={participant.id}
            onClick={() => onSelectParticipant(participant.id)}
            type="button"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 transition group-hover:opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold text-white",
                  participant.avatarGradient,
                )}
              >
                {participant.initial}
              </div>
            </div>
            <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {participant.isSelf ? "You" : participant.name}
            </span>
            <span
              className={cn(
                "absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full bg-black/40 backdrop-blur",
                participant.isMicOn ? "text-emerald-400" : "text-red-400",
              )}
            >
              {participant.isMicOn ? (
                <Mic className="size-3.5" />
              ) : (
                <MicOff className="size-3.5" />
              )}
            </span>
          </button>
        ))}
      </div>
      <button
        aria-label="Show more participants"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
        onClick={handleScrollNext}
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
};
