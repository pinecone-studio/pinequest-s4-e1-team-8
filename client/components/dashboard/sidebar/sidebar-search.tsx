import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Star } from "lucide-react";

export function SidebarSearch() {
  return (
    <div className="px-4 pb-3">
      <Label htmlFor="sidebar-search" className="sr-only">
        Search sidebar
      </Label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="sidebar-search"
          defaultValue="Redesign App"
          className="h-10 rounded-2xl border-sidebar-border bg-background/50 pl-9 pr-9 dark:bg-secondary"
        />
        <Star className="absolute top-1/2 right-3 size-4 -translate-y-1/2 fill-amber-400 text-amber-700 dark:text-amber-400" />
      </div>
    </div>
  );
}
