"use client";

import { useState } from "react";
import {
  createMeetingRoom,
  joinMeetingRoom,
  type MeetingRoomTokenResponse,
} from "../index";
import { ConnectedMeetingPanel } from "./connected-meeting-panel";
import { FormField } from "./form-field";
import { MeetingActionButtons } from "./meeting-action-buttons";

type MeetingAction = "create" | "join";

export const MeetingRoomForm = () => {
  const [meetingId, setMeetingId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [response, setResponse] = useState<MeetingRoomTokenResponse | null>(
    null
  );
  const [loadingAction, setLoadingAction] = useState<MeetingAction | null>(
    null
  );
  const [error, setError] = useState("");
  const isActionDisabled =
    !meetingId || !roomName || !participantName || Boolean(loadingAction);

  if (response) {
    return (
      <ConnectedMeetingPanel
        meetingId={meetingId}
        onLeave={() => {
          setResponse(null);
        }}
        response={response}
      />
    );
  }

  const handleRoomAction = async (action: MeetingAction) => {
    setError("");
    setLoadingAction(action);

    try {
      const result =
        action === "create"
          ? await createMeetingRoom({ hostName: participantName, roomName })
          : await joinMeetingRoom({ participantName, roomName });

      setResponse(result);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-white/10 bg-[#14111f] p-5 shadow-2xl shadow-black/30">
      <div>
        <h1 className="text-xl font-semibold text-white">Meeting Room</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Create or join a room to open the conference workspace.
        </p>
      </div>

      <FormField
        label="Meeting ID"
        onChange={(event) => setMeetingId(event.target.value)}
        required
        value={meetingId}
      />
      <FormField
        label="Room name"
        onChange={(event) => setRoomName(event.target.value)}
        required
        value={roomName}
      />
      <FormField
        label="Participant name"
        onChange={(event) => setParticipantName(event.target.value)}
        required
        value={participantName}
      />

      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <MeetingActionButtons
        disabled={isActionDisabled}
        loadingAction={loadingAction}
        onAction={(action) => void handleRoomAction(action)}
      />
    </section>
  );
};
