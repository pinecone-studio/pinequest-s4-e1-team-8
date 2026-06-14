import { z } from "zod";
import type { StandaloneScriptSegment } from "../../schema/recordings.schema";

// Accept loose shapes from the model, then clean up below. A single blank
// string used to fail the whole array (and discard an otherwise-valid
// analysis), so we filter rather than reject.
const analysisSchema = z.object({
  speakerCount: z.number().int().nonnegative().catch(0),
  keyPoints: z.array(z.string()).catch([]),
  segments: z
    .array(
      z.object({
        speakerLabel: z.string(),
        text: z.string(),
      }),
    )
    .catch([]),
});

export type ParsedStandaloneAnalysis = {
  speakerCount: number;
  keyPoints: string[];
  segments: StandaloneScriptSegment[];
};

// Gemini returns a raw JSON string shaped like
// { speakerCount: number, keyPoints: string[], segments: { speakerLabel, text }[] }.
// Parse it defensively since model output can be missing, empty, or malformed.
export const parseStandaloneAnalysis = (
  raw: string | null | undefined,
): ParsedStandaloneAnalysis | null => {
  if (!raw || !raw.trim()) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = analysisSchema.safeParse(parsed);

  if (!result.success) return null;

  const keyPoints = result.data.keyPoints
    .map((point) => point.trim())
    .filter((point) => point.length > 0);
  const segments = result.data.segments
    .map((segment) => ({
      speakerLabel: segment.speakerLabel.trim(),
      text: segment.text.trim(),
    }))
    .filter((segment) => segment.speakerLabel.length > 0 && segment.text.length > 0);

  if (keyPoints.length === 0 && segments.length === 0) return null;

  // Trust the segment-derived speaker count when the model under/over-reports.
  const distinctLabels = new Set(segments.map((segment) => segment.speakerLabel))
    .size;

  return {
    keyPoints,
    segments,
    speakerCount: Math.max(result.data.speakerCount, distinctLabels),
  };
};
