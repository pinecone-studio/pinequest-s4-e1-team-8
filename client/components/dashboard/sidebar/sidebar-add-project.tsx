import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function SidebarAddProject() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/30 p-3 text-center dark:bg-[#121318]/80">
      <Button
        size="icon"
        className="mx-auto mb-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-700"
        aria-label="Add new project"
      >
        <Plus className="size-4" />
      </Button>
      <Label className="block text-xs font-medium">Add New Project</Label>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Or use invite link</p>
    </div>
  );
}
