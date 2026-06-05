type ChimegeJobStatus = {
  done: boolean;
  transcription?: string;
  duration?: number;
};

type ChimegeClientOptions = {
  baseUrl?: string;
  filename?: string;
  fileSize?: number | null;
  mimeType?: string | null;
};

const DEFAULT_CHIMEGE_BASE_URL = "https://api.chimege.com";
const DEFAULT_AUDIO_MIME_TYPE = "audio/mpeg";
const DEFAULT_AUDIO_FILENAME = "meeting-recording.mp3";

const getChimegeUrl = (path: string, baseUrl = DEFAULT_CHIMEGE_BASE_URL) => {
  return new URL(path, baseUrl).toString();
};

const readResponseBody = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return "[unreadable response body]";
  }
};

const createChimegeUploadBody = ({
  audioBuffer,
  filename,
  mimeType,
}: {
  audioBuffer: ArrayBuffer;
  filename: string;
  mimeType: string;
}) => {
  const formData = new FormData();

  formData.append("file", new Blob([audioBuffer], { type: mimeType }), filename);

  return formData;
};

const getChimegeJob = (responseBody: string): ChimegeJobStatus | null => {
  const parsed = JSON.parse(responseBody) as ChimegeJobStatus | ChimegeJobStatus[];

  return Array.isArray(parsed) ? parsed[0] ?? null : parsed;
};

export const transcribeAudio = async (
  audioBuffer: ArrayBuffer,
  apiKey: string,
  options: ChimegeClientOptions = {},
): Promise<string> => {
  try {
    const uploadEndpoint = getChimegeUrl("/v1.2/stt-long", options.baseUrl);
    const transcriptEndpoint = getChimegeUrl(
      "/v1.2/stt-long-transcript",
      options.baseUrl,
    );
    const filename = options.filename ?? DEFAULT_AUDIO_FILENAME;
    const mimeType = options.mimeType ?? DEFAULT_AUDIO_MIME_TYPE;

    const uploadHeaders = new Headers();
    uploadHeaders.set("Token", apiKey);

    const uploadRes = await fetch(uploadEndpoint, {
      method: "POST",
      headers: uploadHeaders,
      body: createChimegeUploadBody({ audioBuffer, filename, mimeType }),
    });
    const uploadResponseBody = await readResponseBody(uploadRes);

    if (!uploadRes.ok) {
      throw new Error(`Chimege: audio upload failed: ${uploadResponseBody}`);
    }

    const { uuid } = JSON.parse(uploadResponseBody) as { uuid?: string };

    if (!uuid) {
      throw new Error(
        `Chimege: upload response missing UUID: ${uploadResponseBody}`,
      );
    }

    // TODO: Move polling out of the request lifecycle for production Workers.
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollHeaders = new Headers();
      pollHeaders.set("Token", apiKey);
      pollHeaders.set("UUID", uuid);

      const pollRes = await fetch(transcriptEndpoint, {
        headers: pollHeaders,
      });
      const pollResponseBody = await readResponseBody(pollRes);

      if (!pollRes.ok) {
        console.error("[meetingTranscription] Chimege transcript poll failed", {
          status: pollRes.status,
          body: pollResponseBody,
        });

        throw new Error(`Chimege: transcript poll failed: ${pollResponseBody}`);
      }

      const job = getChimegeJob(pollResponseBody);

      if (job?.done && job.transcription) {
        return job.transcription;
      }

      if (job?.done && !job.transcription) {
        console.error("[meetingTranscription] Chimege transcription failed", {
          body: pollResponseBody,
          job,
        });

        throw new Error("Chimege: transcription finished without text");
      }
    }

    throw new Error("Chimege: timed out after 60s");
  } catch (error) {
    throw new Error(`Chimege client error: ${(error as Error).message}`);
  }
};
