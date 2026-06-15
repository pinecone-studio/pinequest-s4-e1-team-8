import { test, expect } from "bun:test";
import { encodeMp3Mono } from "./mp3-encoder";
import { indexMp3Frames, sliceMp3ByTime } from "./mp3-splitter";

const SAMPLE_RATE = 48000;

// Build a real MP3 of `seconds` of a quiet sine so the parser has genuine frames.
const makeMp3 = (seconds: number): ArrayBuffer => {
  const samples = new Float32Array(Math.round(SAMPLE_RATE * seconds));
  for (let i = 0; i < samples.length; i++) {
    samples[i] = 0.1 * Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE);
  }
  return encodeMp3Mono(samples, SAMPLE_RATE);
};

test("indexes frames and reports total duration close to source", () => {
  const mp3 = makeMp3(10);
  const index = indexMp3Frames(mp3);

  expect(index.frames.length).toBeGreaterThan(0);
  // Frame-quantized, so allow a small tolerance.
  expect(index.totalDurationSec).toBeGreaterThan(9.8);
  expect(index.totalDurationSec).toBeLessThan(10.2);
});

test("frames carry monotonically increasing start times", () => {
  const index = indexMp3Frames(makeMp3(3));
  for (let i = 1; i < index.frames.length; i++) {
    expect(index.frames[i].startSec).toBeGreaterThan(index.frames[i - 1].startSec);
  }
});

test("slicing a time range yields a smaller, valid, re-indexable MP3", () => {
  const mp3 = makeMp3(10);
  const index = indexMp3Frames(mp3);

  const slice = sliceMp3ByTime(mp3, index, 2, 5); // ~3s window
  expect(slice.byteLength).toBeLessThan(mp3.byteLength);

  const sliceIndex = indexMp3Frames(slice);
  expect(sliceIndex.totalDurationSec).toBeGreaterThan(2.8);
  expect(sliceIndex.totalDurationSec).toBeLessThan(3.4); // includes edge frames
});

test("slice covering the whole range ~ equals the source duration", () => {
  const mp3 = makeMp3(4);
  const index = indexMp3Frames(mp3);

  const slice = sliceMp3ByTime(mp3, index, 0, index.totalDurationSec);
  const sliceIndex = indexMp3Frames(slice);

  expect(sliceIndex.totalDurationSec).toBeCloseTo(index.totalDurationSec, 1);
});

test("throws when no frames fall in the requested range", () => {
  const mp3 = makeMp3(2);
  const index = indexMp3Frames(mp3);

  expect(() => sliceMp3ByTime(mp3, index, 100, 110)).toThrow();
});
