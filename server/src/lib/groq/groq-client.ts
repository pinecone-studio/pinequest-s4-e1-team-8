import type { Bindings } from "../common/types";
import { resolveMeetingGroqKey } from "./groq-keys";

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function resolveGroqModel(bindings: Bindings): string {
  return bindings.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

const SUMMARY_PROMPT_PREFIX =
  "Summarize the following meeting transcript. Respond in Mongolian. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"mainTopics": string[], "keyDecisions": string[], "actionItems": { "owner": string, "action": string }[]}\n\n' +
  '"mainTopics" lists the main topics discussed, "keyDecisions" lists the key decisions made, ' +
  'and "actionItems" lists the assigned action items, each with the responsible person\'s name in "owner" ' +
  '(use "Тодорхойгүй" if no owner is mentioned) and the task description in "action".\n\n';

const SUMMARY_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Always respond in Mongolian language.";

const SEGMENTS_PROMPT_PREFIX =
  "Split the following meeting transcript into per-speaker dialogue segments. " +
  "Respond in Mongolian. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"segments": [{ "speakerName": string, "text": string, "timestampSeconds": number }]}\n\n' +
  '"speakerName" must match one of the provided participant names as closely as ' +
  'possible (use "Тодорхойгүй" if no participant name matches), "text" is the verbatim ' +
  'text spoken during that turn, and "timestampSeconds" is the estimated number of ' +
  'seconds from the start of the meeting when that turn began. Segments must be ordered ' +
  'by "timestampSeconds" ascending, starting at 0.\n\n';

const SEGMENTS_PROMPT_SUFFIX =
  "\n\nIMPORTANT: Always respond in Mongolian language.";

type GroqResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
};

async function requestGroqCompletion(
  bindings: Bindings,
  prompt: string,
): Promise<string> {
  const apiKey = resolveMeetingGroqKey(bindings);
  if (!apiKey) {
    throw new Error("Groq meeting API key is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolveGroqModel(bindings),
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = (await response.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Groq request failed");
  }

  return text;
}

const getParticipantsSection = (participantNames?: string[] | null) =>
  participantNames?.length
    ? `Meeting participants: ${participantNames.join(", ")}\n\n`
    : "";

export async function generateGroqSummary(
  bindings: Bindings,
  transcript: string,
  participantNames?: string[] | null,
): Promise<string> {
  const participantsSection = getParticipantsSection(participantNames);

  return requestGroqCompletion(
    bindings,
    `${SUMMARY_PROMPT_PREFIX}${participantsSection}Transcript:\n${transcript}${SUMMARY_PROMPT_SUFFIX}`,
  );
}

export async function generateGroqTranscriptSegments(
  bindings: Bindings,
  transcript: string,
  participantNames?: string[] | null,
): Promise<string> {
  const participantsSection = getParticipantsSection(participantNames);

  return requestGroqCompletion(
    bindings,
    `${SEGMENTS_PROMPT_PREFIX}${participantsSection}Transcript:\n${transcript}${SEGMENTS_PROMPT_SUFFIX}`,
  );
}
