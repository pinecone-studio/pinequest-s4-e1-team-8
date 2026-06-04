import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

export function DesignTaskCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#8b5cf6] p-2.5 text-white shadow-sm">
      <Label className="text-[11px] font-semibold leading-tight">
        3d Design Orzano Cotton
      </Label>
      <p className="text-[10px] opacity-80">10:45 – 14:15</p>
      <div className="my-2 flex min-h-0 flex-1 items-center justify-center rounded-xl bg-violet-400/30">
        <div className="size-16 rounded-full bg-gradient-to-br from-violet-200 via-violet-400 to-violet-800 shadow-inner" />
      </div>
      <AvatarGroup className="mb-1.5">
        {["D", "E"].map((initial) => (
          <Avatar key={initial} size="sm">
            <AvatarFallback className="bg-violet-800 text-[10px] text-white">
              {initial}
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <a href="#" className="flex items-center gap-1 text-[10px] underline opacity-85">
        <FileText className="size-3" />
        Final Edit.CAD
      </a>
    </div>
  );
}
