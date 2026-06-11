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
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!clerkId) {
      setInternalUserId(DEV_USER_ID);
      setSyncError(null);
      setSyncing(false);
      return;
    }

    const email = user?.primaryEmailAddress?.emailAddress?.trim();
    const name = user?.fullName?.trim() || user?.username?.trim();
    if (!email || !name) {
      setInternalUserId(null);
      setSyncError("Your profile is missing an email or display name.");
      setSyncing(false);
      return;
    }

    let cancelled = false;
    setSyncing(true);
    setSyncError(null);
    setInternalUserId(null);

    syncClerkUser({
      clerkId,
      email,
      name,
      avatarUrl: user?.imageUrl ?? null,
    })
      .then((synced) => {
        if (!cancelled) {
          setInternalUserId(synced.id);
          setSyncError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInternalUserId(null);
          setSyncError("Could not sync your account. Refresh the page and try again.");
        }
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
    syncError,
    syncing,
  };
}
