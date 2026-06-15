"use client";

import { useMediaToggleShortcuts } from "@/hooks/use-media-toggle-shortcuts";
import { getClerkDisplayName } from "@/lib/meetings/get-clerk-display-name";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LobbyCanvas } from "./lobby-canvas";
import { LobbyDeviceSelectorRow } from "./lobby-device-selector-row";
import { LobbyEntryPanel } from "./lobby-entry-panel";
import { LobbyMirrorPreview } from "./lobby-mirror-preview";
import { useMediaPreview } from "./use-media-preview";
import { getOccupancySubtitle, useRoomOccupancy } from "./use-room-occupancy";

type PreMeetingLobbyProps = {
  roomId: string;
};

export function PreMeetingLobby({ roomId }: PreMeetingLobbyProps) {
  const router = useRouter();
  const { user } = useUser();
  const media = useMediaPreview();
  const occupancy = useRoomOccupancy(roomId);
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const hasInitializedNameRef = useRef(false);

  useMediaToggleShortcuts({
    onToggleCamera: media.toggleCamera,
    onToggleMicrophone: media.toggleMicrophone,
  });

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
    <LobbyCanvas>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-8 md:flex-row md:justify-center">
        <div className="flex w-full max-w-xl flex-col items-center gap-4">
          <LobbyMirrorPreview
            audioLevel={media.audioLevel}
            avatarUrl={user?.imageUrl}
            backgroundEffect={media.backgroundEffect}
            cameraError={media.cameraError}
            displayName={displayName}
            isCamActive={media.isCamActive}
            isMicActive={media.isMicActive}
            isMirrored={media.isMirrored}
            microphoneError={media.microphoneError}
            onSetBackgroundEffect={media.setBackgroundEffect}
            onToggleCamera={media.toggleCamera}
            onToggleMicrophone={media.toggleMicrophone}
            onToggleMirror={media.toggleMirror}
            videoRef={media.videoRef}
          />

          <LobbyDeviceSelectorRow
            audioInputDevices={media.audioInputDevices}
            audioOutputDevices={media.audioOutputDevices}
            backgroundEffect={media.backgroundEffect}
            onBackgroundEffectChange={media.setBackgroundEffect}
            onSelectAudioInputDevice={media.selectAudioInputDevice}
            onSelectAudioOutputDevice={media.selectAudioOutputDevice}
            onSelectVideoDevice={media.selectVideoDevice}
            selectedAudioInputDeviceId={media.selectedAudioInputDeviceId}
            selectedAudioOutputDeviceId={media.selectedAudioOutputDeviceId}
            selectedVideoDeviceId={media.selectedVideoDeviceId}
            videoDevices={media.videoDevices}
          />
        </div>

        <LobbyEntryPanel
          canJoin={Boolean(displayName.trim())}
          isJoining={isJoining}
          occupancySubtitle={getOccupancySubtitle(
            occupancy.participants.length,
          )}
          onJoin={handleJoin}
          roomCode={roomId}
          title={roomId}
        />
      </div>
    </LobbyCanvas>
  );
}
