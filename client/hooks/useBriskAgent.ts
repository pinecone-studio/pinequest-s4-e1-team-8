"use client";

import {
  runBriskAgent,
  type BriskAgentResponse,
  type RunBriskAgentParams,
} from "@/lib/api/agent";
import { useCallback, useState } from "react";

export function useBriskAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriskAgentResponse | null>(null);

  const run = useCallback(async (params: RunBriskAgentParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await runBriskAgent(params);
      setResult(response);

      if (!response.success) {
        const message = "Project generation failed. Please refine your goal and try again.";
        setError(message);
        throw new Error(message);
      }

      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Agent request failed.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { run, isLoading, error, result };
}
