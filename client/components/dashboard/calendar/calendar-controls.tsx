"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarControls() {
  const [view, setView] = useState("card");

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Website / Apps / <span className="text-foreground">Dribbble Shot</span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={[view]}
          onValueChange={(next) => {
            const selected = next[next.length - 1];
            selected && setView(selected);
          }}
          variant="outline"
          className="rounded-xl border-border/60 bg-muted/20 p-0.5"
        >
          <ToggleGroupItem value="card" className="rounded-lg px-3">
            Card
          </ToggleGroupItem>
          <ToggleGroupItem value="blocks" className="rounded-lg px-3">
            Blocks
          </ToggleGroupItem>
          <ToggleGroupItem value="table" className="rounded-lg px-3">
            Table
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            1 Weeks
            <ChevronDown className="size-3.5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-4" />
            </Button>
            <Label className="text-sm font-medium">June, 2023</Label>
            <Button variant="ghost" size="icon-sm">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Avatar size="sm">
              <AvatarFallback className="bg-emerald-500 text-[10px] text-white">
                W
              </AvatarFallback>
            </Avatar>
            30 minutes ago
          </div>
        </div>
      </div>
    </div>
  );
}
