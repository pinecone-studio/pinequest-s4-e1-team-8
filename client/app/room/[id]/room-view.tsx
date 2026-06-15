"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatPanel } from "./components/chat-panel";
import { ParticipantFilmstrip } from "./components/participant-filmstrip";
import { PrimaryStage } from "./components/primary-stage";
import { RoomHeader } from "./components/room-header";
import { SummaryCard } from "./components/summary-card";
import { TaskListCard } from "./components/task-list-card";
import { getRoomMockData } from "./mock-data";
import type { ChatMessage, RecordingState } from "./types";

const CAPTION_INTERVAL_MS = 6000;
const ACTIVE_SPEAKER_INTERVAL_MS = 8000;

const formatTimestamp = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

type RoomViewProps = {
  initialCameraOn?: boolean;
  initialMicOn?: boolean;
  initialName?: string;
  roomId: string;
};

export const RoomView = ({
  initialCameraOn = true,
  initialMicOn = true,
  initialName,
  roomId,
}: RoomViewProps) => {
  const router = useRouter();
  const [data] = useState(() => getRoomMockData(roomId));
  const [participants, setParticipants] = useState(() => {
    const trimmedName = initialName?.trim();
    if (!trimmedName) return data.participants;

    return data.participants.map((participant) =>
      participant.isSelf
        ? { ...participant, initial: trimmedName.charAt(0).toUpperCase(), name: trimmedName }
        : participant,
    );
  });
  const [pendingParticipant, setPendingParticipant] = useState(
    data.pendingParticipant,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(data.messages);
  const [tasks, setTasks] = useState(data.tasks);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("recording");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCaptionIndex((current) => (current + 1) % data.captions.length);
    }, CAPTION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [data.captions.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParticipants((current) => {
        if (current.length < 2) return current;
        const [active, next, ...rest] = current;
        return [next, ...rest, active];
      });
    }, ACTIVE_SPEAKER_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.isSelf ? { ...participant, isMicOn } : participant,
      ),
    );
  }, [isMicOn]);

  const handleSelectParticipant = (participantId: string) => {
    setParticipants((current) => {
      const targetIndex = current.findIndex(
        (participant) => participant.id === participantId,
      );
      if (targetIndex <= 0) return current;

      const next = [...current];
      [next[0], next[targetIndex]] = [next[targetIndex], next[0]];
      return next;
    });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleSendMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        author: "You",
        id: `msg-${Date.now()}`,
        isOwn: true,
        text,
        timestamp: formatTimestamp(new Date()),
      },
    ]);
  };

  const handleApproveParticipant = () => {
    if (!pendingParticipant) return;

    setParticipants((current) => [
      ...current,
      {
        avatarGradient: "from-rose-400 to-pink-600",
        id: pendingParticipant.id,
        initial: pendingParticipant.name.slice(0, 1).toUpperCase(),
        isMicOn: true,
        name: pendingParticipant.name,
      },
    ]);
    setPendingParticipant(null);
  };

  const handleRejectParticipant = () => {
    setPendingParticipant(null);
  };

  const handleToggleRecordingPause = () => {
    setRecordingState((current) =>
      current === "recording" ? "paused" : "recording",
    );
  };

  const handleEndCall = () => {
    router.push("/meetings");
  };

  const activeParticipant = participants[0];
  const filmstripParticipants = participants.slice(1);
  const activeCaption = data.captions[captionIndex];

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f5f4f1] p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-emerald-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 size-96 rounded-full bg-violet-200/40 blur-[120px]" />

      <RoomHeader
        locationLabel={data.locationLabel}
        onApproveParticipant={handleApproveParticipant}
        onRejectParticipant={handleRejectParticipant}
        pendingParticipant={pendingParticipant}
        roomName={data.roomName}
      />

      <div className="relative z-10 flex h-[calc(100vh-80px)] min-h-0 gap-4 overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <PrimaryStage
            activeParticipant={activeParticipant}
            captionLine={activeCaption}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            onEndCall={handleEndCall}
            onStopRecording={() => setRecordingState("stopped")}
            onToggleCamera={() => setIsCameraOn((current) => !current)}
            onToggleMic={() => setIsMicOn((current) => !current)}
            onToggleRecordingPause={handleToggleRecordingPause}
            onToggleScreenShare={() =>
              setIsScreenSharing((current) => !current)
            }
            recordingState={recordingState}
          />
          <ParticipantFilmstrip
            onSelectParticipant={handleSelectParticipant}
            participants={filmstripParticipants}
          />
        </div>

        <aside className="flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto pl-2">
          <SummaryCard summary={data.summary} />
          <TaskListCard onToggleTask={handleToggleTask} tasks={tasks} />
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            participants={participants}
          />
        </aside>
      </div>
    </div>
  );
};
