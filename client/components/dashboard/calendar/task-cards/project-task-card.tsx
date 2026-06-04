import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

export function ProjectTaskCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#8ecdf5] p-2.5 text-[#123047] shadow-sm">
      <Label className="text-[11px] font-semibold leading-tight">
        Wireframe SmartHome App
      </Label>
      <a
        href="#"
        className="mt-1.5 flex items-center gap-1 text-[10px] underline opacity-80"
      >
        <FileText className="size-3" />
        Project Brief.doc
      </a>
      <div className="mt-1.5 flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-[#123047] text-[10px] text-white">
            MR
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] font-medium">Monica Rose</span>
      </div>
      <p className="mt-auto text-[9px] leading-relaxed opacity-75">
        Create low-fidelity wireframes for the smart home dashboard flow.
      </p>
    </div>
  );
}
