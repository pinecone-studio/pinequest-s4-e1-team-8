import { demuxWebmOpus } from "./webm-opus-demuxer";
import { decodeOpusPackets } from "./opus-decoder";
import { downmixToMono, encodeMp3Mono } from "./mp3-encoder";

// Detects whether a buffer is a WebM/Matroska container by its EBML magic.
export const isWebmContainer = (bytes: Uint8Array) =>
  bytes.length >= 4 &&
  bytes[0] === 0x1a &&
  bytes[1] === 0x45 &&
  bytes[2] === 0xdf &&
  bytes[3] === 0xa3;

// Speech-to-text engines need a little trailing audio to emit the final word —
// users typically stop recording the instant they finish speaking, so without a
// pad Chimege tends to drop the last word or two. Append a short silence.
const TRAILING_SILENCE_SECONDS = 0.8;

const padTrailingSilence = (mono: Float32Array, sampleRate: number) => {
  const padSamples = Math.round(sampleRate * TRAILING_SILENCE_SECONDS);
  const padded = new Float32Array(mono.length + padSamples);
  padded.set(mono); // remaining samples default to 0 (silence)
  return padded;
};

// Transcodes a browser MediaRecorder WebM/Opus recording into a mono 48 kHz MP3
// that Chimege's STT accepts. Runs entirely in the Worker: a pure-TS EBML
// demuxer + precompiled libopus WASM for decode + pure-JS lamejs for MP3 encode.
// No ffmpeg, no WebCodecs.
export const transcodeWebmToMp3 = (
  webm: ArrayBuffer,
  opusModule: WebAssembly.Module,
): ArrayBuffer => {
  const bytes = new Uint8Array(webm);
  const { track, packets } = demuxWebmOpus(bytes);

  if (packets.length === 0) {
    throw new Error("WebM: container had no Opus packets to decode");
  }
  if (track.channelMappingFamily !== 0) {
    throw new Error(
      `WebM: unsupported Opus channel mapping family ${track.channelMappingFamily}`,
    );
  }

  const channels = track.channels === 2 ? 2 : 1;
  const { channelData, sampleRate } = decodeOpusPackets(
    opusModule,
    packets,
    channels,
    track.preSkip,
  );

  const mono = padTrailingSilence(downmixToMono(channelData), sampleRate);
  return encodeMp3Mono(mono, sampleRate);
};
