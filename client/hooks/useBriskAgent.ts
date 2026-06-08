"use client";

import {
  runBriskAgent,
  type BriskAgentSuccessResponse,
  type BriskErrorCode,
  type RunBriskAgentParams,
} from "@/lib/api/agent";
import { syncClerkUser } from "@/lib/api/users";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";

export function useBriskAgent() {
  const { getToken, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
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
        if (!isSignedIn || !userLoaded || !user) {
          throw new Error("You must be signed in to generate project tasks.");
        }

        const email = user.primaryEmailAddress?.emailAddress?.trim();
        const name = user.fullName?.trim() || user.firstName?.trim() || email;
        if (!email || !name) {
          throw new Error("Your Clerk profile is missing a name or email.");
        }

        await syncClerkUser({
          clerkId: user.id,
          email,
          name,
          avatarUrl: user.imageUrl ?? null,
        });

        const token = await getToken({ skipCache: true });
        if (!token) {
          throw new Error("Unable to obtain an authentication token.");
        }

        const response = await runBriskAgent(params, token);

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
    [getToken, isSignedIn, user, userLoaded],
  );

  return { run, isLoading, error, errorCode, result };
}
