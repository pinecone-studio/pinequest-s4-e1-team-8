"use client";

import { ClientAuthSetup } from "@/components/client-auth-setup";
import dynamic from "next/dynamic";
import { clearVoiceVerified } from "@/lib/voice/session";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DashboardAppShell = dynamic(
  () =>
    import("@/components/dashboard-app-shell").then((m) => m.DashboardAppShell),
  { ssr: false },
);

const AUTH_ROUTES = new Set(["/login", "/onboarding"]);

function isAuthRoute(pathname: string) {
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/invite/")
  );
}

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      clearVoiceVerified();
    }
  }, [isLoaded, isSignedIn]);

  if (isAuthRoute(pathname)) {
    return (
      <>
        <ClientAuthSetup />
        {children}
      </>
    );
  }

  return <DashboardAppShell>{children}</DashboardAppShell>;
};
