import { Search, Star } from "lucide-react";

export function SidebarSearch() {
  return (
    <div className="px-3 pb-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
        <input
          defaultValue="Redesign App"
          className="h-9 w-full rounded-2xl border-0 bg-[#0e0f13] pl-8.5 pr-9 text-[13px] text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          readOnly
        />
        <Star className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 fill-amber-400 text-amber-400" />
      </div>
    </div>
  );
}
