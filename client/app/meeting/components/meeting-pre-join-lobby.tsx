"use client";

import { useUser } from "@clerk/nextjs";
import { useMediaToggleShortcuts } from "@/hooks/use-media-toggle-shortcuts";
import { LobbyCanvas } from "@/components/meetings/lobby/lobby-canvas";
import { LobbyDeviceSelectorRow } from "@/components/meetings/lobby/lobby-device-selector-row";
import { LobbyEntryPanel } from "@/components/meetings/lobby/lobby-entry-panel";
import { LobbyMirrorPreview } from "@/components/meetings/lobby/lobby-mirror-preview";
import { useMediaPreview } from "@/components/meetings/lobby/use-media-preview";
import {
  getOccupancySubtitle,
  useRoomOccupancy,
} from "@/components/meetings/lobby/use-room-occupancy";
import { getClerkDisplayName } from "@/lib/meetings/get-clerk-display-name";
import { useEffect, useRef, useState } from "react";

type MeetingPreJoinLobbyProps = {
  error?: string;
  isJoining: boolean;
  onJoin: (selection: {
    displayName: string;
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
  }) => void;
  roomName: string;
};

export function MeetingPreJoinLobby({
  error,
  isJoining,
  onJoin,
  roomName,
}: MeetingPreJoinLobbyProps) {
  const { user } = useUser();
  const media = useMediaPreview();
  const occupancy = useRoomOccupancy(roomName);
  const [displayName, setDisplayName] = useState("");
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

    onJoin({
      displayName: trimmedName,
      isCameraEnabled: media.isCamActive,
      isMicrophoneEnabled: media.isMicActive,
    });
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
          error={error}
          isJoining={isJoining}
          occupancySubtitle={getOccupancySubtitle(occupancy.participants.length)}
          onJoin={handleJoin}
          roomCode={roomName}
          title={roomName}
        />
      </div>
    </LobbyCanvas>
  );
}
