"use client";

import { ClientAuthSetup } from "@/components/client-auth-setup";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const DashboardAppShell = dynamic(
  () =>
    import("@/components/dashboard-app-shell").then((m) => m.DashboardAppShell),
  { ssr: false },
);

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up", "/onboarding"]);

function isAuthRoute(pathname: string) {
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/sign-in/") ||
    pathname.startsWith("/sign-up/") ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/invite/")
  );
}

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

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
