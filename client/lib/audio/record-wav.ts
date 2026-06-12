const TARGET_SAMPLE_RATE = 16_000;

function resampleChannel(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
) {
  if (inputSampleRate === outputSampleRate) {
    return input;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, input.length - 1);
    const weight = sourceIndex - lowerIndex;
    output[index] =
      input[lowerIndex] * (1 - weight) + input[upperIndex] * weight;
  }

  return output;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

async function blobToMonoSamples(blob: Blob) {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();

  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.numberOfChannels > 1
      ? decoded.getChannelData(0)
      : decoded.getChannelData(0);
    return {
      samples: resampleChannel(channel, decoded.sampleRate, TARGET_SAMPLE_RATE),
      sampleRate: TARGET_SAMPLE_RATE,
    };
  } finally {
    await audioContext.close();
  }
}

export async function recordWavBlob(durationMs: number) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  mediaRecorder.start();

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

  if (mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  await new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => resolve();
  });

  stream.getTracks().forEach((track) => track.stop());

  const recordedBlob = new Blob(chunks, {
    type: mediaRecorder.mimeType || "audio/webm",
  });
  const { samples } = await blobToMonoSamples(recordedBlob);
  const wavBuffer = encodeWav(samples, TARGET_SAMPLE_RATE);

  return new Blob([wavBuffer], { type: "audio/wav" });
}

export const VOICE_RECORD_DURATION_MS = 4_000;
