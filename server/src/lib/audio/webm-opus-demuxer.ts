// Minimal WebM/Matroska (EBML) demuxer specialised for extracting Opus audio.
//
// MediaRecorder in the browser emits a WebM container whose Segment and Cluster
// elements use "unknown" sizes (all size bits set) because the stream is written
// live. We therefore cannot rely on element sizes for those masters. Instead we
// treat the master elements we care about (Segment, Cluster, BlockGroup) as
// "transparent": we step into their content and keep reading siblings in a flat
// loop. Leaf and fixed elements (SimpleBlock, Timecode, Info, Cues, ...) always
// carry a known size, so a flat scan stays aligned.

const ID_EBML = 0x1a45dfa3;
const ID_SEGMENT = 0x18538067;
const ID_TRACKS = 0x1654ae6b;
const ID_TRACK_ENTRY = 0xae;
const ID_TRACK_NUMBER = 0xd7;
const ID_CODEC_ID = 0x86;
const ID_CODEC_PRIVATE = 0x63a2;
const ID_AUDIO = 0xe1;
const ID_CHANNELS = 0x9f;
const ID_CLUSTER = 0x1f43b675;
const ID_SIMPLE_BLOCK = 0xa3;
const ID_BLOCK_GROUP = 0xa0;
const ID_BLOCK = 0xa1;

export type OpusTrack = {
  trackNumber: number;
  channels: number;
  preSkip: number;
  inputSampleRate: number;
  channelMappingFamily: number;
};

export type DemuxedOpus = {
  track: OpusTrack;
  packets: Uint8Array[];
};

type Header = {
  id: number;
  size: number;
  dataStart: number;
  unknown: boolean;
};

// EBML variable-length integer. `keepMarker` returns the raw ID value (marker
// bit retained), otherwise the size value (marker stripped). `allOnes` flags an
// "unknown size" sentinel.
const readVint = (view: DataView, pos: number, keepMarker: boolean) => {
  const first = view.getUint8(pos);
  let mask = 0x80;
  let length = 1;
  while (length <= 8 && (first & mask) === 0) {
    mask >>= 1;
    length += 1;
  }

  if (length > 8) {
    throw new Error("WebM: invalid EBML vint length");
  }

  const lowerMask = mask - 1;
  let value = keepMarker ? first : first & lowerMask;
  let allOnes = (first & lowerMask) === lowerMask;

  for (let i = 1; i < length; i++) {
    const b = view.getUint8(pos + i);
    value = value * 256 + b;
    if (b !== 0xff) allOnes = false;
  }

  return { value, length, allOnes };
};

const readHeader = (view: DataView, pos: number): Header => {
  const id = readVint(view, pos, true);
  const size = readVint(view, pos + id.length, false);
  return {
    id: id.value,
    size: size.value,
    dataStart: pos + id.length + size.length,
    unknown: size.allOnes,
  };
};

const readUint = (view: DataView, start: number, length: number) => {
  let value = 0;
  for (let i = 0; i < length; i++) value = value * 256 + view.getUint8(start + i);
  return value;
};

const readString = (bytes: Uint8Array, start: number, length: number) =>
  new TextDecoder().decode(bytes.subarray(start, start + length));

const parseOpusHead = (head: Uint8Array): Omit<OpusTrack, "trackNumber"> => {
  // OpusHead: "OpusHead"(8) version(1) channelCount(1) preSkip(2 LE)
  //           inputSampleRate(4 LE) outputGain(2) channelMappingFamily(1)
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  return {
    channels: head[9] ?? 1,
    preSkip: head.length >= 12 ? view.getUint16(10, true) : 0,
    inputSampleRate: head.length >= 16 ? view.getUint32(12, true) : 48000,
    channelMappingFamily: head.length >= 19 ? head[18] : 0,
  };
};

const parseTrackEntry = (
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
): OpusTrack | null => {
  let trackNumber = 0;
  let codecId = "";
  let opusHead: Uint8Array | null = null;
  let audioChannels = 0;

  let pos = start;
  while (pos < end) {
    const h = readHeader(view, pos);
    const next = h.dataStart + h.size;

    if (h.id === ID_TRACK_NUMBER) {
      trackNumber = readUint(view, h.dataStart, h.size);
    } else if (h.id === ID_CODEC_ID) {
      codecId = readString(bytes, h.dataStart, h.size);
    } else if (h.id === ID_CODEC_PRIVATE) {
      opusHead = bytes.subarray(h.dataStart, next);
    } else if (h.id === ID_AUDIO) {
      let ap = h.dataStart;
      const audioEnd = next;
      while (ap < audioEnd) {
        const ah = readHeader(view, ap);
        if (ah.id === ID_CHANNELS) {
          audioChannels = readUint(view, ah.dataStart, ah.size);
        }
        ap = ah.dataStart + ah.size;
      }
    }

    pos = next;
  }

  if (codecId !== "A_OPUS") return null;

  const fromHead = opusHead ? parseOpusHead(opusHead) : null;
  return {
    trackNumber,
    channels: fromHead?.channels || audioChannels || 1,
    preSkip: fromHead?.preSkip ?? 0,
    inputSampleRate: fromHead?.inputSampleRate ?? 48000,
    channelMappingFamily: fromHead?.channelMappingFamily ?? 0,
  };
};

