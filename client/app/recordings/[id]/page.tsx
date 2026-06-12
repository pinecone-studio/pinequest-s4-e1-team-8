import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingActionItems } from "@/components/recordings/recording-action-items";
import { RecordingTranscript } from "@/components/recordings/recording-transcript";
import { getRecordingByIdSync } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { RecordingStatus } from "@/types";
import { AlertCircleIcon, ArrowLeftIcon, ListChecksIcon, Loader2Icon, RadioIcon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusStyles: Record<RecordingStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-sage text-sage-foreground" },
  processing: { label: "Processing", className: "bg-lavender text-lavender-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

type RecordingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordingDetailPage({ params }: RecordingDetailPageProps) {
  const { id } = await params;
  const recording = getRecordingByIdSync(id);

  if (!recording) {
    notFound();
  }

  const status = statusStyles[recording.status];
  const openItems = recording.actionItems.filter((item) => !item.done).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/recordings" />}>
        <ArrowLeftIcon />
        Back to recordings
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold text-foreground">{recording.title}</h1>
            <Badge className={cn(status.className)}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {recording.createdAt} · {recording.durationLabel}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              {recording.source === "live" ? <RadioIcon className="size-3" /> : <UploadIcon className="size-3" />}
              {recording.source === "live" ? "Live recording" : "Uploaded"}
            </Badge>
            {recording.team ? <Badge variant="outline">{recording.team}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      {recording.status === "ready" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-semibold text-foreground">AI summary</h2>
                <p className="text-sm leading-6 text-foreground">{recording.summary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4">
                <h2 className="font-heading text-base font-semibold text-foreground">Transcript</h2>
                <RecordingTranscript entries={recording.transcript} />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-semibold text-foreground">Action items</h2>
                  <Badge className="gap-1 bg-sage text-sage-foreground">
                    <ListChecksIcon className="size-3" />
                    {openItems} open
                  </Badge>
                </div>
                <RecordingActionItems items={recording.actionItems} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : recording.status === "processing" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2Icon className="size-6 animate-spin text-primary" />
            <div>
              <p className="font-medium text-foreground">Processing this recording</p>
              <p className="text-sm text-muted-foreground">
                Transcription and AI summary will appear here once it&apos;s ready.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircleIcon className="size-6 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Processing failed</p>
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t process this recording. Try uploading it again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
