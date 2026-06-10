"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function RequireSignIn({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (!isSignedIn) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
  }, [isLoaded, isSignedIn, router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
