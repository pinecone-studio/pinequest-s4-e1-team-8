"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  detailInputClass,
  detailTextareaClass,
  SectionHeading,
} from "./task-detail-ui";

type TaskDetailSectionsProps = {
  description: string;
  onDescriptionChange: (value: string) => void;
};

export function TaskDetailSections({
  description,
  onDescriptionChange,
}: TaskDetailSectionsProps) {
  return (
    <>
      <section className="border-b border-border/50 py-8">
        <SectionHeading title="Description" />
        <textarea
          className={cn(detailTextareaClass, "mt-4")}
          placeholder="What is this task about?"
          rows={5}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </section>

      <section className="border-b border-border/50 py-8">
        <SectionHeading
          title="Subtasks"
          action={
            <button
              type="button"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              aria-label="Add subtask"
            >
              <Plus className="size-4" />
            </button>
          }
        />
        <textarea
          className={cn(detailTextareaClass, "mt-5 min-h-24")}
          placeholder="Add subtask"
          rows={4}
        />
      </section>

      <section className="border-b border-border/50 py-8">
        <SectionHeading
          title="Attachments"
          action={
            <button
              type="button"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              aria-label="Add attachment"
            >
              <Plus className="size-4" />
            </button>
          }
        />
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="border-b-2 border-foreground pb-2 text-sm font-medium"
            >
              Comments
            </button>
            <button
              type="button"
              className="pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              All activity
            </button>
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ↑ Oldest
          </button>
        </div>

        <div className="mt-6 flex items-start gap-4">
          <Avatar className="size-7">
            <AvatarFallback className="bg-violet-500 text-[10px] text-white">
              TS
            </AvatarFallback>
          </Avatar>
          <p className="pt-1 text-sm text-muted-foreground">
            You created this task · just now
          </p>
        </div>

        <div className="mt-8 flex items-start gap-4">
          <Avatar className="size-7">
            <AvatarFallback className="bg-violet-500 text-[10px] text-white">
              TS
            </AvatarFallback>
          </Avatar>
          <input
            className={cn(detailInputClass, "min-h-10 flex-1")}
            placeholder="Add a comment"
          />
        </div>
      </section>
    </>
  );
}
