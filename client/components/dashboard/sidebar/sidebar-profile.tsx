import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export function SidebarProfile() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar size="lg">
        <AvatarFallback className="bg-violet-600 text-white">W</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-semibold text-sidebar-foreground">
          Walter
        </Label>
        <p className="truncate text-xs text-muted-foreground">Designer Pro+</p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Settings">
        <Settings className="size-4" />
      </Button>
    </div>
  );
}
