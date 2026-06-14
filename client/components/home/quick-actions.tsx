"use client";

import { parseRoomCodeInput } from "@/app/meeting/utils/parse-room-code";
import { slugifyRoomName } from "@/app/meeting/utils/slugify-room-name";
import {
  TRANSCRIPT_LANGUAGE_LABELS,
  type TranscriptLanguage,
} from "@/app/meeting/utils/transcript-language";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  KeyRoundIcon,
  LanguagesIcon,
  Radio,
  UploadIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ActionTab = "meeting" | "recording" | "join" | "upload";

const TABS: { id: ActionTab; label: string; icon: LucideIcon }[] = [
  { id: "meeting", label: "New meeting", icon: VideoIcon },
  { id: "recording", label: "Instant recording", icon: Radio },
  { id: "join", label: "Join with code", icon: KeyRoundIcon },
  { id: "upload", label: "Upload recording", icon: UploadIcon },
];

const TRANSCRIPT_LANGUAGES = (
  Object.entries(TRANSCRIPT_LANGUAGE_LABELS) as [TranscriptLanguage, string][]
).map(([value, label]) => ({ value, label }));

type QuickActionsProps = {
  variant?: "compact" | "hero";
};

export function QuickActions({ variant = "compact" }: QuickActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActionTab>("meeting");
  const [meetingName, setMeetingName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [transcriptLanguage, setTranscriptLanguage] =
    useState<TranscriptLanguage>("en");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(false);

  const handleStartCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = meetingName.trim();
    const roomName = trimmedName || "Instant Meeting";
    const meetingId = trimmedName
      ? slugifyRoomName(trimmedName) || `instant-${Date.now()}`
      : `instant-${Date.now()}`;

    const params = new URLSearchParams({
      meetingId,
      roomName,
      lang: transcriptLanguage,
    });

    if (activeTab === "recording") params.set("autoRecord", "1");

    if (inviteEmails.trim()) {
      toast.add({
        title: "Invites aren't available yet",
        description: "We'll email your teammates once meeting invites ship.",
        type: "info",
      });
    }

    router.push(`/meeting?${params.toString()}`);
  };

  const handleJoinWithCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = parseRoomCodeInput(joinCode);

    if (!parsed) {
      setJoinError(true);
      return;
    }

    setJoinError(false);

    const params = new URLSearchParams({
      meetingId: parsed.meetingId,
      roomName: parsed.roomName,
    });

    router.push(`/meeting?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full bg-muted/70 p-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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

      <div
        className={cn(
          "rounded-2xl bg-card p-4 ring-1 ring-foreground/10",
          variant === "hero" && "p-5",
        )}
      >
        {activeTab === "meeting" || activeTab === "recording" ? (
          <form
            onSubmit={handleStartCapture}
            className="flex flex-col gap-3 lg:flex-row lg:items-center"
          >
            <Input
              value={meetingName}
              onChange={(event) => setMeetingName(event.target.value)}
              placeholder="Name your meeting"
              className="h-10 flex-[1.4] rounded-xl bg-transparent px-3.5 focus-visible:ring-primary/50"
            />
            <Input
              value={inviteEmails}
              onChange={(event) => setInviteEmails(event.target.value)}
              placeholder="Invite teammates by email (optional)"
              className="h-10 flex-1 rounded-xl bg-transparent px-3.5 focus-visible:ring-primary/50"
            />
            <Select
              value={transcriptLanguage}
              onValueChange={(value) => {
                if (value) setTranscriptLanguage(value);
              }}
              items={TRANSCRIPT_LANGUAGES}
            >
              <SelectTrigger className="h-10 w-full shrink-0 rounded-xl bg-muted/50 px-3.5 lg:w-44">
                <LanguagesIcon className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSCRIPT_LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="h-10 gap-2 rounded-xl bg-primary px-5 text-sm text-primary-foreground hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {activeTab === "recording" ? (
                <Radio className="size-4" />
              ) : (
                <VideoIcon className="size-4" />
              )}
              Start capturing
            </Button>
          </form>
        ) : null}

        {activeTab === "join" ? (
          <form onSubmit={handleJoinWithCode} className="flex w-full items-center gap-2">
            <Input
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value);
                setJoinError(false);
              }}
              placeholder="Room code or meeting link"
              className="h-10 flex-1 rounded-xl bg-transparent px-3.5 focus-visible:ring-primary/50"
              aria-invalid={joinError}
            />
            <Button
              type="submit"
              size="icon-lg"
              disabled={!joinCode.trim()}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <ArrowRightIcon className="size-4" />
            </Button>
          </form>
        ) : null}

        {activeTab === "join" && joinError ? (
          <p className="mt-2 text-sm text-destructive">
            Enter a valid room code or meeting link.
          </p>
        ) : null}

        {activeTab === "upload" ? <UploadDropzone /> : null}
      </div>
    </div>
  );
}
