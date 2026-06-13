import type { MeetingListItem } from "@/app/meeting";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMeetingDate } from "@/lib/meetings/format-meeting-date";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import { motion } from "framer-motion";
import Link from "next/link";

type ActivityFeedCardProps = {
  meeting: MeetingListItem;
  participants?: AppUser[];
};

export function ActivityFeedCard({ meeting, participants }: ActivityFeedCardProps) {
  const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];

  return (
    <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
      <Link href={`/meetings/${meeting.id}`}>
        <Card className="ring-1 ring-white/10 transition-colors hover:ring-primary/30">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-heading text-base font-semibold text-foreground">
                  {meeting.title}
                </h3>
                <p className="text-sm text-muted-foreground">{formatMeetingDate(meeting.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {participants?.length ? (
                  <AvatarStack users={participants} size="sm" max={3} />
                ) : null}
                <Badge className={cn(status.className)}>{status.label}</Badge>
              </div>
            </div>

            {meeting.summaryPreview ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.summaryPreview}</p>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
