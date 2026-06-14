import type { MeetingListItem } from "@/app/meeting";
import { ActivityCard } from "@/components/home/activity-card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

type RecentActivityFeedProps = {
  meetings: MeetingListItem[];
};

export function RecentActivityFeed({ meetings }: RecentActivityFeedProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Recent meetings
        </h2>
        <Button variant="ghost" size="sm" className="gap-1" render={<Link href="/meetings" />}>
          View all
          <ArrowRightIcon />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-none pb-1">
        <AnimatePresence initial={false}>
          {meetings.slice(0, 6).map((meeting, index) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ActivityCard meeting={meeting} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
