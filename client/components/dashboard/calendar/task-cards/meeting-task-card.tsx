import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

export function MeetingTaskCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#f5d565] p-2.5 text-[#3d3418] shadow-sm">
      <Label className="text-[11px] font-semibold leading-tight">
        Design System Team Meeting
      </Label>
      <p className="mt-0.5 text-[10px] opacity-75">10:15 – 12:15</p>
      <AvatarGroup className="my-1.5">
        {["A", "B", "C"].map((initial) => (
          <Avatar key={initial} size="sm">
            <AvatarFallback className="bg-[#3d3418]/15 text-[10px]">
              {initial}
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="truncate text-[9px] underline opacity-70">
          meet.google.com/abc-def
        </span>
        <Button
          size="xs"
          className="rounded-full bg-[#3d3418] text-[#f5d565] hover:bg-[#3d3418]/90"
        >
          <Video className="size-3" />
          Join
        </Button>
      </div>
    </div>
  );
}
