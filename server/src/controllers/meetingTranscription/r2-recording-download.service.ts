import type { Bindings } from "../../lib/common/types";

type R2ObjectLocation = {
  bucket: string;
  key: string;
  url: URL;
};

type DownloadedRecording = {
  buffer: ArrayBuffer;
  contentType: string | null;
  filename: string;
  size: number | null;
};

const encoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer) => {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (value: string) => {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
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

const getSigningKey = async (secret: string, date: string) => {
  const dateKey = await hmac(
    getArrayBuffer(encoder.encode(`AWS4${secret}`)),
    date,
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

const getCanonicalQuery = (url: URL) => {
  return [...url.searchParams.entries()]
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      `${leftKey}=${leftValue}`.localeCompare(`${rightKey}=${rightValue}`),
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
};

const parseR2ObjectLocation = (
  recordingUrl: string,
  env: Bindings,
): R2ObjectLocation => {
  const url = new URL(recordingUrl);
  const accountHost = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const bucketHost = `${env.R2_BUCKET_NAME}.${accountHost}`;
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (url.host === accountHost) {
    const [bucket, ...keyParts] = pathParts;
    const key = keyParts.join("/");

    if (!bucket || !key) {
      throw new Error("Recording URL does not contain R2 bucket and key");
    }

    if (bucket !== env.R2_BUCKET_NAME) {
      throw new Error("Recording URL bucket does not match configured R2 bucket");
    }

    return { bucket, key, url };
  }

  if (url.host === bucketHost) {
    const key = pathParts.join("/");

    if (!key) {
      throw new Error("Recording URL does not contain R2 object key");
    }

    return { bucket: env.R2_BUCKET_NAME, key, url };
  }

  console.error("[meetingTranscription] Recording URL rejected by R2 validation", {
    database: env.D1_DATABASE_NAME ?? "unknown",
    environment: env.ENVIRONMENT ?? "unknown",
    expectedHosts: [accountHost, bucketHost],
    receivedHost: url.host,
  });

  throw new Error("Recording URL is not an R2 account endpoint");
};

const getSignedR2Headers = async ({
  env,
  url,
}: {
  env: Bindings;
  url: URL;
}) => {
  const now = new Date();
  const amzDate = getAmzDate(now);
  const dateStamp = getDateStamp(now);
  const payloadHash = await sha256Hex("");
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "GET",
    getCanonicalPath(url.pathname),
    getCanonicalQuery(url),
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

  return {
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
};

export const downloadRecordingFromR2 = async ({
  env,
  recordingUrl,
}: {
  env: Bindings;
  recordingUrl: string;
}): Promise<DownloadedRecording> => {
  const location = parseR2ObjectLocation(recordingUrl, env);
  const headers = await getSignedR2Headers({ env, url: location.url });
  const response = await fetch(location.url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to download recording from R2: ${response.status}`);
  }

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type"),
    filename: location.key.split("/").at(-1) ?? location.key,
    size: response.headers.get("content-length")
      ? Number(response.headers.get("content-length"))
      : null,
  };
};
