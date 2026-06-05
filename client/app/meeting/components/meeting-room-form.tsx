"use client";

import { useState, type FormEvent } from "react";
import {
  createMeetingRoom,
  joinMeetingRoom,
  type MeetingRoomTokenResponse,
} from "../index";
import { DebugOutput } from "./debug-output";
import { FormField } from "./form-field";

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

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={!roomName || !participantName || Boolean(loadingAction)}
          onClick={() => void handleRoomAction("create")}
          type="button"
        >
          {loadingAction === "create" ? "Creating..." : "Create room"}
        </button>
        <button
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
          disabled={!roomName || !participantName || Boolean(loadingAction)}
          onClick={() => void handleRoomAction("join")}
          type="button"
        >
          {loadingAction === "join" ? "Joining..." : "Join room"}
        </button>
      </div>

      <DebugOutput
        label="Returned meeting values"
        value={response ? { livekitUrl, roomName: response.roomName, token } : null}
      />
    </form>
  );
};
