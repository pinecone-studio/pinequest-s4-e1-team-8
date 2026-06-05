"use client";

import { useState, type FormEvent } from "react";
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

  if (response) {
    return (
      <ConnectedMeetingPanel
        livekitUrl={livekitUrl}
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form
      className="space-y-4 rounded-md border border-zinc-200 bg-white p-5"
      onSubmit={handleSubmit}
    >
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Meeting Room</h1>
      </div>

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
        disabled={!roomName || !participantName || Boolean(loadingAction)}
        loadingAction={loadingAction}
        onAction={(action) => void handleRoomAction(action)}
      />
    </form>
  );
};
