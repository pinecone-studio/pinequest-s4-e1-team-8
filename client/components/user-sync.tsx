"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (syncedRef.current === user.id) return;
    syncedRef.current = user.id;

    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const name = user.fullName ?? user.firstName ?? email;

    fetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        clerkId: user.id,
        name,
        email,
        avatarUrl: user.imageUrl ?? null,
      }),
    }).catch(() => {});
  }, [isLoaded, user]);

  return null;
}
