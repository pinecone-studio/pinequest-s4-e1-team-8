import { z } from "zod";

const segmentSchema = z.object({
  speakerName: z.string().trim().min(1),
  text: z.string().trim().min(1),
  timestampSeconds: z.number().nonnegative(),
});

const segmentsResponseSchema = z.object({
  segments: z.array(segmentSchema),
});

export type ParsedMeetingTranscriptSegment = z.infer<typeof segmentSchema>;

// Groq returns a raw JSON string shaped like
// { segments: { speakerName, text, timestampSeconds }[] }.
// Parse it defensively since model output can be missing, empty, or malformed.
export const parseMeetingTranscriptSegments = (
  raw: string | null | undefined,
): ParsedMeetingTranscriptSegment[] | null => {
  if (!raw || !raw.trim()) return null;

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = segmentsResponseSchema.safeParse(parsed);

  if (!result.success || result.data.segments.length === 0) return null;

  return result.data.segments;
};
