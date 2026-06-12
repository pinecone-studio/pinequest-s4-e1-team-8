"use client";

import { RecordingCard } from "@/components/recordings/recording-card";
import { UploadRecordingDialog } from "@/components/recordings/upload-recording-dialog";
import { VoiceVerificationPanel } from "@/components/recordings/voice-verification-panel";
import { cn } from "@/lib/utils";
import { recordings as initialRecordings } from "@/lib/mock-data";
import type { Recording, RecordingStatus } from "@/types";
import { FolderOpenIcon } from "lucide-react";
import { useState } from "react";

const FILTERS: { value: RecordingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>(initialRecordings);
  const [filter, setFilter] = useState<RecordingStatus | "all">("all");

  const filteredRecordings =
    filter === "all" ? recordings : recordings.filter((recording) => recording.status === filter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Recordings</h1>
          <p className="text-sm text-muted-foreground">
            Review AI summaries, action items, and transcripts from your meetings.
          </p>
        </div>
        <UploadRecordingDialog
          onUploaded={(recording) => setRecordings((current) => [recording, ...current])}
        />
      </div>

      <VoiceVerificationPanel />

      <div className="inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "h-8 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
              filter === item.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredRecordings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRecordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <FolderOpenIcon className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">No recordings here</p>
            <p className="text-sm text-muted-foreground">Try a different filter or upload a recording.</p>
          </div>
        </div>
      )}
    </div>
  );
}
