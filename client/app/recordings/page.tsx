"use client";

import { RecordingCard } from "@/components/recordings/recording-card";
import { UploadRecordingDialog } from "@/components/recordings/upload-recording-dialog";
import { VoiceVerificationPanel } from "@/components/recordings/voice-verification-panel";
import { cn } from "@/lib/utils";
import { recordings as initialRecordings } from "@/lib/mock-data";
import type { Recording, RecordingStatus } from "@/types";
import { FolderOpenIcon } from "lucide-react";
import { MeetingListCard } from "@/components/meetings/meeting-list-card";
import { fetchMeetings, type MeetingListItem } from "@/app/meeting";
import { cn } from "@/lib/utils";

type FilterValue = "all" | "done" | "processing";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "done", label: "Ready" },
  { value: "processing", label: "Processing" },
];

export default function RecordingsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    let isActive = true;

    fetchMeetings()
      .then((response) => {
        if (isActive) setMeetings(response.meetings);
      })
      .catch(() => {})
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const recordings = meetings.filter(
    (meeting) => meeting.transcriptionStatus === "done" || meeting.transcriptionStatus === "processing",
  );

  const filteredRecordings =
    filter === "all" ? recordings : recordings.filter((meeting) => meeting.transcriptionStatus === filter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Recordings</h1>
        <p className="text-sm text-muted-foreground">
          Review AI summaries, action items, and transcripts from your meetings.
        </p>
      </div>

      <VoiceVerificationPanel />

      <div className="inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "inline-flex h-8 min-w-20 items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
              filter === item.value
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredRecordings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecordings.map((meeting) => (
            <MeetingListCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderOpenIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No recordings here</p>
            <p className="text-sm text-muted-foreground">
              {recordings.length === 0
                ? "Recordings appear here once a meeting finishes processing."
                : "Try a different filter."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
