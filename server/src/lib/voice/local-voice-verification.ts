// Offline speaker verification used when Azure Speaker Recognition is not
// configured. It builds an MFCC-based voiceprint (mean + variance of the
// mel-frequency cepstral coefficients across voiced frames). MFCCs capture the
// timbre of a speaker's vocal tract, so different people produce noticeably
// different signatures — unlike a raw loudness/zero-crossing envelope, which
// is nearly identical for everyone.

const SIGNATURE_LENGTH = 40;
const SAMPLE_RATE = 16_000;
const FRAME_SIZE = 400; // 25ms
const FRAME_HOP = 160; // 10ms
const FFT_SIZE = 512;
const MEL_FILTERS = 26;
const MFCC_COEFFS = 13;
const MEL_LOW_HZ = 50;
const MEL_HIGH_HZ = 8_000;
const PRE_EMPHASIS = 0.97;
const MIN_VERIFY_SCORE = 0.74;

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

function toFloatSamples(pcm: Int16Array): Float32Array {
  const samples = new Float32Array(pcm.length);
  let previous = 0;

  for (let index = 0; index < pcm.length; index += 1) {
    const current = (pcm[index] ?? 0) / 32_768;
    // Pre-emphasis boosts higher formants that help distinguish speakers.
    samples[index] = current - PRE_EMPHASIS * previous;
    previous = current;
  }

  return samples;
}

// In-place iterative radix-2 Cooley-Tukey FFT.
function fft(real: Float32Array, imag: Float32Array) {
  const n = real.length;

  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;

    if (i < j) {
      [real[i], real[j]] = [real[j]!, real[i]!];
      [imag[i], imag[j]] = [imag[j]!, imag[i]!];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;

      for (let k = 0; k < len / 2; k += 1) {
        const aReal = real[i + k]!;
        const aImag = imag[i + k]!;
        const bReal = real[i + k + len / 2]! * curReal - imag[i + k + len / 2]! * curImag;
        const bImag = real[i + k + len / 2]! * curImag + imag[i + k + len / 2]! * curReal;

        real[i + k] = aReal + bReal;
        imag[i + k] = aImag + bImag;
        real[i + k + len / 2] = aReal - bReal;
        imag[i + k + len / 2] = aImag - bImag;

        const nextReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = nextReal;
      }
    }
  }
}

function hzToMel(hz: number) {
  return 2_595 * Math.log10(1 + hz / 700);
}

function melToHz(mel: number) {
  return 700 * (10 ** (mel / 2_595) - 1);
}

// Precompute the triangular mel filterbank as [filter][fftBin] weights.
function buildMelFilterbank(): number[][] {
  const lowMel = hzToMel(MEL_LOW_HZ);
  const highMel = hzToMel(MEL_HIGH_HZ);
  const points: number[] = [];

  for (let i = 0; i < MEL_FILTERS + 2; i += 1) {
    const mel = lowMel + ((highMel - lowMel) * i) / (MEL_FILTERS + 1);
    const hz = melToHz(mel);
    points.push(Math.floor(((FFT_SIZE + 1) * hz) / SAMPLE_RATE));
  }

  const bins = FFT_SIZE / 2 + 1;
  const filters: number[][] = [];

  for (let f = 1; f <= MEL_FILTERS; f += 1) {
    const left = points[f - 1]!;
    const center = points[f]!;
    const right = points[f + 1]!;
    const filter = new Array<number>(bins).fill(0);

    for (let bin = left; bin < center; bin += 1) {
      if (center > left) {
        filter[bin] = (bin - left) / (center - left);
      }
    }
    for (let bin = center; bin < right; bin += 1) {
      if (right > center) {
        filter[bin] = (right - bin) / (right - center);
      }
    }

    filters.push(filter);
  }

  return filters;
}

const MEL_FILTERBANK = buildMelFilterbank();

