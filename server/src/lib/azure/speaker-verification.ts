import type { Bindings } from "../common/types";

const DEFAULT_LOCALE = "en-US";
const MIN_VERIFY_SCORE = 0.5;

type AzureEnrollmentResponse = {
  enrollmentStatus?: string;
  enrollmentSpeechTime?: number;
  remainingEnrollmentsSpeechLength?: number;
};

type AzureVerifyResponse = {
  recognitionResult?: "Accept" | "Reject";
  score?: number;
};

type AzureProfileResponse = {
  profileId?: string;
  enrollmentStatus?: string;
};

export class AzureSpeakerVerificationError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "AzureSpeakerVerificationError";
  }
}

function getAzureConfig(env: Bindings) {
  const key = env.AZURE_SPEECH_KEY?.trim();
  const region = env.AZURE_SPEECH_REGION?.trim();

  if (!key || !region) {
    throw new AzureSpeakerVerificationError(
      "Azure Speech is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.",
    );
  }

  return { key, region };
}

function getBaseUrl(region: string) {
  return `https://${region}.api.cognitive.microsoft.com`;
}

async function readAzureError(response: Response) {
  try {
    const body = await response.text();
    if (!body) {
      return response.statusText || "Azure request failed";
    }

    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message ?? body;
  } catch {
    return response.statusText || "Azure request failed";
  }
}

async function azureRequest<T>({
  env,
  path,
  method,
  body,
  contentType,
}: {
  env: Bindings;
  path: string;
  method: "GET" | "POST" | "DELETE";
  body?: ArrayBuffer | string;
  contentType?: string;
}): Promise<T> {
  const { key, region } = getAzureConfig(env);
  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": key,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const response = await fetch(`${getBaseUrl(region)}${path}`, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    throw new AzureSpeakerVerificationError(
      await readAzureError(response),
      response.status,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function createVerificationProfile(env: Bindings) {
  return azureRequest<{ profileId: string }>({
    env,
    path: "/speaker/verification/v2.0/text-independent/profiles",
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ locale: DEFAULT_LOCALE }),
  });
}

export async function enrollVerificationProfile(
  env: Bindings,
  profileId: string,
  audio: ArrayBuffer,
) {
  return azureRequest<AzureEnrollmentResponse>({
    env,
    path: `/speaker/verification/v2.0/text-independent/profiles/${profileId}/enrollments`,
    method: "POST",
    contentType: "audio/wav; codecs=audio/pcm; samplerate=16000",
    body: audio,
  });
}

export async function verifyVerificationProfile(
  env: Bindings,
  profileId: string,
  audio: ArrayBuffer,
) {
  return azureRequest<AzureVerifyResponse>({
    env,
    path: `/speaker/verification/v2.0/text-independent/profiles/${profileId}:verify`,
    method: "POST",
    contentType: "audio/wav; codecs=audio/pcm; samplerate=16000",
    body: audio,
  });
}

export async function getVerificationProfile(env: Bindings, profileId: string) {
  return azureRequest<AzureProfileResponse>({
    env,
    path: `/speaker/verification/v2.0/text-independent/profiles/${profileId}`,
    method: "GET",
  });
}

export async function deleteVerificationProfile(env: Bindings, profileId: string) {
  await azureRequest({
    env,
    path: `/speaker/verification/v2.0/text-independent/profiles/${profileId}`,
    method: "DELETE",
  });
}

export function isProfileEnrolled(status?: string) {
  return status === "Enrolled";
}

export function isVerificationAccepted(result: AzureVerifyResponse) {
  if (result.recognitionResult === "Accept") {
    return true;
  }

  if (result.recognitionResult === "Reject") {
    return false;
  }

  return (result.score ?? 0) >= MIN_VERIFY_SCORE;
}
