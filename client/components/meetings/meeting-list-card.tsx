import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";
import type { MeetingListItem } from "@/app/meeting";
import Link from "next/link";

const formatMeetingDate = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function MeetingListCard({ meeting }: { meeting: MeetingListItem }) {
  const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-foreground">{meeting.title}</h3>
              <Badge className={cn(status.className)}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{formatMeetingDate(meeting.createdAt)}</p>
          </div>
        </div>

        {meeting.summaryPreview ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.summaryPreview}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-end pt-2">
          <Button variant="outline" size="sm" render={<Link href={`/meetings/${meeting.id}`} />}>
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
