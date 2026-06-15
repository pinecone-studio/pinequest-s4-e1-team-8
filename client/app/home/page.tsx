"use client";

import { fetchMeetings, type MeetingListItem } from "@/app/meeting";
import { EmptyState } from "@/components/home/empty-state";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { ScheduleSidebar } from "@/components/home/schedule-sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

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

  useEffect(() => {
    if (searchParams.get("google_connected") || searchParams.get("google_error")) {
      router.replace("/home");
    }
  }, [router, searchParams]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 right-0 size-112 rounded-full bg-lavender/40 blur-[120px] dark:bg-lavender/10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />

      {isLoading ? (
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 lg:px-8 lg:py-6">
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
      ) : (
        <>
          <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden px-6 py-4 lg:w-[70%] lg:px-8 lg:py-6">
            <AnimatePresence mode="wait">
              {meetings.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none"
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
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <HomeDashboard meetings={meetings} todayLabel={todayLabel} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ScheduleSidebar />
        </>
      )}
    </div>
  );
}
