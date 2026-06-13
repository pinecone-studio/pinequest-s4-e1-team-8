"use client";

import { parseRoomCodeInput } from "@/app/meeting/utils/parse-room-code";
import { UploadDropzone } from "@/components/dashboard/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRightIcon, KeyRoundIcon, Radio, VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

const createInstantRoom = () => ({
  meetingId: `instant-${Date.now()}`,
  roomName: "Instant Meeting",
});

const buildMeetingHref = (room: { meetingId: string; roomName: string }, autoRecord = false) => {
  const params = new URLSearchParams({
    meetingId: room.meetingId,
    roomName: room.roomName,
  });

  if (autoRecord) params.set("autoRecord", "1");

  return `/meeting?${params.toString()}`;
};

const cardEntrance = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: index * 0.06 },
});

export function ActionHub() {
  const { user } = useUser();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState(false);

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Where should we start?";

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
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl"
      >
        <h1 className="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          {greeting}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Start a meeting, capture a recording, or hand Brisk a file to summarize.
        </p>
      </motion.div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <motion.div {...cardEntrance(0)}>
          <button type="button" onClick={handleStartInstantMeeting} className="block h-full w-full text-left">
            <Card className="h-full bg-primary ring-1 ring-primary/40 transition-transform hover:scale-[1.01]">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
                  <VideoIcon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-primary-foreground">Start Instant Meeting</p>
                  <p className="text-sm text-primary-foreground/80">Create a room and jump in right away.</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>

        <motion.div {...cardEntrance(1)}>
          <Card className="h-full bg-elevated ring-1 ring-white/10">
            <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                <KeyRoundIcon className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Join with Code</p>
                <p className="text-sm text-muted-foreground">Paste a meeting URL or room code.</p>
              </div>
              <form onSubmit={handleJoinWithCode} className="flex w-full max-w-sm items-center gap-2">
                <Input
                  value={joinCode}
                  onChange={(event) => {
                    setJoinCode(event.target.value);
                    setJoinError(false);
                  }}
                  placeholder="Room code or meeting link"
                  className="h-10 bg-inset"
                  aria-invalid={joinError}
                />
                <Button type="submit" size="icon-lg" disabled={!joinCode.trim()}>
                  <ArrowRightIcon className="size-4" />
                </Button>
              </form>
              {joinError ? (
                <p className="text-sm text-destructive">Enter a valid room code or meeting link.</p>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardEntrance(2)}>
          <button type="button" onClick={handleStartInstantRecording} className="block h-full w-full text-left">
            <Card className="h-full bg-elevated ring-1 ring-white/10 transition-colors hover:ring-primary/30">
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Radio className="size-5" />
                  <span className="ml-1.5 size-1.5 animate-pulse rounded-full bg-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Start Instant Recording</p>
                  <p className="text-sm text-muted-foreground">Capture audio and get a transcript automatically.</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>

        <motion.div {...cardEntrance(3)}>
          <UploadDropzone />
        </motion.div>
      </div>
    </div>
  );
}
