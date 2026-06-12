const FEATURE_COUNT = 40;
const FRAME_SIZE = 1_600;
const MIN_VERIFY_SCORE = 0.62;

export type LocalEnrollmentResult = {
  enrollmentStatus: "Enrolled" | "Training";
  enrollmentSpeechTime: number;
  remainingEnrollmentsSpeechLength: number;
  signature: number[];
};

export type LocalVerifyResult = {
  recognitionResult: "Accept" | "Reject";
  score: number;
};

function readString(view: DataView, offset: number, length: number) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value;
}

export function parseWavPcm(audio: ArrayBuffer): Int16Array {
  const view = new DataView(audio);

  if (audio.byteLength < 44) {
    throw new Error("Invalid WAV audio sample");
  }

  if (readString(view, 0, 4) !== "RIFF" || readString(view, 8, 4) !== "WAVE") {
    throw new Error("Audio must be a WAV file");
  }

  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= audio.byteLength) {
    const chunkId = readString(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (dataOffset === -1 || dataSize <= 0) {
    throw new Error("WAV file is missing PCM data");
  }

  const sampleCount = Math.floor(dataSize / 2);
  const pcm = new Int16Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    pcm[index] = view.getInt16(dataOffset + index * 2, true);
  }

  return pcm;
}

function normalizeFeatures(values: number[]): number[] {
  const output = values.slice(0, FEATURE_COUNT);

  while (output.length < FEATURE_COUNT) {
    output.push(0);
  }

  const magnitude = Math.sqrt(output.reduce((sum, value) => sum + value * value, 0));

  if (magnitude === 0) {
    return output;
  }

  return output.map((value) => value / magnitude);
}

export function extractVoiceSignature(audio: ArrayBuffer): number[] {
  const pcm = parseWavPcm(audio);
  const features: number[] = [];

  for (let offset = 0; offset + FRAME_SIZE <= pcm.length; offset += FRAME_SIZE) {
    let sumSquares = 0;
    let zeroCrossings = 0;

    for (let index = 0; index < FRAME_SIZE; index += 1) {
      const sample = pcm[offset + index] ?? 0;
      const normalized = sample / 32_768;
      sumSquares += normalized * normalized;

      if (index > 0) {
        const previous = pcm[offset + index - 1] ?? 0;
        if (Math.sign(sample) !== Math.sign(previous)) {
          zeroCrossings += 1;
        }
      }
    }

    features.push(Math.sqrt(sumSquares / FRAME_SIZE));
    features.push(zeroCrossings / FRAME_SIZE);
  }

  if (features.length === 0) {
    throw new Error("Recording did not contain enough speech data");
  }

  return normalizeFeatures(features);
}

function mergeSignatures(existing: number[], incoming: number[]): number[] {
  const merged = existing.map(
    (value, index) => (value + (incoming[index] ?? 0)) / 2,
  );

  return normalizeFeatures(merged);
}

function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function enrollLocalVoice(
  audio: ArrayBuffer,
  existingSignature?: number[] | null,
): LocalEnrollmentResult {
  const signature = extractVoiceSignature(audio);
  const mergedSignature = existingSignature
    ? mergeSignatures(existingSignature, signature)
    : signature;
  const enrollmentSpeechTime = parseWavPcm(audio).length / 16_000;

  return {
    enrollmentStatus: existingSignature ? "Enrolled" : "Training",
    enrollmentSpeechTime,
    remainingEnrollmentsSpeechLength: existingSignature ? 0 : 4,
    signature: mergedSignature,
  };
}

export function verifyLocalVoice(
  audio: ArrayBuffer,
  storedSignature: number[],
): LocalVerifyResult {
  const candidateSignature = extractVoiceSignature(audio);
  const score = cosineSimilarity(storedSignature, candidateSignature);

  return {
    recognitionResult: score >= MIN_VERIFY_SCORE ? "Accept" : "Reject",
    score,
  };
}

export function isLocalVerificationAccepted(result: LocalVerifyResult) {
  return result.recognitionResult === "Accept";
}
