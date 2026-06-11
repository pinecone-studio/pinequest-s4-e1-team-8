import { SidebarNav } from "@/components/dashboard/sidebar/sidebar-nav";
import { SidebarProfile } from "@/components/dashboard/sidebar/sidebar-profile";
import { SidebarSearch } from "@/components/dashboard/sidebar/sidebar-search";
import { SidebarThemeToggle } from "@/components/dashboard/sidebar/sidebar-theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Bookmark, Clock, FileText, Wallet } from "lucide-react";

const utilityIcons = [
  { icon: FileText, label: "Documents" },
  { icon: Clock, label: "Time" },
  { icon: Wallet, label: "Billing" },
  { icon: Bookmark, label: "Saved" },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 flex min-h-screen w-[280px] shrink-0 flex-col self-start border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarProfile />
      <SidebarSearch />
      <Separator className="bg-border/40" />
      <SidebarNav />
      <div className="mt-auto space-y-3 p-3">
        <div className="flex items-center justify-between px-1">
          {utilityIcons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
        <SidebarThemeToggle />
      </div>
    </aside>
  );
}
