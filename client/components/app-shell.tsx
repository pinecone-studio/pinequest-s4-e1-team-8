"use client";

import { MeetingChannelPresenceProvider } from "@/app/meeting/components/meeting-channel-presence-provider";
import { MeetingSessionProvider } from "@/app/meeting/components/meeting-session-provider";
import { DashboardSidebar } from "@/components/sidebar/sidebar";
import { UserSync } from "@/components/user-sync";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import { usePathname } from "next/navigation";

const AuthSetup = () => {
  useClientApiAuth();
  return null;
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const hideSidebar =
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/invite/");

  return (
    <MeetingChannelPresenceProvider>
      <MeetingSessionProvider>
        <div className="flex min-h-screen bg-background">
          <AuthSetup />
          <UserSync />
          {hideSidebar ? null : <DashboardSidebar />}
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </MeetingSessionProvider>
    </MeetingChannelPresenceProvider>
  );
};
