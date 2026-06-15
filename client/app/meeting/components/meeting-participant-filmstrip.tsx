"use client";

import type { Participant } from "livekit-client";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ParticipantTile } from "./participant-tile";

type MeetingParticipantFilmstripProps = {
  focusedIdentity: string | null;
  getParticipantLabel: (participant: Participant) => string;
  onSelectParticipant: (identity: string) => void;
  participants: Participant[];
};

export const MeetingParticipantFilmstrip = ({
  focusedIdentity,
  getParticipantLabel,
  onSelectParticipant,
  participants,
}: MeetingParticipantFilmstripProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (!participants.length) return null;

  const handleScrollNext = () => {
    const container = scrollRef.current;
    if (!container) return;

    const atEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 8;

    container.scrollTo({
      behavior: "smooth",
      left: atEnd ? 0 : container.scrollLeft + container.clientWidth,
    });
  };

  return (
    <div className="relative mt-4 flex h-32 w-full items-center gap-3">
      <div
        className="flex h-full min-w-0 flex-1 gap-3 overflow-x-auto scroll-smooth scrollbar-none"
        ref={scrollRef}
      >
        {participants.map((participant) => (
          <ParticipantTile
            className="aspect-auto h-full min-h-0 min-w-[200px] flex-1 shrink-0 rounded-2xl border-zinc-800 bg-zinc-800"
            isFocused={focusedIdentity === participant.identity}
            key={`${participant.identity}-filmstrip`}
            label={getParticipantLabel(participant)}
            onClick={() => onSelectParticipant(participant.identity)}
            participant={participant}
            variant="compact"
          />
        ))}
      </div>
      <button
        aria-label="Show more participants"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-900"
        onClick={handleScrollNext}
        type="button"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
};
