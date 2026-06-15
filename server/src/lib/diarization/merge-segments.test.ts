import { test, expect } from "bun:test";
import { mergeSegments, type RawSegment } from "./merge-segments";

test("merges consecutive same-speaker turns within the gap", () => {
  const raw: RawSegment[] = [
    { speaker: "A", startSec: 0, endSec: 3 },
    { speaker: "A", startSec: 3.5, endSec: 6 }, // 0.5s gap → merge
    { speaker: "B", startSec: 6.2, endSec: 10 },
  ];

  const merged = mergeSegments(raw, { padSec: 0, minDurationSec: 0 });

  expect(merged).toHaveLength(2);
  expect(merged[0]).toMatchObject({ speaker: 1, startSec: 0, endSec: 6 });
  expect(merged[1]).toMatchObject({ speaker: 2, startSec: 6.2, endSec: 10 });
});

test("does not merge same speaker across a large gap", () => {
  const raw: RawSegment[] = [
    { speaker: "A", startSec: 0, endSec: 3 },
    { speaker: "A", startSec: 10, endSec: 13 }, // 7s gap → separate
  ];

  const merged = mergeSegments(raw, { padSec: 0, minDurationSec: 0, maxGapSec: 1 });

  expect(merged).toHaveLength(2);
});

test("drops fragments shorter than the minimum duration", () => {
  const raw: RawSegment[] = [
    { speaker: "A", startSec: 0, endSec: 5 },
    { speaker: "B", startSec: 5, endSec: 5.4 }, // 0.4s backchannel → dropped
    { speaker: "A", startSec: 6, endSec: 9 },
  ];

  const merged = mergeSegments(raw, { padSec: 0, minDurationSec: 1 });

  // The dropped "B" never gets a speaker number, so both A turns stay speaker 1.
  expect(merged.map((s) => s.speaker)).toEqual([1, 1]);
});

test("normalizes speaker labels to 1-based appearance order", () => {
  const raw: RawSegment[] = [
    { speaker: "C", startSec: 0, endSec: 3 },
    { speaker: "A", startSec: 3, endSec: 6 },
  ];

  const merged = mergeSegments(raw, { padSec: 0, minDurationSec: 0 });

  expect(merged[0].speaker).toBe(1); // "C" appears first → 1
  expect(merged[1].speaker).toBe(2);
});

test("applies symmetric padding, clamped to bounds", () => {
  const raw: RawSegment[] = [{ speaker: "A", startSec: 0.1, endSec: 5 }];

  const merged = mergeSegments(raw, {
    padSec: 0.2,
    minDurationSec: 0,
    totalDurationSec: 5.1,
  });

  expect(merged[0].startSec).toBe(0); // 0.1 - 0.2 clamped to 0
  expect(merged[0].endSec).toBe(5.1); // 5 + 0.2 clamped to total
});

test("sorts out-of-order input before merging", () => {
  const raw: RawSegment[] = [
    { speaker: "A", startSec: 6, endSec: 9 },
    { speaker: "A", startSec: 0, endSec: 5 },
  ];

  const merged = mergeSegments(raw, { padSec: 0, minDurationSec: 0, maxGapSec: 2 });

  expect(merged).toHaveLength(1);
  expect(merged[0]).toMatchObject({ startSec: 0, endSec: 9 });
});
