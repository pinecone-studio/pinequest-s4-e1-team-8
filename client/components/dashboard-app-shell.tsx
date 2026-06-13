"use client";

import { MeetingChannelPresenceProvider } from "@/app/meeting/components/meeting-channel-presence-provider";
import { MeetingSessionProvider } from "@/app/meeting/components/meeting-session-provider";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { ClientAuthSetup } from "@/components/client-auth-setup";

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  return (
    <MeetingChannelPresenceProvider>
      <MeetingSessionProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <ClientAuthSetup />
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </MeetingSessionProvider>
    </MeetingChannelPresenceProvider>
  );
}
