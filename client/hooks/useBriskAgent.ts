"use client";

import {
  runBriskAgent,
  type BriskAgentResponse,
} from "@/lib/api/agent";
import { useCallback, useState } from "react";

export function useBriskAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriskAgentResponse | null>(null);

  const run = useCallback(
    async (projectId: string, inputMessage: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await runBriskAgent({ projectId, inputMessage });
        setResult(response);
        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Agent request failed.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { run, isLoading, error, result };
}
