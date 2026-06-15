import type { MeetingTranscriptSegment } from "@/app/meeting";
import { formatElapsedTime } from "@/lib/meetings/meeting-clock";

type MeetingTopicPanelProps = {
  topics: string[];
  segments: MeetingTranscriptSegment[];
};

export const MeetingTopicPanel = ({ topics, segments }: MeetingTopicPanelProps) => {
  if (topics.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No topics detected</p>
        <p className="text-sm text-muted-foreground">
          Topics will appear here once this meeting has been analyzed.
        </p>
      </div>
    );
  }

  const startTime = segments.length > 0 ? new Date(segments[0].timestamp).getTime() : null;
  const endTime = segments.length > 0 ? new Date(segments[segments.length - 1].timestamp).getTime() : null;
  const totalDuration = startTime !== null && endTime !== null ? Math.max(endTime - startTime, 0) : null;

  return (
    <ol className="flex flex-col gap-3">
      {topics.map((topic, index) => {
        const elapsed =
          totalDuration !== null ? (totalDuration / topics.length) * index : index * 5 * 60 * 1000;

        return (
          <li
            key={topic}
            className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-inset ring-foreground/5 transition-all duration-200 hover:ring-foreground/10"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{topic}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatElapsedTime(elapsed)}</span>
          </li>
        );
      })}
    </ol>
  );
};