function dct(input: number[]): number[] {
  const output = new Array<number>(MFCC_COEFFS).fill(0);

  for (let k = 0; k < MFCC_COEFFS; k += 1) {
    let sum = 0;
    for (let n = 0; n < input.length; n += 1) {
      sum += input[n]! * Math.cos((Math.PI * k * (n + 0.5)) / input.length);
    }
    output[k] = sum;
  }

  return output;
}

function frameMfcc(frame: Float32Array): number[] {
  const real = new Float32Array(FFT_SIZE);
  const imag = new Float32Array(FFT_SIZE);

  for (let index = 0; index < FRAME_SIZE; index += 1) {
    // Hamming window.
    const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * index) / (FRAME_SIZE - 1));
    real[index] = (frame[index] ?? 0) * window;
  }

  fft(real, imag);

  const bins = FFT_SIZE / 2 + 1;
  const power = new Array<number>(bins).fill(0);
  for (let bin = 0; bin < bins; bin += 1) {
    power[bin] = (real[bin]! * real[bin]! + imag[bin]! * imag[bin]!) / FFT_SIZE;
  }

  const logEnergies = MEL_FILTERBANK.map((filter) => {
    let energy = 0;
    for (let bin = 0; bin < bins; bin += 1) {
      energy += filter[bin]! * power[bin]!;
    }
    return Math.log(energy + 1e-10);
  });

  // Drop the 0th coefficient (overall energy) so loudness doesn't dominate.
  return dct(logEnergies).slice(1, MFCC_COEFFS);
}

function frameEnergy(samples: Float32Array, start: number): number {
  let sum = 0;
  for (let index = 0; index < FRAME_SIZE; index += 1) {
    const sample = samples[start + index] ?? 0;
    sum += sample * sample;
  }
  return sum / FRAME_SIZE;
}

function normalizeFeatures(values: number[]): number[] {
  const output = values.slice(0, SIGNATURE_LENGTH);

  while (output.length < SIGNATURE_LENGTH) {
    output.push(0);
  }

  const magnitude = Math.sqrt(output.reduce((sum, value) => sum + value * value, 0));

  if (magnitude === 0) {
    return output;
  }

  return output.map((value) => value / magnitude);
}

export function extractVoiceSignature(audio: ArrayBuffer): number[] {
  const samples = toFloatSamples(parseWavPcm(audio));

  if (samples.length < FRAME_SIZE) {
    return normalizeFeatures([]);
  }

  const energies: number[] = [];
  for (let start = 0; start + FRAME_SIZE <= samples.length; start += FRAME_HOP) {
    energies.push(frameEnergy(samples, start));
  }

  const maxEnergy = energies.reduce((max, value) => Math.max(max, value), 0);
  // Keep frames that carry speech; ignore silence between words.
  const voicedThreshold = maxEnergy * 0.05;

  const mfccFrames: number[][] = [];
  let frameIndex = 0;
  for (let start = 0; start + FRAME_SIZE <= samples.length; start += FRAME_HOP) {
    if ((energies[frameIndex] ?? 0) >= voicedThreshold && maxEnergy > 1e-6) {
      mfccFrames.push(frameMfcc(samples.subarray(start, start + FRAME_SIZE)));
    }
    frameIndex += 1;
  }

  if (mfccFrames.length === 0) {
    return normalizeFeatures([]);
  }

  const coeffCount = MFCC_COEFFS - 1;
  const mean = new Array<number>(coeffCount).fill(0);
  for (const frame of mfccFrames) {
    for (let i = 0; i < coeffCount; i += 1) {
      mean[i]! += frame[i]! / mfccFrames.length;
    }
  }

  const variance = new Array<number>(coeffCount).fill(0);
  for (const frame of mfccFrames) {
    for (let i = 0; i < coeffCount; i += 1) {
      const diff = frame[i]! - mean[i]!;
      variance[i]! += (diff * diff) / mfccFrames.length;
    }
  }

  const std = variance.map((value) => Math.sqrt(value));

  return normalizeFeatures([...mean, ...std]);
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
  const enrollmentSpeechTime = parseWavPcm(audio).length / SAMPLE_RATE;

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
