import type { Bindings } from "../common/types";

export function resolveGenerativeGroqKey(bindings: Bindings): string | undefined {
  return (
    bindings.GROQ_GENERATIVE_API_KEY?.trim() ||
    bindings.GROQ_API_KEY?.trim() ||
    undefined
  );
}

export function resolveMeetingGroqKey(bindings: Bindings): string | undefined {
  return (
    bindings.GROQ_MEETING_API_KEY?.trim() ||
    bindings.GROQ_API_KEY?.trim() ||
    undefined
  );
}
