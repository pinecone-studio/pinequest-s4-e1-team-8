"use client";

import { fetchMeetings, type MeetingListItem } from "@/app/meeting";
import { EmptyState } from "@/components/home/empty-state";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { ScheduleSidebar } from "@/components/home/schedule-sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto bg-zinc-50/50 p-4 lg:p-6 dark:bg-background">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-zinc-50/50 dark:bg-background">
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-4 lg:p-6 xl:w-[72%]">
        <AnimatePresence mode="wait">
          {meetings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <HomeDashboard meetings={meetings} todayLabel={todayLabel} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScheduleSidebar />
    </div>
  );
}
