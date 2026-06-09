"use client";

import { syncClerkUser } from "@/lib/api/users";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const DEV_USER_ID = "user_wr";

/** Resolves the Brisk DB user id from the signed-in Clerk user. */
export function useInternalUserId() {
  const { userId: clerkId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!clerkId) {
      setInternalUserId(DEV_USER_ID);
      setSyncing(false);
      return;
    }

    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    const name = user?.fullName?.trim() || user?.username?.trim();
    if (!email || !name) return;

    let cancelled = false;
    setSyncing(true);

    syncClerkUser({
      clerkId,
      email,
      name,
      avatarUrl: user?.imageUrl ?? null,
    })
      .then((synced) => {
        if (!cancelled) setInternalUserId(synced.id);
      })
      .catch(() => {
        if (!cancelled) setInternalUserId(DEV_USER_ID);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    authLoaded,
    userLoaded,
    clerkId,
    user?.id,
    user?.primaryEmailAddress?.emailAddress,
    user?.fullName,
    user?.username,
    user?.imageUrl,
  ]);

  const isLoaded = authLoaded && userLoaded && !syncing && internalUserId !== null;

  return {
    userId: internalUserId ?? DEV_USER_ID,
    isLoaded,
    isDevFallback: !clerkId,
  };
}
