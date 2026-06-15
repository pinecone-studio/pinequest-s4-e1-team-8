// Frame-accurate MP3 splitter — slices an MP3 into time ranges WITHOUT decoding
// or re-encoding. MPEG audio frames are self-contained and each carries a fixed
// number of samples, so we can parse frame headers, map a [start,end] time range
// to the frames that cover it, and concatenate their raw bytes into a new valid
// MP3. No ffmpeg, no WASM, no PCM round-trip — same philosophy as the rest of
// server/src/lib/audio/*.
//
// Used by the diarization pipeline: after we get speaker timestamps, we cut the
// recording into per-speaker chunks and send each to Chimege STT.

// --- MPEG audio header lookup tables -------------------------------------------------

// Bitrate (kbps) by [versionGroup][layer][bitrateIndex].
// versionGroup: 0 = MPEG1, 1 = MPEG2/2.5. layer: 1=LayerIII, 2=LayerII, 3=LayerI.
const BITRATES: Record<string, number[]> = {
  // MPEG1, Layer III
  "1-1": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  // MPEG2/2.5, Layer III
  "2-1": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
};

// Sample rate (Hz) by version code (from the header's version bits) -> index.
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000, 0], // MPEG1
  2: [22050, 24000, 16000, 0], // MPEG2
  0: [11025, 12000, 8000, 0], // MPEG2.5
};

export interface Mp3Frame {
  offset: number; // byte offset of the frame start within the buffer
  length: number; // frame length in bytes
  startSec: number; // cumulative time of this frame's first sample
  durationSec: number;
}

export interface Mp3FrameIndex {
  frames: Mp3Frame[];
  totalDurationSec: number;
}

// ID3v2 tags sit at the very start of the file and aren't audio — skip them so
// our first parsed frame is real audio.
const skipId3v2 = (bytes: Uint8Array): number => {
  if (
    bytes.length >= 10 &&
    bytes[0] === 0x49 && // 'I'
    bytes[1] === 0x44 && // 'D'
    bytes[2] === 0x33 // '3'
  ) {
    // Size is a 28-bit synchsafe integer in bytes 6..9.
    const size =
      (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    return 10 + size;
  }
  return 0;
};

// Parses a single frame header at `offset`. Returns null if it isn't a valid
// MPEG Layer III audio frame (so callers can resync).
const parseFrameHeader = (
  bytes: Uint8Array,
  offset: number,
): { length: number; samplesPerFrame: number; sampleRate: number } | null => {
  if (offset + 4 > bytes.length) return null;

  // Frame sync: 11 bits set.
  if (bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) return null;

  const versionBits = (bytes[offset + 1] >> 3) & 0x03; // 3=MPEG1, 2=MPEG2, 0=MPEG2.5
  const layerBits = (bytes[offset + 1] >> 1) & 0x03; // 1 = Layer III
  if (versionBits === 1 || layerBits !== 1) return null; // reserved version / not Layer III

  const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
  const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
  const padding = (bytes[offset + 2] >> 1) & 0x01;

  const isMpeg1 = versionBits === 3;
  const bitrateTable = BITRATES[isMpeg1 ? "1-1" : "2-1"];
  const bitrate = bitrateTable[bitrateIndex] * 1000;
  const sampleRate = SAMPLE_RATES[versionBits]?.[sampleRateIndex] ?? 0;

  if (!bitrate || !sampleRate) return null; // free-format / reserved

  const samplesPerFrame = isMpeg1 ? 1152 : 576;
  // Layer III frame length in bytes.
  const length =
    Math.floor((samplesPerFrame / 8) * (bitrate / sampleRate)) + padding;

  if (length < 4) return null;

  return { length, samplesPerFrame, sampleRate };
};

// Walks the whole buffer and builds a time-indexed list of frames.
export const indexMp3Frames = (mp3: ArrayBuffer): Mp3FrameIndex => {
  const bytes = new Uint8Array(mp3);
  const frames: Mp3Frame[] = [];

  let offset = skipId3v2(bytes);
  let elapsed = 0;

  while (offset + 4 <= bytes.length) {
    const header = parseFrameHeader(bytes, offset);

    if (!header) {
      // Lost sync (garbage/tag between frames) — scan forward to the next 0xFF.
      offset++;
      continue;
    }

    const durationSec = header.samplesPerFrame / header.sampleRate;
    frames.push({ offset, length: header.length, startSec: elapsed, durationSec });
    elapsed += durationSec;
    offset += header.length;
  }

  if (frames.length === 0) {
    throw new Error("MP3 splitter: no decodable MPEG Layer III frames found");
  }

  return { frames, totalDurationSec: elapsed };
};

// Extracts the byte range covering [startSec, endSec] as a standalone MP3.
// Frame-aligned: includes any frame that overlaps the window, so the cut never
// drops audio inside the range (it may include up to ~26ms extra at each edge,
// which is harmless for STT and covered by padding upstream).
export const sliceMp3ByTime = (
  mp3: ArrayBuffer,
  index: Mp3FrameIndex,
  startSec: number,
  endSec: number,
): ArrayBuffer => {
  const bytes = new Uint8Array(mp3);
  const { frames } = index;

  let firstFrame = -1;
  let lastFrame = -1;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const frameEnd = frame.startSec + frame.durationSec;
    // Overlap test: frame intersects [startSec, endSec).
    if (frameEnd > startSec && frame.startSec < endSec) {
      if (firstFrame === -1) firstFrame = i;
      lastFrame = i;
    }
  }

  if (firstFrame === -1) {
    throw new Error(
      `MP3 splitter: no frames in range ${startSec.toFixed(3)}s–${endSec.toFixed(3)}s`,
    );
  }

  const byteStart = frames[firstFrame].offset;
  const byteEnd = frames[lastFrame].offset + frames[lastFrame].length;

  // Copy into a fresh buffer so the slice owns exactly its bytes.
  return bytes.slice(byteStart, byteEnd).buffer;
};
