"use client";

import { MeetingChannelPresenceProvider } from "@/app/meeting/components/meeting-channel-presence-provider";
import { DashboardSidebar } from "@/components/sidebar/sidebar";
import { UserSync } from "@/components/user-sync";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";

const AuthSetup = () => {
  useClientApiAuth();
  return null;
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <MeetingChannelPresenceProvider>
      <div className="flex min-h-screen bg-[#121212]">
        <AuthSetup />
        <UserSync />
        <DashboardSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </MeetingChannelPresenceProvider>
  );
};
