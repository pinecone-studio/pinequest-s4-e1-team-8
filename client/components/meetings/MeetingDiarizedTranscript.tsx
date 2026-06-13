import type { MeetingTranscriptSegment } from "@/app/meeting";

type MeetingDiarizedTranscriptProps = {
  segments: MeetingTranscriptSegment[];
};

const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
};

export const MeetingDiarizedTranscript = ({
  segments,
}: MeetingDiarizedTranscriptProps) => {
  if (segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No diarized transcript available yet
      </p>
    );
  }

  const startTime = new Date(segments[0].timestamp).getTime();

  return (
    <ol className="flex flex-col gap-4">
      {segments.map((segment) => (
        <li key={segment.id} className="flex gap-3">
          <span className="w-14 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {formatElapsed(new Date(segment.timestamp).getTime() - startTime)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {segment.speakerName}
            </p>
            <p className="text-sm leading-6 text-foreground/80">{segment.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};