const parseTracks = (
  bytes: Uint8Array,
  view: DataView,
  start: number,
  end: number,
): OpusTrack | null => {
  let pos = start;
  while (pos < end) {
    const h = readHeader(view, pos);
    if (h.id === ID_TRACK_ENTRY) {
      const track = parseTrackEntry(bytes, view, h.dataStart, h.dataStart + h.size);
      if (track) return track;
    }
    pos = h.dataStart + h.size;
  }
  return null;
};

// Decode a (Simple)Block payload into one or more Opus frames, honouring the
// four Matroska lacing modes. Browser MediaRecorder uses no lacing, but the
// others are cheap to support and make the demuxer robust to other encoders.
const readBlockFrames = (
  bytes: Uint8Array,
  view: DataView,
  start: number,
  blockEnd: number,
): { track: number; frames: Uint8Array[] } => {
  let pos = start;
  const track = readVint(view, pos, false);
  pos += track.length;
  pos += 2; // int16 relative timecode
  const flags = view.getUint8(pos);
  pos += 1;

  const lacing = (flags >> 1) & 0x03;
  const frames: Uint8Array[] = [];

  if (lacing === 0) {
    frames.push(bytes.subarray(pos, blockEnd));
    return { track: track.value, frames };
  }

  const frameCount = view.getUint8(pos) + 1;
  pos += 1;

  if (lacing === 2) {
    // Fixed-size lacing: every frame is the same length.
    const size = (blockEnd - pos) / frameCount;
    for (let i = 0; i < frameCount; i++) {
      frames.push(bytes.subarray(pos, pos + size));
      pos += size;
    }
  } else if (lacing === 1) {
    // Xiph lacing: sizes encoded as a run of bytes terminated by a non-255.
    const sizes: number[] = [];
    for (let i = 0; i < frameCount - 1; i++) {
      let s = 0;
      let b: number;
      do {
        b = view.getUint8(pos++);
        s += b;
      } while (b === 0xff);
      sizes.push(s);
    }
    for (const s of sizes) {
      frames.push(bytes.subarray(pos, pos + s));
      pos += s;
    }
    frames.push(bytes.subarray(pos, blockEnd));
  } else {
    // EBML lacing: first size is an unsigned vint, the rest are signed deltas.
    const first = readVint(view, pos, false);
    pos += first.length;
    let size = first.value;
    const sizes = [size];
    for (let i = 1; i < frameCount - 1; i++) {
      const d = readVint(view, pos, false);
      pos += d.length;
      const bias = 2 ** (7 * d.length - 1) - 1;
      size += d.value - bias;
      sizes.push(size);
    }
    for (const s of sizes) {
      frames.push(bytes.subarray(pos, pos + s));
      pos += s;
    }
    frames.push(bytes.subarray(pos, blockEnd));
  }

  return { track: track.value, frames };
};

export const demuxWebmOpus = (bytes: Uint8Array): DemuxedOpus => {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0x1a ||
    bytes[1] !== 0x45 ||
    bytes[2] !== 0xdf ||
    bytes[3] !== 0xa3
  ) {
    throw new Error("WebM: missing EBML header (not a WebM container)");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length;
  let pos = 0;
  let track: OpusTrack | null = null;
  const packets: Uint8Array[] = [];

  while (pos < end) {
    let header: Header;
    try {
      header = readHeader(view, pos);
    } catch {
      break;
    }
    if (header.dataStart > end) break;

    if (
      header.id === ID_SEGMENT ||
      header.id === ID_CLUSTER ||
      header.id === ID_BLOCK_GROUP ||
      header.id === ID_EBML // step into EBML header content harmlessly via leaves
    ) {
      if (header.id === ID_EBML && !header.unknown) {
        pos = header.dataStart + header.size; // EBML header has a known size; skip it
      } else {
        pos = header.dataStart; // transparent master: descend
      }
      continue;
    }

    if (header.id === ID_TRACKS) {
      const parsed = parseTracks(bytes, view, header.dataStart, header.dataStart + header.size);
      if (parsed) track = parsed;
      pos = header.dataStart + header.size;
      continue;
    }

    if (header.id === ID_SIMPLE_BLOCK || header.id === ID_BLOCK) {
      const blockEnd = header.dataStart + header.size;
      const { track: blockTrack, frames } = readBlockFrames(
        bytes,
        view,
        header.dataStart,
        blockEnd,
      );
      if (!track || blockTrack === track.trackNumber) {
        for (const frame of frames) {
          if (frame.length > 0) packets.push(frame);
        }
      }
      pos = blockEnd;
      continue;
    }

    // Any other element (Info, Cues, SeekHead, Timecode, Void, CRC-32, ...) has
    // a known size and is irrelevant to us — skip its bytes.
    if (header.unknown) break;
    pos = header.dataStart + header.size;
  }

  if (!track) {
    throw new Error("WebM: no Opus audio track found");
  }

  return { track, packets };
};
