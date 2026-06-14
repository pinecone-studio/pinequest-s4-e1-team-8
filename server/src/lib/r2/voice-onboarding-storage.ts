import type { Bindings } from "../common/types";

const encoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer) => {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (value: ArrayBuffer | string) => {
  const data = typeof value === "string" ? encoder.encode(value) : value;
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

const getArrayBuffer = (value: Uint8Array) => {
  return value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
};

const hmac = async (key: ArrayBuffer, value: string) => {
  return crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
    encoder.encode(value),
  );
};

const getSigningKey = async (secret: string, dateStamp: string) => {
  const dateKey = await hmac(
    getArrayBuffer(encoder.encode(`AWS4${secret}`)),
    dateStamp,
  );
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");

  return hmac(serviceKey, "aws4_request");
};

const getAmzDate = (date: Date) => {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
};

const getDateStamp = (date: Date) => {
  return getAmzDate(date).slice(0, 8);
};

const getCanonicalPath = (pathname: string) => {
  return pathname
    .split("/")
    .map((part) => encodeURIComponent(decodeURIComponent(part)))
    .join("/");
};

const REQUIRED_R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const;

const assertR2Configured = (env: Bindings) => {
  const missingKeys = REQUIRED_R2_ENV_KEYS.filter((key) => !env[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(
      `R2 storage is not configured. Missing: ${missingKeys.join(", ")}`,
    );
  }
};

export const buildVoiceOnboardingRecordingKey = (
  userId: string,
  contentType: string,
) => {
  const extension = contentType.includes("webm")
    ? "webm"
    : contentType.includes("ogg")
      ? "ogg"
      : contentType.includes("mp4")
        ? "m4a"
        : "audio";

  return `onboarding-voice/${userId}/${Date.now()}.${extension}`;
};

export const uploadVoiceOnboardingRecording = async ({
  env,
  key,
  audio,
  contentType,
}: {
  env: Bindings;
  key: string;
  audio: ArrayBuffer;
  contentType: string;
}): Promise<{ key: string; url: string }> => {
  assertR2Configured(env);

  const host = `${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = new URL(`https://${host}/${getCanonicalPath(key)}`);
  const now = new Date();
  const amzDate = getAmzDate(now);
  const dateStamp = getDateStamp(now);
  const payloadHash = await sha256Hex(audio);

  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    getCanonicalPath(url.pathname),
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(env.R2_SECRET_ACCESS_KEY, dateStamp);
  const signature = toHex(await hmac(signingKey, stringToSign));

  const headers = {
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Type": contentType,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: audio,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload recording to R2: ${response.status}`);
  }

  return { key, url: url.toString() };
};
