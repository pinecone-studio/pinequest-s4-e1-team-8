"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

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

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return <DashboardAppShell>{children}</DashboardAppShell>;
};
