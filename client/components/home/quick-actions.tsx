"use client";

import { parseRoomCodeInput } from "@/app/meeting/utils/parse-room-code";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  KeyRoundIcon,
  Radio,
  UploadIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const createInstantRoom = () => ({
  meetingId: `instant-${Date.now()}`,
  roomName: "Instant Meeting",
});

const buildMeetingHref = (
  room: { meetingId: string; roomName: string },
  autoRecord = false,
) => {
  const params = new URLSearchParams({
    meetingId: room.meetingId,
    roomName: room.roomName,
  });

  if (autoRecord) params.set("autoRecord", "1");

  return `/meeting?${params.toString()}`;
};

type ActionTab = "meeting" | "join" | "recording" | "upload";

const TABS: { id: ActionTab; label: string; icon: LucideIcon }[] = [
  { id: "meeting", label: "New meeting", icon: VideoIcon },
  { id: "join", label: "Join with code", icon: KeyRoundIcon },
  { id: "recording", label: "Instant recording", icon: Radio },
  { id: "upload", label: "Upload files", icon: UploadIcon },
];

type QuickActionsProps = {
  variant?: "compact" | "hero";
};

export function QuickActions({ variant = "compact" }: QuickActionsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActionTab>("meeting");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(false);

  const handleStartInstantMeeting = () => {
    router.push(buildMeetingHref(createInstantRoom()));
  };

  const handleStartInstantRecording = () => {
    router.push(buildMeetingHref(createInstantRoom(), true));
  };

  const handleJoinWithCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseRoomCodeInput(joinCode);

    if (!parsed) {
      setJoinError(true);
      return;
    }

    setJoinError(false);
    router.push(buildMeetingHref(parsed));
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10",
        variant === "hero" && "p-5",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "meeting" ? (
          <Button
            onClick={handleStartInstantMeeting}
            className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <VideoIcon className="size-4" />
            Start instant meeting
          </Button>
        ) : null}

        {activeTab === "recording" ? (
          <Button
            onClick={handleStartInstantRecording}
            className="gap-2 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Radio className="size-4" />
            Start instant recording
          </Button>
        ) : null}
      </div>

      {activeTab === "meeting" ? (
        <p className="text-sm text-muted-foreground">
          Create a room and jump in right away — share the link with your team
          once you&apos;re in.
        </p>
      ) : null}

      {activeTab === "recording" ? (
        <p className="text-sm text-muted-foreground">
          Capture audio from your microphone and get a transcript and AI summary
          automatically.
        </p>
      ) : null}

      {activeTab === "join" ? (
        <form
          onSubmit={handleJoinWithCode}
          className="flex w-full items-center gap-2"
        >
          <Input
            value={joinCode}
            onChange={(event) => {
              setJoinCode(event.target.value);
              setJoinError(false);
            }}
            placeholder="Room code or meeting link"
            className="h-11 flex-1 rounded-full bg-inset focus-visible:ring-primary/50"
            aria-invalid={joinError}
          />
          <Button
            type="submit"
            size="icon-lg"
            disabled={!joinCode.trim()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>
      ) : null}

      {activeTab === "join" && joinError ? (
        <p className="text-sm text-destructive">
          Enter a valid room code or meeting link.
        </p>
      ) : null}

      {activeTab === "upload" ? <UploadDropzone /> : null}
    </div>
  );
}
