import type { Bindings } from "../common/types";

const GEMINI_MODEL = "gemini-2.5-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type GeminiJsonRequest = {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
};

function resolveGeminiModel(_bindings: Bindings, override?: string): string {
  return override?.trim() || GEMINI_MODEL;
}

function extractGeminiText(data: GeminiResponse): string | undefined {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

function tryParseJson(candidate: string): unknown {
  return JSON.parse(candidate.trim());
}

export function parseJsonFromGeminiText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SyntaxError("Empty Gemini response");
  }

  try {
    return tryParseJson(trimmed);
  } catch {
    // Continue with fallbacks.
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return tryParseJson(fencedMatch[1]);
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return tryParseJson(trimmed.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return tryParseJson(trimmed.slice(arrayStart, arrayEnd + 1));
  }

  throw new SyntaxError("Gemini response did not contain parseable JSON");
}

export async function generateGeminiText(
  bindings: Bindings,
  prompt: string,
): Promise<string> {
  const apiKey = bindings.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveGeminiModel(bindings)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return text;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export type GeminiAudioJsonRequest = {
  audio: ArrayBuffer | Uint8Array;
  mimeType: string;
  prompt: string;
  model?: string;
};

const GEMINI_FILES_BASE = "https://generativelanguage.googleapis.com";

// Inline (base64) audio inflates ~33% and must fit inside the ~20 MB total
// request cap. Above this raw-byte threshold we upload via the Files API and
// reference the file by URI instead, which supports much larger recordings.
const INLINE_AUDIO_MAX_BYTES = 12 * 1024 * 1024;

type GeminiUploadedFile = {
  uri: string;
  name: string; // e.g. "files/abc123" — used for status polling and cleanup.
  state: string;
};

// Resumable upload of an audio buffer to the Gemini Files API. Returns the
// file's URI/name; the file is referenced by URI in generateContent and is
// auto-deleted by Google after 48h (we also delete it eagerly after use).
async function uploadAudioToFiles(
  apiKey: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<GeminiUploadedFile> {
  const startResponse = await fetch(
    `${GEMINI_FILES_BASE}/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: "recording-audio" } }),
    },
  );

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");

  if (!startResponse.ok || !uploadUrl) {
    throw new Error(
      `Gemini Files API: failed to start upload (${startResponse.status})`,
    );
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    // Pass a fresh ArrayBuffer slice so fetch sends exactly these bytes.
    body: bytes.slice().buffer,
  });

  const uploaded = (await uploadResponse.json()) as {
    file?: GeminiUploadedFile;
    error?: { message?: string };
  };

  if (!uploadResponse.ok || !uploaded.file?.uri) {
    throw new Error(
      uploaded.error?.message ?? "Gemini Files API: upload failed",
    );
  }

  return uploaded.file;
}

// Audio/video files report `state: PROCESSING` immediately after upload and
// cannot be used in generateContent until they reach `ACTIVE`. Poll until then.
async function waitForFileActive(
  apiKey: string,
  file: GeminiUploadedFile,
): Promise<void> {
  let current = file;

  for (let attempt = 0; attempt < 15 && current.state !== "ACTIVE"; attempt++) {
    if (current.state === "FAILED") {
      throw new Error("Gemini Files API: file processing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const statusResponse = await fetch(
      `${GEMINI_FILES_BASE}/v1beta/${current.name}?key=${apiKey}`,
    );
    current = (await statusResponse.json()) as GeminiUploadedFile;
  }

  if (current.state !== "ACTIVE") {
    throw new Error("Gemini Files API: file did not become ACTIVE in time");
  }
}

async function deleteFile(apiKey: string, name: string): Promise<void> {
  try {
    await fetch(`${GEMINI_FILES_BASE}/v1beta/${name}?key=${apiKey}`, {
      method: "DELETE",
    });
  } catch {
    // Best-effort cleanup; Google auto-expires the file after 48h regardless.
  }
}

async function postGenerateContent(
  apiKey: string,
  model: string,
  audioPart: Record<string, unknown>,
  prompt: string,
): Promise<string> {
  const body = {
    contents: [{ role: "user", parts: [audioPart, { text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  };

  const response = await fetch(
    `${GEMINI_FILES_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return text;
}

// Multimodal JSON call: sends an audio buffer plus a prompt to Gemini and
// returns the raw JSON text. Small files are sent inline (base64); larger files
// are uploaded via the Files API and referenced by URI. Used for acoustic
// speaker diarization where we want Gemini to "listen" rather than reason over text.
export async function generateGeminiJsonFromAudio(
  bindings: Bindings,
  params: GeminiAudioJsonRequest,
): Promise<string> {
  const apiKey = bindings.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const bytes =
    params.audio instanceof Uint8Array
      ? params.audio
      : new Uint8Array(params.audio);
  const model = resolveGeminiModel(bindings, params.model);

  if (bytes.byteLength <= INLINE_AUDIO_MAX_BYTES) {
    return postGenerateContent(
      apiKey,
      model,
      { inlineData: { mimeType: params.mimeType, data: toBase64(bytes) } },
      params.prompt,
    );
  }

  const file = await uploadAudioToFiles(apiKey, bytes, params.mimeType);

  try {
    await waitForFileActive(apiKey, file);

    return await postGenerateContent(
      apiKey,
      model,
      { fileData: { mimeType: params.mimeType, fileUri: file.uri } },
      params.prompt,
    );
  } finally {
    await deleteFile(apiKey, file.name);
  }
}

export async function generateGeminiJson(
  bindings: Bindings,
  params: GeminiJsonRequest,
): Promise<string> {
  const apiKey = bindings.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  if (params.systemPrompt?.trim()) {
    body.systemInstruction = { parts: [{ text: params.systemPrompt.trim() }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${resolveGeminiModel(bindings, params.model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!response.ok || !text) {
    throw new Error(data.error?.message ?? "Gemini request failed");
  }

  return text;
}

