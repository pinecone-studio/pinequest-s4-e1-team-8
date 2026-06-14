// Thin wrapper around a precompiled libopus WASM module (vendored as
// opus-decoder.wasm, extracted from the `opus-decoder` npm package). The
// Cloudflare Workers runtime forbids compiling WASM from a buffer at runtime,
// so the caller must pass an already-compiled `WebAssembly.Module` (obtained via
// an `import ... from "./opus-decoder.wasm"` statement, which wrangler bundles
// as a precompiled module).
//
// WASM export ABI (see the original EmscriptenWasm.js glue):
//   g: memory
//   h: __wasm_call_ctors()
//   i: opus_frame_decoder_create(sampleRate, channels, streamCount,
//        coupledStreamCount, mappingPtr, preSkip, forceStereo) -> decoderPtr
//   j: malloc(size) -> ptr
//   k: opus_frame_decode_float_deinterleaved(decoder, inPtr, inLen, outPtr)
//        -> samplesPerChannel (negative on error)
//   l: opus_frame_decoder_destroy(decoderPtr)
//   m: free(ptr)

type OpusExports = {
  g: WebAssembly.Memory;
  h: () => void;
  i: (
    sampleRate: number,
    channels: number,
    streamCount: number,
    coupledStreamCount: number,
    mappingPtr: number,
    preSkip: number,
    forceStereo: number,
  ) => number;
  j: (size: number) => number;
  k: (decoder: number, inPtr: number, inLen: number, outPtr: number) => number;
  l: (decoder: number) => void;
  m: (ptr: number) => void;
};

// libopus always decodes to 48 kHz; a frame is at most 120 ms.
const DECODE_SAMPLE_RATE = 48000;
const MAX_SAMPLES_PER_CHANNEL = 120 * 48; // 5760
const MAX_INPUT_BYTES = 0x8000; // 32 KB — far above any real Opus packet

// Imports the WASM expects under module "a" (a–f). Most are no-ops in our
// single-shot decode context; the heap is fixed-size so resize always fails.
const buildImports = () => ({
  a: {
    a: Math.cos, // emscripten_math_cos
    b: (code: number) => {
      throw new Error(`opus wasm proc_exit(${code})`);
    },
    c: () => {}, // emscripten_runtime_keepalive_clear
    d: () => {
      throw new Error("opus wasm abort");
    },
    e: () => 0, // setitimer_js
    f: () => 0, // emscripten_resize_heap -> false
  },
});

export type DecodedAudio = {
  // Deinterleaved PCM, one Float32Array per channel.
  channelData: Float32Array[];
  sampleRate: number;
  channels: number;
};

export const decodeOpusPackets = (
  module: WebAssembly.Module,
  packets: Uint8Array[],
  channels: number,
  preSkip: number,
): DecodedAudio => {
  const instance = new WebAssembly.Instance(module, buildImports());
  const wasm = instance.exports as unknown as OpusExports;
  wasm.h();

  const memory = wasm.g;
  const channelMapping = channels === 2 ? [0, 1] : [0];
  const coupledStreamCount = channels === 2 ? 1 : 0;

  const mappingPtr = wasm.j(channelMapping.length);
  new Uint8Array(memory.buffer, mappingPtr, channelMapping.length).set(channelMapping);

  const decoder = wasm.i(
    DECODE_SAMPLE_RATE,
    channels,
    1,
    coupledStreamCount,
    mappingPtr,
    preSkip,
    0,
  );

  const inPtr = wasm.j(MAX_INPUT_BYTES);
  const outPtr = wasm.j(channels * MAX_SAMPLES_PER_CHANNEL * 4);

  const perChannel: Float32Array[][] = Array.from({ length: channels }, () => []);
  let totalSamples = 0;

  try {
    for (const packet of packets) {
      if (packet.length > MAX_INPUT_BYTES) continue;

      new Uint8Array(memory.buffer, inPtr, packet.length).set(packet);
      const decoded = wasm.k(decoder, inPtr, packet.length, outPtr);

      if (decoded < 0) {
        throw new Error(`libopus decode error ${decoded}`);
      }
      if (decoded === 0) continue;

      for (let ch = 0; ch < channels; ch++) {
        const base = outPtr + ch * MAX_SAMPLES_PER_CHANNEL * 4;
        // Copy out immediately — the heap is reused on the next packet.
        const view = new Float32Array(memory.buffer, base, decoded);
        perChannel[ch].push(view.slice(0));
      }
      totalSamples += decoded;
    }
  } finally {
    wasm.l(decoder);
    wasm.m(decoder);
    wasm.m(inPtr);
    wasm.m(outPtr);
    wasm.m(mappingPtr);
  }

  const channelData = perChannel.map((chunks) => {
    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  });

  return { channelData, sampleRate: DECODE_SAMPLE_RATE, channels };
};
