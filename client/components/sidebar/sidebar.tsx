import { SidebarAddProject } from "@/components/sidebar/sidebar-add-project";
import { SidebarNav } from "@/components/sidebar/sidebar-nav";
import { SidebarProfile } from "@/components/sidebar/sidebar-profile";
import { SidebarSearch } from "@/components/sidebar/sidebar-search";
import { SidebarThemeToggle } from "@/components/sidebar/sidebar-theme-toggle";
import { Bookmark, CreditCard, FileText, RefreshCw } from "lucide-react";

const utilityIcons = [
  { icon: FileText,   label: "Documents" },
  { icon: RefreshCw,  label: "Sync"      },
  { icon: CreditCard, label: "Billing"   },
  { icon: Bookmark,   label: "Saved"     },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 flex min-h-screen w-[260px] shrink-0 flex-col self-start bg-[#16171b] text-white">
      <SidebarProfile />
      <SidebarSearch />

      <div className="mx-3 h-px bg-white/6" />

      <SidebarNav />

      {/* Onboarding section */}
      <div className="mt-auto space-y-3 px-3 pb-4">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Onboarding
        </p>

        {/* Utility icon row + theme toggle */}
        <div className="flex items-center justify-between px-1">
          {utilityIcons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="flex size-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              <Icon className="size-4" />
            </button>
          ))}
          {/* Spacer then theme toggle inline */}
        </div>

        <SidebarThemeToggle />
        <SidebarAddProject />
      </div>
    </aside>
  );
}
