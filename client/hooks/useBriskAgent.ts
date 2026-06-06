"use client";

import {
  runBriskAgent,
  type BriskAgentSuccessResponse,
  type BriskErrorCode,
  type RunBriskAgentParams,
} from "@/lib/api/agent";
import { useCallback, useState } from "react";

export function useBriskAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<BriskErrorCode | null>(null);
  const [result, setResult] = useState<BriskAgentSuccessResponse | null>(null);

  const run = useCallback(
    async (params: RunBriskAgentParams): Promise<BriskAgentSuccessResponse> => {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const response = await runBriskAgent(params);

        if (!response.success) {
          const message =
            response.error || "Project generation failed. Please refine your goal and try again.";
          setError(message);
          setErrorCode(response.code);
          throw new Error(message);
        }

        setResult(response);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent request failed.";
        setError((prev) => prev ?? message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { run, isLoading, error, errorCode, result };
}
