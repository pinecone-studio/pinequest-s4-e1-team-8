"use client";

import { useEffect, useState } from "react";
import { AlertCircleIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchMeetingAnalysisDetails,
  type GetMeetingAnalysisDetailsResponse,
} from "@/app/meeting";
import { useTranscriptionStatus } from "@/app/meeting/hooks/use-transcription-status";
import { ActionItemsChecklist } from "./ActionItemsChecklist";
import { MeetingDiarizedTranscript } from "./MeetingDiarizedTranscript";

type MeetingAnalysisPanelProps = {
  meetingId: string;
};

const EmptyState = ({ message }: { message: string }) => (
  <Card>
    <CardContent className="py-8 text-center text-sm text-muted-foreground">
      {message}
    </CardContent>
  </Card>
);

const AnalysisSkeleton = () => (
  <Card>
    <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
      <Loader2Icon className="size-6 animate-spin text-primary" />
      <div>
        <p className="font-medium text-foreground">
          Transcribing and analyzing this meeting
        </p>
        <p className="text-sm text-muted-foreground">
          Action items and the diarized transcript will appear here once it&apos;s ready.
        </p>
      </div>
      <div className="grid w-full max-w-md gap-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
      </div>
    </CardContent>
  </Card>
);

export const MeetingAnalysisPanel = ({ meetingId }: MeetingAnalysisPanelProps) => {
  const [details, setDetails] = useState<GetMeetingAnalysisDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setHasError(false);

    fetchMeetingAnalysisDetails(meetingId)
      .then((response) => {
        if (isActive) setDetails(response);
      })
      .catch(() => {
        if (isActive) setHasError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [meetingId]);

  const { status, transcription } = useTranscriptionStatus(details?.transcription?.id);

  useEffect(() => {
    if (status !== "done" && status !== "failed") return;
    if (!details || details.transcriptSegments.length > 0) return;

    fetchMeetingAnalysisDetails(meetingId)
      .then(setDetails)
      .catch(() => {});
  }, [status, details, meetingId]);

  if (isLoading) {
    return <AnalysisSkeleton />;
  }

  if (hasError || !details) {
    return <EmptyState message="AI analysis isn't available for this meeting yet." />;
  }

  if (!details.transcription) {
    return <EmptyState message="No recording has been processed for this meeting yet." />;
  }

  const currentStatus = status ?? details.transcription.status;

  if (currentStatus === "pending" || currentStatus === "processing") {
    return <AnalysisSkeleton />;
  }

  if (currentStatus === "failed") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircleIcon className="size-6 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Transcription failed</p>
            <p className="text-sm text-muted-foreground">
              {transcription?.errorMessage ??
                details.transcription.errorMessage ??
                "Something went wrong while processing this recording."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Action items
            </h2>
          </div>
          <ActionItemsChecklist items={details.summary?.actionItems ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Diarized transcript
          </h2>
          <MeetingDiarizedTranscript segments={details.transcriptSegments} />
        </CardContent>
      </Card>
    </div>
  );
};
