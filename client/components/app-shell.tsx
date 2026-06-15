"use client";

import { MeetingProviders } from "@/app/meeting/components/meeting-providers";
import { ClientAuthSetup } from "@/components/client-auth-setup";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const DashboardAppShell = dynamic(
  () =>
    import("@/components/dashboard-app-shell").then((m) => m.DashboardAppShell),
  { ssr: false },
);

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up"]);

function isAuthRoute(pathname: string) {
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/sign-in/") ||
    pathname.startsWith("/sign-up/") ||
    pathname.startsWith("/invite/")
  );
}

function isFullBleedRoute(pathname: string) {
  return pathname.startsWith("/room/") || pathname === "/meeting";
}

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  if (isAuthRoute(pathname) || isFullBleedRoute(pathname)) {
    const content = (
      <>
        <ClientAuthSetup />
        {children}
      </>
    );

    return pathname === "/meeting" ? (
      <MeetingProviders>{content}</MeetingProviders>
    ) : (
      content
    );
  }

  return <DashboardAppShell>{children}</DashboardAppShell>;
};
