"use client";

import {
  fetchMeetingAnalysisDetails,
  type GetMeetingAnalysisDetailsResponse,
  type MeetingListItem,
} from "@/app/meeting";
import { useTranscriptionStatus } from "@/app/meeting/hooks/use-transcription-status";
import { parseMeetingSummary } from "@/app/meeting/utils/parse-meeting-summary";
import { Button } from "@/components/ui/button";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import { getMeetingParticipants } from "@/lib/meetings/meeting-participants";
import { getMeetingSentiment } from "@/lib/meetings/meeting-sentiment";
import { getSpeakerTalkTimeStats } from "@/lib/meetings/meeting-speaker-stats";
import { getMeetingTopics } from "@/lib/meetings/meeting-topics";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MeetingAiCompanion } from "./meeting-ai-companion";
import { MeetingContentTabs } from "./meeting-content-tabs";
import { MeetingDetailTopbar } from "./meeting-detail-topbar";
import { MeetingInsightsSidebar } from "./meeting-insights-sidebar";
import { MeetingReplayPlayer } from "./meeting-replay-player";

type MeetingDetailViewProps = {
  meetingId: string;
};

const MeetingDetailSkeleton = () => (
  <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-6 overflow-hidden p-6">
    <div className="h-9 w-1/3 animate-pulse rounded-full bg-muted" />
    <div className="flex min-h-0 flex-1 gap-4">
      <div className="hidden w-72 shrink-0 animate-pulse rounded-2xl bg-muted lg:block" />
      <div className="flex-1 animate-pulse rounded-2xl bg-muted" />
      <div className="hidden w-80 shrink-0 animate-pulse rounded-2xl bg-muted xl:block" />
    </div>
  </div>
);

const MeetingDetailNotFound = () => (
  <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
    <p className="font-medium text-foreground">Meeting not found</p>
    <p className="text-sm text-muted-foreground">
      This meeting doesn&apos;t exist or you don&apos;t have access to it.
    </p>
    <Button variant="outline" size="sm" render={<Link href="/meetings" />}>
      <ArrowLeftIcon />
      Back to meetings
    </Button>
  </div>
);

export const MeetingDetailView = ({ meetingId }: MeetingDetailViewProps) => {
  const [details, setDetails] = useState<GetMeetingAnalysisDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setNotFound(false);

    fetchMeetingAnalysisDetails(meetingId)
      .then((response) => {
        if (isActive) setDetails(response);
      })
      .catch(() => {
        if (isActive) setNotFound(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [meetingId]);

  const { status, transcription: liveTranscription } = useTranscriptionStatus(details?.transcription?.id);

  useEffect(() => {
    if (status !== "done" && status !== "failed") return;
    if (!details || details.transcriptSegments.length > 0) return;

    fetchMeetingAnalysisDetails(meetingId)
      .then(setDetails)
      .catch(() => {});
  }, [status, details, meetingId]);

  if (isLoading) return <MeetingDetailSkeleton />;
  if (notFound || !details) return <MeetingDetailNotFound />;

  const transcription = liveTranscription ?? details.transcription;

  const meetingListItem: MeetingListItem = {
    id: details.meeting.id,
    title: details.meeting.title,
    createdAt: details.meeting.createdAt,
    updatedAt: details.meeting.updatedAt,
    transcriptionStatus: transcription?.status ?? null,
    summaryPreview: details.summary?.content ?? null,
  };

  const participants = getMeetingParticipants(meetingListItem);
  const sentiment = getMeetingSentiment(meetingListItem);
  const speakerStats = getSpeakerTalkTimeStats(meetingListItem, details.transcriptSegments);
  const summaryContent = parseMeetingSummary(transcription?.summary);
  const topics = getMeetingTopics(meetingListItem, summaryContent);
  const durationLabel = getMeetingDurationLabel(meetingListItem);
  const createdDate = formatMeetingDateLong(meetingListItem.createdAt) || null;
  const keyPoints = summaryContent?.keyDecisions ?? details.summary?.keyPoints ?? [];
  const actionItems = summaryContent?.actionItems ?? details.summary?.actionItems ?? [];

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 right-0 size-112 rounded-full bg-lavender/40 blur-[120px] dark:bg-lavender/10" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 size-96 rounded-full bg-primary/10 blur-[120px]" />

      <MeetingDetailTopbar
        meetingId={meetingListItem.id}
        title={meetingListItem.title}
        createdDate={createdDate}
        durationLabel={durationLabel}
        transcript={transcription?.transcript ?? null}
        audioUrl={transcription?.audioUrl ?? null}
        roomName={transcription?.roomName ?? null}
      />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 overflow-y-auto px-4 py-4 scrollbar-none lg:block">
          <MeetingInsightsSidebar sentiment={sentiment} speakerStats={speakerStats} topics={topics} />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 scrollbar-none">
          <MeetingReplayPlayer participants={participants} audioUrl={transcription?.audioUrl ?? null} />
          <MeetingContentTabs
            segments={details.transcriptSegments}
            participants={participants}
            summaryText={details.summary?.content ?? null}
            keyPoints={keyPoints}
            actionItems={actionItems}
            topics={topics}
          />
        </main>

        <aside className="hidden w-80 shrink-0 flex-col border-l border-zinc-100 bg-white/50 p-4 dark:border-white/5 dark:bg-card/40 xl:flex">
          <MeetingAiCompanion
            context={{
              meetingTitle: meetingListItem.title,
              keyPoints,
              actionItems,
              topics,
              speakerStats,
            }}
          />
        </aside>
      </div>
    </div>
  );
};
