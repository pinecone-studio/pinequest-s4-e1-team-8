import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  WebhookConfig,
} from "livekit-server-sdk";
import type { Bindings } from "../../lib/common/types";

export const getLiveKitApiUrl = (env: Bindings) => {
  const url = env.LIVEKIT_API_URL ?? env.LIVEKIT_URL;

  if (url.startsWith("wss://")) return url.replace("wss://", "https://");
  if (url.startsWith("ws://")) return url.replace("ws://", "http://");

  return url;
};

export const getLiveKitFrontendUrl = (env: Bindings) => {
  return env.LIVEKIT_WS_URL ?? env.LIVEKIT_URL;
};

const getR2Upload = (env: Bindings) => {
  return new S3Upload({
    accessKey: env.R2_ACCESS_KEY_ID,
    secret: env.R2_SECRET_ACCESS_KEY,
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: env.R2_BUCKET_NAME,
    forcePathStyle: true,
  });
};

const getEgressClient = (env: Bindings) => {
  return new EgressClient(
    getLiveKitApiUrl(env),
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );
};

const getWebhookUrl = (env: Bindings) => {
  const url = env.LIVEKIT_EGRESS_WEBHOOK_URL?.trim();

  return url && url.length > 0 ? url : null;
};

const getEgressWebhooks = (env: Bindings) => {
  const url = getWebhookUrl(env);

  if (!url) return undefined;

  return [
    new WebhookConfig({
      url,
      signingKey: env.LIVEKIT_API_KEY,
    }),
  ];
};

export const startRoomEgress = async ({
  env,
  roomName,
  meetingId,
  transcriptionId,
  filepath,
}: {
  env: Bindings;
  roomName: string;
  meetingId: string;
  transcriptionId: string;
  filepath?: string;
}) => {
  const egressClient = getEgressClient(env);
  const egressOptions = {
    audioOnly: true,
    webhooks: getEgressWebhooks(env),
  };

  const fileOutput = new EncodedFileOutput({
    fileType: EncodedFileType.MP3,
    filepath:
      filepath ?? `meetings/${meetingId}/${transcriptionId}-{time}.mp3`,
    output: {
      case: "s3",
      value: getR2Upload(env),
    },
  });

  return egressClient.startRoomCompositeEgress(
    roomName,
    { file: fileOutput },
    egressOptions,
  );
};

export const stopRoomEgress = async ({
  env,
  egressId,
}: {
  env: Bindings;
  egressId: string;
}) => {
  return getEgressClient(env).stopEgress(egressId);
};

export const getRoomEgressInfo = async ({
  env,
  egressId,
}: {
  env: Bindings;
  egressId: string;
}) => {
  const [egress] = await getEgressClient(env).listEgress({ egressId });

  return egress ?? null;
};
