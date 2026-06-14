import lamejs from "@breezystack/lamejs";

// Chimege's STT (`/v1.2/stt-long`) accepts only compressed audio (MP3/MP4/M4A)
// — it rejects WAV/PCM with `{"message":"error"}`. We therefore encode the
// decoded PCM to MP3 with lamejs, a pure-JS LAME port that runs in the Workers
// runtime with no WASM or native dependencies.

const MP3_BITRATE_KBPS = 128;
const SAMPLES_PER_FRAME = 1152; // MPEG-1 Layer III frame size

// Average all channels down to a single mono track.
export const downmixToMono = (channelData: Float32Array[]): Float32Array => {
  if (channelData.length === 1) return channelData[0];

  const length = channelData[0].length;
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const channel of channelData) sum += channel[i];
    mono[i] = sum / channelData.length;
  }
  return mono;
};

const floatToInt16 = (samples: Float32Array): Int16Array => {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

export const encodeMp3Mono = (
  samples: Float32Array,
  sampleRate: number,
): ArrayBuffer => {
  const pcm = floatToInt16(samples);
  const encoder = new lamejs.Mp3Encoder(1, sampleRate, MP3_BITRATE_KBPS);
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < pcm.length; i += SAMPLES_PER_FRAME) {
    const frame = encoder.encodeBuffer(pcm.subarray(i, i + SAMPLES_PER_FRAME));
    if (frame.length > 0) chunks.push(frame);
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);

  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const mp3 = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    mp3.set(chunk, offset);
    offset += chunk.length;
  }

  return mp3.buffer;
};
