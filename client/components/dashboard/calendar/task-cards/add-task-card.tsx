import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function AddTaskCard() {
  return (
    <Button
      variant="outline"
      className="flex h-full min-h-0 w-full flex-col gap-1 rounded-2xl border-2 border-dashed border-emerald-400/70 bg-emerald-500/5 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/10 dark:text-emerald-300"
    >
      <span className="flex size-8 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-100 dark:bg-emerald-500/10">
        <Plus className="size-4" />
      </span>
      <Label className="text-[11px] font-medium">Add New Task</Label>
    </Button>
  );
}
