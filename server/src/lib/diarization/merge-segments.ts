// Turns raw diarization output into a small, Chimege-friendly set of cut points.
//
// Diarization APIs emit one utterance per speaker turn, so a meeting can produce
// 100+ segments. Sending each to Chimege separately (upload + up to 30 polls)
// multiplies STT calls and blows rate limits. We therefore:
//   1. merge consecutive turns by the SAME speaker (incl. tiny gaps between them),
//   2. drop fragments shorter than a floor (backchannels: "тийм", "за", laughs),
//   3. pad each kept segment slightly so words aren't clipped at the cut.
// This typically cuts the chunk count 3–5x with negligible accuracy loss.

export interface RawSegment {
  speaker: string; // diarization label, e.g. "A", "B"
  startSec: number;
  endSec: number;
}

export interface MergedSegment {
  index: number; // 1-based order of appearance
  speaker: number; // normalized 1-based speaker number
  startSec: number;
  endSec: number;
}

export interface MergeOptions {
  // Merge two same-speaker turns separated by a gap no larger than this.
  maxGapSec?: number;
  // Drop merged segments shorter than this (after merging).
  minDurationSec?: number;
  // Symmetric padding added to each kept segment (clamped to [0, totalDurationSec]).
  padSec?: number;
  // Hard upper bound for clamping the trailing pad; usually the recording length.
  totalDurationSec?: number;
}

const DEFAULTS = {
  maxGapSec: 1.0,
  minDurationSec: 1.0,
  padSec: 0.2,
};

export const mergeSegments = (
  raw: RawSegment[],
  options: MergeOptions = {},
): MergedSegment[] => {
  const maxGapSec = options.maxGapSec ?? DEFAULTS.maxGapSec;
  const minDurationSec = options.minDurationSec ?? DEFAULTS.minDurationSec;
  const padSec = options.padSec ?? DEFAULTS.padSec;
  const totalDurationSec = options.totalDurationSec ?? Infinity;

  // Diarization output should already be chronological, but don't trust it.
  const sorted = [...raw].sort((a, b) => a.startSec - b.startSec);

  // 1. Merge consecutive same-speaker turns within maxGapSec.
  const merged: RawSegment[] = [];
  for (const seg of sorted) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.speaker === seg.speaker &&
      seg.startSec - last.endSec <= maxGapSec
    ) {
      last.endSec = Math.max(last.endSec, seg.endSec);
    } else {
      merged.push({ ...seg });
    }
  }

  // 2 + 3. Drop too-short segments, apply padding, normalize speaker labels.
  const speakerNumbers = new Map<string, number>();
  const numberFor = (label: string): number => {
    if (!speakerNumbers.has(label)) speakerNumbers.set(label, speakerNumbers.size + 1);
    return speakerNumbers.get(label)!;
  };

  const result: MergedSegment[] = [];
  for (const seg of merged) {
    if (seg.endSec - seg.startSec < minDurationSec) continue;

    result.push({
      index: result.length + 1,
      speaker: numberFor(seg.speaker),
      startSec: Math.max(0, seg.startSec - padSec),
      endSec: Math.min(totalDurationSec, seg.endSec + padSec),
    });
  }

  return result;
};
