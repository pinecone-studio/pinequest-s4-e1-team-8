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

export function DashboardAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scrollableMain =
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/") ||
    pathname === "/meeting-summaries";

  return (
    <MeetingChannelPresenceProvider>
      <MeetingSessionProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <AuthSetup />
          <UserSync />
          <DashboardSidebar />
          <main
            className={
              scrollableMain
                ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto"
                : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            }
          >
            {children}
          </main>
        </div>
      </MeetingSessionProvider>
    </MeetingChannelPresenceProvider>
  );
}
