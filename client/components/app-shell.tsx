"use client";

import { DashboardSidebar } from "@/components/sidebar/sidebar";
import { UserSync } from "@/components/user-sync";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";

function AuthSetup() {
  useClientApiAuth();
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      <AuthSetup />
      <UserSync />
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
