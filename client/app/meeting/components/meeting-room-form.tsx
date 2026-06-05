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
  const [token, setToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
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
        livekitUrl={livekitUrl}
        meetingId={meetingId}
        onLeave={() => {
          setLivekitUrl("");
          setResponse(null);
          setToken("");
        }}
        response={response}
        token={token}
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

      setToken(result.token);
      setLivekitUrl(result.url);
      setResponse(result);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section
      className="space-y-4 rounded-md border border-zinc-200 bg-white p-5"
    >
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Meeting Room</h1>
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <MeetingActionButtons
        disabled={isActionDisabled}
        loadingAction={loadingAction}
        onAction={(action) => void handleRoomAction(action)}
      />
    </section>
  );
};
