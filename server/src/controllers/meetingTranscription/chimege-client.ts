type ChimegeJobStatus = {
  status: "processing" | "done" | "failed";
  transcript?: string;
};

type ChimegeClientOptions = {
  baseUrl?: string;
};

const DEFAULT_CHIMEGE_BASE_URL = "https://api.chimege.com";

const getChimegeUrl = (path: string, baseUrl = DEFAULT_CHIMEGE_BASE_URL) => {
  return new URL(path, baseUrl).toString();
};

export const transcribeAudio = async (
  audioBuffer: ArrayBuffer,
  apiKey: string,
  options: ChimegeClientOptions = {},
): Promise<string> => {
  try {
    const uploadRes = await fetch(
      getChimegeUrl("/v1/transcribe", options.baseUrl),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "audio/mpeg",
        },
        body: audioBuffer,
      },
    );

    if (!uploadRes.ok) {
      throw new Error("Chimege: audio upload failed");
    }

    const { jobId } = (await uploadRes.json()) as { jobId: string };

    // TODO: Move polling out of the request lifecycle for production Workers.
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(
        getChimegeUrl(`/v1/jobs/${jobId}`, options.baseUrl),
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );

      const job = (await pollRes.json()) as ChimegeJobStatus;

      if (job.status === "done" && job.transcript) {
        return job.transcript;
      }

      if (job.status === "failed") {
        throw new Error("Chimege: transcription job failed");
      }
    }

    throw new Error("Chimege: timed out after 60s");
  } catch (error) {
    throw new Error(`Chimege client error: ${(error as Error).message}`);
  }
};
