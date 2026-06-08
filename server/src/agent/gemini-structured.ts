import type { GenerativeModel } from "@google/generative-ai";

const PRE_REQUEST_DELAY_MS = 750;
const RETRY_DELAYS_MS = [0, 2000, 4000, 8000, 8000, 8000];

function isRetryableGeminiError(error: unknown): boolean {
  const message = String(error);
  return message.includes("503") || message.includes("429") || message.includes("Service Unavailable");
}

export async function generateGeminiJsonText(model: GenerativeModel, input: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, PRE_REQUEST_DELAY_MS));
  let lastError: unknown;
  for (const delayMs of RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      const result = await model.generateContent(input);
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}
