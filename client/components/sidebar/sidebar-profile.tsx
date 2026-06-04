import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Settings } from "lucide-react";

export function SidebarProfile() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Avatar size="lg">
        <AvatarFallback className="bg-linear-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">
          W
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">Walter</p>
        <p className="text-xs font-medium text-violet-400">Designer Pro+</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Add"
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Settings className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
