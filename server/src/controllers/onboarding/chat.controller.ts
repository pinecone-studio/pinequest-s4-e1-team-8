import type { Context } from "hono";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { streamSSE } from "hono/streaming";
import { createDiscoveryGraph, createDiscoveryModel } from "../../agent/onboarding-discovery/discoveryGraph";
import { computeCoveragePercent } from "../../agent/onboarding-discovery/rubric";
import { synthesizeTddDocument } from "../../lib/groq/onboarding-tdd-synthesis";
import type { Bindings, Variables } from "../../lib/common/types";
import { useDB } from "../../lib/db/db";
import {
  parseDiscoveryState,
  parseTranscript,
  serializeDiscoveryState,
  serializePlanningBrief,
  type OnboardingTranscriptMessage,
  type PersistedDiscoveryState,
} from "../../lib/onboarding/tdd-types";
import { onboardingSessions } from "../../schema/onboarding-session.model";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type ChatRequestBody = {
  sessionId?: unknown;
  projectName?: unknown;
  description?: unknown;
  message?: unknown;
};

function buildAskMoreMessage(round: number): string {
  if (round <= 1) {
    return "Thanks for the overview! Here are a few quick questions to help shape your plan:";
  }
  return "Got it — that helps. A few more quick questions:";
}

const SYNTHESIZE_MESSAGE =
  "Thanks — I have what I need to put together your TDD planning brief. Generating it now...";

async function streamMessageTokens(
  stream: Parameters<Parameters<typeof streamSSE>[1]>[0],
  content: string,
) {
  const tokens = content.split(/(\s+)/);
  for (const token of tokens) {
    if (stream.aborted) {
      return;
    }
    if (token) {
      await stream.writeSSE({ event: "token", data: JSON.stringify({ token }) });
    }
  }
}

export const postOnboardingChat = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const raw = (await c.req.json().catch(() => null)) as ChatRequestBody | null;
  if (!raw || typeof raw !== "object") {
    return c.json({ error: "Request body must be a JSON object." }, 400);
  }

  const projectName = typeof raw.projectName === "string" ? raw.projectName.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const sessionId = typeof raw.sessionId === "string" ? raw.sessionId.trim() : "";

  if (!projectName || !description) {
    return c.json({ error: "projectName and description are required." }, 400);
  }

  if (!message) {
    return c.json({ error: "message is required." }, 400);
  }

  const geminiApiKey = c.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    return c.json({ error: "GEMINI_API_KEY is not configured." }, 500);
  }

  const db = useDB(c);
  let session = sessionId
    ? await db
        .select()
        .from(onboardingSessions)
        .where(and(eq(onboardingSessions.id, sessionId), eq(onboardingSessions.userId, userId)))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  if (!session) {
    const newSessionId = sessionId || `obs_${nanoid()}`;
    await db.insert(onboardingSessions).values({
      id: newSessionId,
      userId,
      transcript: JSON.stringify([]),
      status: "INTERVIEWING",
    });
    session = {
      id: newSessionId,
      userId,
      projectId: null,
      transcript: JSON.stringify([]),
      tddLayoutState: null,
      discoveryState: null,
      planningBrief: null,
      status: "INTERVIEWING",
      docUrl: null,
      createdAt: new Date(),
    };
  }

  if (session.status !== "INTERVIEWING") {
    return c.json({ error: "Session is not in interviewing phase." }, 400);
  }

  let transcript = parseTranscript(session.transcript);
  const discoveryState = parseDiscoveryState(session.discoveryState);

  transcript = [
    ...transcript,
    { id: `msg_${nanoid()}`, role: "user", content: message },
  ];

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: "session",
        data: JSON.stringify({ sessionId: session!.id }),
      });

      const graph = createDiscoveryGraph(createDiscoveryModel(geminiApiKey));
      const result = await graph.invoke({
        projectName,
        description,
        messages: transcript,
        collectedInfo: discoveryState.collectedInfo,
        confidence: discoveryState.confidence,
        round: discoveryState.round,
        askedTopics: discoveryState.askedTopics,
        pendingQuestions: [],
        sufficiencyDecision: null,
        sufficiencyReasoning: discoveryState.sufficiencyReasoning ?? "",
        brief: null,
      });

      const updatedDiscoveryState: PersistedDiscoveryState = {
        collectedInfo: result.collectedInfo,
        confidence: result.confidence,
        round: result.round,
        askedTopics: result.askedTopics,
        sufficiencyReasoning: result.sufficiencyReasoning,
      };

      if (result.sufficiencyDecision === "synthesize") {
        if (!result.brief) {
          throw new Error("Discovery agent did not produce a TDD planning brief.");
        }

        await streamMessageTokens(stream, SYNTHESIZE_MESSAGE);

        const wrapUpMessage: OnboardingTranscriptMessage = {
          id: `msg_${nanoid()}`,
          role: "assistant",
          content: SYNTHESIZE_MESSAGE,
          round: result.round,
        };
        transcript = [...transcript, wrapUpMessage];

        await stream.writeSSE({ event: "synthesizing", data: JSON.stringify({ status: "started" }) });

        const blocks = await synthesizeTddDocument(c.env, projectName, description, result.brief);
        const tddLayoutState = { blocks };

        await db
          .update(onboardingSessions)
          .set({
            transcript: JSON.stringify(transcript),
            tddLayoutState: JSON.stringify(tddLayoutState),
            discoveryState: serializeDiscoveryState(updatedDiscoveryState),
            planningBrief: serializePlanningBrief(result.brief),
            status: "CANVAS_EDIT",
          })
          .where(eq(onboardingSessions.id, session!.id));

        await stream.writeSSE({
          event: "synthesis",
          data: JSON.stringify({ tddLayoutState, brief: result.brief, status: "CANVAS_EDIT" }),
        });
      } else {
        const introMessage = buildAskMoreMessage(result.round);
        await streamMessageTokens(stream, introMessage);

        const assistantMessage: OnboardingTranscriptMessage = {
          id: `msg_${nanoid()}`,
          role: "assistant",
          content: introMessage,
          round: result.round,
          questions: result.pendingQuestions,
        };
        transcript = [...transcript, assistantMessage];

        await db
          .update(onboardingSessions)
          .set({
            transcript: JSON.stringify(transcript),
            discoveryState: serializeDiscoveryState(updatedDiscoveryState),
          })
          .where(eq(onboardingSessions.id, session!.id));

        await stream.writeSSE({
          event: "complete",
          data: JSON.stringify({
            message: introMessage,
            round: result.round,
            questions: result.pendingQuestions,
            coverage: computeCoveragePercent(result.confidence),
          }),
        });
      }

      if (!stream.aborted) {
        await stream.writeSSE({ event: "done", data: JSON.stringify({ ok: true }) });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Chat stream failed.";
      if (!stream.aborted) {
        await stream.writeSSE({ event: "error", data: JSON.stringify({ error: message }) });
      }
    }
  });
};
