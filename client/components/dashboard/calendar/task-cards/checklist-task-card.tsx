import { Label } from "@/components/ui/label";
import { ListTodo } from "lucide-react";

export function ChecklistTaskCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#f08cba]/20 p-3 text-center text-[#4a1830] dark:text-white">
      <ListTodo className="size-4 opacity-60" />
      <Label className="text-[11px] font-normal leading-tight text-muted-foreground">
        No checklist tasks yet
      </Label>
    </div>
  );
}
