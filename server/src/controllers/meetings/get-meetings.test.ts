import { describe, expect, test, mock } from "bun:test";
import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { meetings, meetingSummaries } from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";

let mockUserId: string | null = "user-1";
let meetingsRows: Record<string, unknown>[] = [];
let transcriptionsRows: Record<string, unknown>[] = [];
let summariesRows: Record<string, unknown>[] = [];

mock.module("../../lib/auth/clerk", () => ({
  getAuthenticatedUserId: async () => mockUserId,
}));

mock.module("../../lib/db/db", () => ({
  useDB: () => ({
    select: () => ({
      from: (table: unknown) => {
        const rows =
          table === meetings
            ? meetingsRows
            : table === meetingTranscriptions
              ? transcriptionsRows
              : table === meetingSummaries
                ? summariesRows
                : [];

        const chain = {
          where: () => chain,
          orderBy: () => chain,
          all: async () => rows,
          get: async () => rows[0],
        };

        return chain;
      },
    }),
  }),
}));

const { getMeetings } = await import("./get-meetings");

type JsonCall = { body: unknown; status?: number };

const createContext = () => {
  const calls: JsonCall[] = [];
  const c = {
    json: (body: unknown, status?: number) => {
      calls.push({ body, status });
      return { body, status };
    },
  } as unknown as Context<{ Bindings: Bindings; Variables: Variables }>;

  return { c, calls };
};

describe("getMeetings", () => {
  test("returns 401 when unauthenticated", async () => {
    mockUserId = null;
    const { c, calls } = createContext();

    await getMeetings(c);

    expect(calls[0]).toEqual({ body: { error: "Unauthorized" }, status: 401 });
  });

  test("returns an empty list when the user has no meetings", async () => {
    mockUserId = "user-1";
    meetingsRows = [];
    transcriptionsRows = [];
    summariesRows = [];
    const { c, calls } = createContext();

    await getMeetings(c);

    expect(calls[0]).toEqual({ body: { meetings: [] }, status: 200 });
  });

  test("returns meetings with the latest transcription status and a summary preview", async () => {
    mockUserId = "user-1";
    meetingsRows = [
      {
        id: "meeting-1",
        userId: "user-1",
        title: "Design Review",
        createdAt: new Date("2026-06-12T09:00:00Z"),
        updatedAt: new Date("2026-06-12T09:30:00Z"),
      },
      {
        id: "meeting-2",
        userId: "user-1",
        title: "Standup",
        createdAt: new Date("2026-06-11T09:00:00Z"),
        updatedAt: new Date("2026-06-11T09:15:00Z"),
      },
    ];
    // Pre-sorted newest-first, matching the controller's `orderBy(desc(createdAt))`.
    transcriptionsRows = [
      {
        id: "transcript-2",
        meetingId: "meeting-1",
        status: "done",
        createdAt: new Date("2026-06-12T09:31:00Z"),
      },
      {
        id: "transcript-1",
        meetingId: "meeting-1",
        status: "processing",
        createdAt: new Date("2026-06-12T09:01:00Z"),
      },
    ];
    summariesRows = [
      {
        meetingId: "meeting-1",
        content: "a".repeat(200),
      },
    ];
    const { c, calls } = createContext();

    await getMeetings(c);

    expect(calls[0]?.status).toBe(200);
    const body = calls[0]?.body as { meetings: Array<Record<string, unknown>> };
    expect(body.meetings).toHaveLength(2);

    expect(body.meetings[0]).toEqual({
      id: "meeting-1",
      title: "Design Review",
      createdAt: meetingsRows[0]!.createdAt,
      updatedAt: meetingsRows[0]!.updatedAt,
      transcriptionStatus: "done",
      summaryPreview: "a".repeat(160),
    });

    expect(body.meetings[1]).toEqual({
      id: "meeting-2",
      title: "Standup",
      createdAt: meetingsRows[1]!.createdAt,
      updatedAt: meetingsRows[1]!.updatedAt,
      transcriptionStatus: null,
      summaryPreview: null,
    });
  });
});
