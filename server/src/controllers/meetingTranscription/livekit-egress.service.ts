import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
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
  const egressClient = new EgressClient(
    getLiveKitApiUrl(env),
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );

  const fileOutput = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath:
      filepath ?? `meetings/${meetingId}/${transcriptionId}-{time}.mp4`,
    output: {
      case: "s3",
      value: getR2Upload(env),
    },
  });

  return egressClient.startRoomCompositeEgress(
    roomName,
    { file: fileOutput },
    { audioOnly: true },
  );
};
