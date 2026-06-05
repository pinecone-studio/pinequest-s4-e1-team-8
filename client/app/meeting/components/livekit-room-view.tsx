"use client";

import { ConnectionState } from "livekit-client";
import { useLivekitRoom } from "../hooks/use-livekit-room";
import { DebugOutput } from "./debug-output";
import { ParticipantTile } from "./participant-tile";

type LivekitRoomViewProps = {
  livekitUrl: string;
  onLeave: () => void;
  roomName: string;
  token: string;
};

export const LivekitRoomView = ({
  livekitUrl,
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
    stateTransitions,
    tokenDiagnostics,
    urlDiagnostics,
  } = useLivekitRoom({ livekitUrl, token });
  const isConnecting = connectionState === ConnectionState.Connecting;

  const handleLeave = async () => {
    await leaveRoom();
    onLeave();
  };

  return (
    <section className="space-y-4 rounded-md border border-zinc-200 bg-white p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{roomName}</h2>
          <p className="text-sm text-zinc-500">{connectionState}</p>
        </div>
        <button
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          onClick={() => void handleLeave()}
          type="button"
        >
          Leave room
        </button>
      </header>

      {isConnecting ? <p className="text-sm text-zinc-600">Connecting...</p> : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {localParticipant ? (
          <ParticipantTile label="You" participant={localParticipant} />
        ) : null}
        {remoteParticipants.map((participant) => (
          <ParticipantTile
            key={participant.identity}
            participant={participant}
          />
        ))}
      </div>

      <DebugOutput
        label="LiveKit connection diagnostics"
        value={{
          stateTransitions,
          token: tokenDiagnostics,
          url: urlDiagnostics,
        }}
      />
    </section>
  );
};
