"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";
import {
  fetchMeetingAnalysisDetails,
  type GetMeetingAnalysisDetailsResponse,
} from "@/app/meeting";

type MeetingDetailHeaderProps = {
  meetingId: string;
};

const formatMeetingDate = (value: string | null) => {
  if (!value) return null;

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const MeetingDetailHeader = ({ meetingId }: MeetingDetailHeaderProps) => {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="h-7 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (notFound || !details) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium text-foreground">Meeting not found</p>
          <p className="text-sm text-muted-foreground">
            This meeting doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/meetings" />}>
            <ArrowLeftIcon />
            Back to meetings
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { meeting, transcription } = details;
  const status = TRANSCRIPTION_STATUS_STYLES[transcription?.status ?? "none"];
  const createdDate = formatMeetingDate(meeting.createdAt);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{meeting.title}</h1>
          <Badge className={cn(status.className)}>{status.label}</Badge>
        </div>

        {createdDate ? <p className="text-sm text-muted-foreground">{createdDate}</p> : null}

        {transcription?.participantNames?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {transcription.participantNames.map((name) => (
              <Badge key={name} variant="outline">
                {name}
              </Badge>
            ))}
          </div>
        ) : null}

        {transcription?.roomName ? (
          <Button
            className="w-fit"
            render={
              <Link
                href={`/meeting?${new URLSearchParams({
                  meetingId: meeting.id,
                  roomName: transcription.roomName,
                }).toString()}`}
              />
            }
          >
            <VideoIcon />
            Rejoin room
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};
