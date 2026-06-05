"use client";

import { useAuth } from "@clerk/nextjs";

const DEV_USER_ID = "user_wr";

export function useGithubUserId() {
  const { userId, isLoaded } = useAuth();
  return {
    userId: userId ?? DEV_USER_ID,
    isLoaded,
    isDevFallback: !userId,
  };
}
