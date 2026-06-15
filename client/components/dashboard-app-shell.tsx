"use client";

import { MeetingProviders } from "@/app/meeting/components/meeting-providers";
import { ClientAuthSetup } from "@/components/client-auth-setup";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProviders>
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
    </MeetingProviders>
  );
}
