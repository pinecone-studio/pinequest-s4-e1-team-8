import { AsyncLocalStorage } from "node:async_hooks";
import type { Bindings } from "../lib/common/types";

const agentBindingsStorage = new AsyncLocalStorage<Bindings>();

export function runWithAgentBindings<T>(bindings: Bindings, fn: () => T): T {
  return agentBindingsStorage.run(bindings, fn);
}

export function runWithAgentBindingsAsync<T>(
  bindings: Bindings,
  fn: () => Promise<T>,
): Promise<T> {
  return agentBindingsStorage.run(bindings, fn);
}

export function getAgentBindings(): Bindings {
  const bindings = agentBindingsStorage.getStore();
  if (!bindings) {
    throw new Error("Agent bindings are not available for this request.");
  }
  return bindings;
}

export function getGeminiApiKey(): string {
  const key = getAgentBindings().GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return key;
}
