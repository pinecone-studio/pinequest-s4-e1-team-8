import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Recording, RecordingStatus } from "@/types";
import { ArrowRightIcon, ListChecksIcon, Loader2Icon, RadioIcon, UploadIcon } from "lucide-react";
import Link from "next/link";

const statusStyles: Record<RecordingStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-sage text-sage-foreground" },
  processing: { label: "Processing", className: "bg-lavender text-lavender-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

export function RecordingCard({ recording }: { recording: Recording }) {
  const status = statusStyles[recording.status];
  const openItems = recording.actionItems.filter((item) => !item.done).length;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-heading text-base font-semibold text-foreground">{recording.title}</h3>
              <Badge className={cn("shrink-0", status.className)}>
                {recording.status === "processing" ? <Loader2Icon className="animate-spin" /> : null}
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {recording.createdAt} · {recording.durationLabel}
            </p>
          </div>
        </div>

        {recording.status === "ready" ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{recording.summary}</p>
        ) : recording.status === "processing" ? (
          <p className="text-sm text-muted-foreground">
            Your recording is being processed — this can take a few minutes.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Processing failed. Try uploading this recording again.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {recording.source === "live" ? <RadioIcon className="size-3" /> : <UploadIcon className="size-3" />}
            {recording.source === "live" ? "Live recording" : "Uploaded"}
          </Badge>
          {recording.team ? <Badge variant="outline">{recording.team}</Badge> : null}
          {recording.status === "ready" && openItems > 0 ? (
            <Badge variant="outline" className="gap-1">
              <ListChecksIcon className="size-3" />
              {openItems} open
            </Badge>
          ) : null}
        </div>

        {recording.status === "ready" ? (
          <div className="mt-auto flex items-center justify-end pt-2">
            <Button variant="outline" size="sm" render={<Link href={`/recordings/${recording.id}`} />}>
              View details
              <ArrowRightIcon />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
