"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { DemoLoginForm } from "@/components/auth/demo-login-form";
import { hasDemoSession } from "@/lib/demo-session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasDemoSession()) {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <AuthShell>
      <DemoLoginForm />
    </AuthShell>
  );
}
