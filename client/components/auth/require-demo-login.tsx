"use client";

import { hasDemoSession } from "@/lib/demo-session";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function RequireDemoLogin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasDemoSession()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
