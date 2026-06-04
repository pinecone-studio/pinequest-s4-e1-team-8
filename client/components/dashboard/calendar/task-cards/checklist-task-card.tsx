import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { checklistItems } from "@/lib/dashboard/data";

export function ChecklistTaskCard() {
  const completed = checklistItems.filter((item) => item.done).length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#f08cba] p-2.5 text-[#4a1830] shadow-sm dark:text-white">
      <Label className="text-[11px] font-semibold leading-tight">
        Redesign Edu Web
      </Label>
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span>Complete: {completed}/5</span>
          <span>Jun 30</span>
        </div>
        <Progress value={(completed / 5) * 100} className="h-1.5 bg-pink-300/40" />
      </div>
      <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {checklistItems.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <Checkbox
              id={item.label}
              checked={item.done}
              className="border-pink-900/20 data-checked:bg-pink-900"
            />
            <Label
              htmlFor={item.label}
              className={`text-[10px] font-normal ${item.done ? "line-through opacity-70" : ""}`}
            >
              {item.label}
            </Label>
          </li>
        ))}
      </ul>
    </div>
  );
}
