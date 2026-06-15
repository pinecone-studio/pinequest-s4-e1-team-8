import type { MeetingTranscriptSegment } from "@/app/meeting";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatClockTime } from "@/lib/meetings/meeting-clock";
import type { AppUser } from "@/types";

type MeetingTranscriptFeedProps = {
  segments: MeetingTranscriptSegment[];
  participants: AppUser[];
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const MeetingTranscriptFeed = ({ segments, participants }: MeetingTranscriptFeedProps) => {
  if (segments.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No transcript yet</p>
        <p className="text-sm text-muted-foreground">
          The transcript will appear here once this meeting has been processed.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {segments.map((segment) => {
        const participant = participants.find(
          (user) => user.name.toLowerCase() === segment.speakerName.toLowerCase(),
        );

        return (
          <li key={segment.id} className="flex items-start gap-3">
            <Avatar size="sm" className="mt-0.5">
              {participant?.avatarUrl ? (
                <AvatarImage src={participant.avatarUrl} alt={segment.speakerName} />
              ) : null}
              <AvatarFallback>{participant?.initials ?? getInitials(segment.speakerName)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">{segment.speakerName}</span>
                <span className="text-xs text-muted-foreground">{formatClockTime(segment.timestamp)}</span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{segment.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
