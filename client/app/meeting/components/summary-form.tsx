"use client";

import { useState, type FormEvent } from "react";
import {
  generateMeetingSummary,
  type GenerateMeetingSummaryResponse,
} from "../index";
import { DebugOutput } from "./debug-output";
import { FormField } from "./form-field";

export const SummaryForm = () => {
  const [roomName, setRoomName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [egressId, setEgressId] = useState("");
  const [summarySeed, setSummarySeed] = useState("");
  const [summary, setSummary] =
    useState<GenerateMeetingSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await generateMeetingSummary({
        egressId: egressId || undefined,
        meetingId,
        recordingUrl,
        roomName,
        summary: summarySeed || undefined,
      });

      setSummary(result);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded-md border border-zinc-200 bg-white p-5"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-semibold text-zinc-950">Meeting Summary</h2>

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
        label="Recording URL"
        onChange={(event) => setRecordingUrl(event.target.value)}
        required
        type="url"
        value={recordingUrl}
      />
      <FormField
        label="Egress ID"
        onChange={(event) => setEgressId(event.target.value)}
        value={egressId}
      />
      <FormField
        label="Summary"
        onChange={(event) => setSummarySeed(event.target.value)}
        value={summarySeed}
        variant="textarea"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={!meetingId || !roomName || !recordingUrl || isLoading}
        type="submit"
      >
        {isLoading ? "Generating..." : "Generate summary"}
      </button>

      <DebugOutput label="Returned summary values" value={summary} />
    </form>
  );
};
