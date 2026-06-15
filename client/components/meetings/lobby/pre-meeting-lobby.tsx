"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LobbyEntryPanel } from "./lobby-entry-panel";
import { LobbyMirrorPreview } from "./lobby-mirror-preview";
import { useMediaPreview } from "./use-media-preview";

type PreMeetingLobbyProps = {
  roomId: string;
};

const getClerkDisplayName = (user: ReturnType<typeof useUser>["user"]) => {
  if (!user) return "";

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.trim() ||
    ""
  );
};

export function PreMeetingLobby({ roomId }: PreMeetingLobbyProps) {
  const router = useRouter();
  const { user } = useUser();
  const media = useMediaPreview();
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const hasInitializedNameRef = useRef(false);

  useEffect(() => {
    if (hasInitializedNameRef.current) return;

    const clerkName = getClerkDisplayName(user);
    if (!clerkName) return;

    hasInitializedNameRef.current = true;
    setDisplayName(clerkName);
  }, [user]);

  const handleJoin = () => {
    const trimmedName = displayName.trim();
    if (!trimmedName || isJoining) return;

    setIsJoining(true);

    const params = new URLSearchParams({
      cam: media.isCamActive ? "1" : "0",
      mic: media.isMicActive ? "1" : "0",
      name: trimmedName,
    });

    router.push(`/room/${roomId}?${params.toString()}`);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/40 p-6 md:p-12">
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-purple-200/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-[28rem] rounded-full bg-purple-200/20 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center">
        <LobbyMirrorPreview
          audioLevel={media.audioLevel}
          avatarUrl={user?.imageUrl}
          cameraError={media.cameraError}
          displayName={displayName}
          isCamActive={media.isCamActive}
          isMicActive={media.isMicActive}
          microphoneError={media.microphoneError}
          onToggleCamera={media.toggleCamera}
          onToggleMicrophone={media.toggleMicrophone}
          videoRef={media.videoRef}
        />

        <LobbyEntryPanel
          audioInputDevices={media.audioInputDevices}
          displayName={displayName}
          isJoining={isJoining}
          onDisplayNameChange={setDisplayName}
          onJoin={handleJoin}
          onSelectAudioInputDevice={media.selectAudioInputDevice}
          onSelectVideoDevice={media.selectVideoDevice}
          roomCode={roomId}
          selectedAudioInputDeviceId={media.selectedAudioInputDeviceId}
          selectedVideoDeviceId={media.selectedVideoDeviceId}
          videoDevices={media.videoDevices}
        />
      </div>
    </div>
  );
}
