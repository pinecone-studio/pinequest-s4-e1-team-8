"use client";

import { ConnectionState } from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useLivekitRoom } from "../hooks/use-livekit-room";
import { ParticipantTile } from "./participant-tile";
import { RecordingControls } from "./recording-controls";

type LivekitRoomViewProps = {
  livekitUrl: string;
  meetingId: string;
  onLeave: () => void;
  roomName: string;
  token: string;
};

export const LivekitRoomView = ({
  livekitUrl,
  meetingId,
  onLeave,
  roomName,
  token,
}: LivekitRoomViewProps) => {
  const {
    connectionState,
    error,
    leaveRoom,
    localParticipant,
    remoteParticipants,
  } = useLivekitRoom({ livekitUrl, token });
  const isConnecting = connectionState === ConnectionState.Connecting;
  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const compactParticipants = [
    ...(localParticipant ? [localParticipant] : []),
    ...remoteParticipants,
  ].slice(0, 4);

  const handleLeave = async () => {
    await leaveRoom();
    onLeave();
  };

  const toggleMicrophone = async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled
    );
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
  };

  return (
    <section className="mx-auto grid min-h-[calc(100vh-3rem)] gap-4 rounded-[2rem] border border-white/10 bg-[#12101c] p-4 shadow-2xl shadow-black/40 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-h-0 flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{roomName}</h2>
            <p className="text-sm text-zinc-400">{connectionState}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-100">
              <Radio className="h-3.5 w-3.5" />
              Recording ready
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
              ID {meetingId}
            </span>
          </div>
        </header>

        {isConnecting ? (
          <p className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3 text-sm text-violet-100">
            Connecting...
          </p>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {compactParticipants.map((participant) => (
            <ParticipantTile
              key={participant.identity}
              label={participant.isLocal ? "You" : undefined}
              participant={participant}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1">
          {localParticipant ? (
            <ParticipantTile
              label="You"
              participant={localParticipant}
              variant="active"
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-[#100e18] text-sm text-zinc-400">
              Waiting for local participant...
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <button
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition ${
              localParticipant?.isMicrophoneEnabled
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
            }`}
            disabled={!localParticipant}
            onClick={() => void toggleMicrophone()}
            title={
              localParticipant?.isMicrophoneEnabled
                ? "Mute microphone"
                : "Unmute microphone"
            }
            type="button"
          >
            {localParticipant?.isMicrophoneEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>
          <button
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl transition ${
              localParticipant?.isCameraEnabled
                ? "bg-white/10 text-white hover:bg-white/15"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
            }`}
            disabled={!localParticipant}
            onClick={() => void toggleCamera()}
            title={
              localParticipant?.isCameraEnabled ? "Turn camera off" : "Turn camera on"
            }
            type="button"
          >
            {localParticipant?.isCameraEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>
          <button
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400"
            onClick={() => void handleLeave()}
            type="button"
          >
            <PhoneOff className="h-5 w-5" />
            Leave
          </button>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-4 rounded-3xl border border-white/10 bg-[#191525] p-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-violet-300" />
              Participants
            </h3>
            <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-zinc-300">
              {participantCount}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {localParticipant ? (
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-200">
                <span>You</span>
                <span className="text-xs text-violet-200">Host</span>
              </div>
            ) : null}
            {remoteParticipants.map((participant) => (
              <div
                className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-200"
                key={participant.identity}
              >
                <span className="truncate">
                  {participant.name || participant.identity}
                </span>
                <span className="text-xs text-zinc-400">
                  {participant.isMicrophoneEnabled ? "Mic on" : "Muted"}
                </span>
              </div>
            ))}
            {!participantCount ? (
              <p className="text-sm text-zinc-500">No participants yet.</p>
            ) : null}
          </div>
        </div>

        <RecordingControls meetingId={meetingId} roomName={roomName} />
      </aside>
    </section>
  );
};
