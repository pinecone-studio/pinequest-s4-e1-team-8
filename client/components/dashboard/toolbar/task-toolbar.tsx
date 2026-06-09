import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toolbarColors } from "@/lib/dashboard/data";
import {
  Edit3,
  ImagePlus,
  Layers,
  Share2,
  SlidersHorizontal,
  Trash2,
  Type,
} from "lucide-react";

export function TaskToolbar() {
  return (
    <div className="mx-6 mb-2 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-3 py-2 shadow-sm">
      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
        <SlidersHorizontal className="size-3.5" />
        Filters
      </Button>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Color</Label>
        <div className="flex gap-1.5">
          {toolbarColors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label="Task color"
              className={`size-5 rounded-full ring-2 ring-transparent transition hover:ring-foreground/20 ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        {[Edit3, Share2, Type, Layers].map((Icon, index) => (
          <Button key={index} variant="ghost" size="icon-sm" className="rounded-xl">
            <Icon className="size-4" />
          </Button>
        ))}
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <ImagePlus className="size-3.5" />
          Add Image
        </Button>
        <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl">
          <Trash2 className="size-3.5" />
          Deleted
        </Button>
      </div>
    </div>
  );
}
