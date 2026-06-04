import { AddTaskCard } from "@/components/dashboard/calendar/task-cards/add-task-card";
import { ChecklistTaskCard } from "@/components/dashboard/calendar/task-cards/checklist-task-card";
import { DesignTaskCard } from "@/components/dashboard/calendar/task-cards/design-task-card";
import { MeetingTaskCard } from "@/components/dashboard/calendar/task-cards/meeting-task-card";
import { ProjectTaskCard } from "@/components/dashboard/calendar/task-cards/project-task-card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  calendarDays,
  calendarPlacements,
  timeSlots,
} from "@/lib/dashboard/data";

const taskCards = {
  meeting: MeetingTaskCard,
  project: ProjectTaskCard,
  design: DesignTaskCard,
  add: AddTaskCard,
  checklist: ChecklistTaskCard,
} as const;

export function CalendarGrid() {
  return (
    <div className="rounded-2xl border border-border/60 bg-[#1a1b1f]/80 dark:bg-[#1a1b1f]/90">
      <div
        className="grid min-h-[420px] min-w-[760px]"
        style={{
          gridTemplateColumns: `52px repeat(${calendarDays.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${timeSlots.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="border-b border-border/60 bg-muted/20 p-2" />
        {calendarDays.map((day, index) => (
          <div
            key={day.date}
            className="border-b border-l border-border/60 bg-muted/20 p-2 text-center"
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            <Label className="block text-base font-semibold">{day.date}</Label>
            <span className="text-[11px] text-muted-foreground">/{day.day}</span>
          </div>
        ))}
        {timeSlots.map((time, rowIndex) => (
          <TimeLabel key={time} time={time} rowIndex={rowIndex} />
        ))}
        {calendarPlacements.map((placement) => {
          const Card = taskCards[placement.id];
          return (
            <div
              key={placement.id}
              className="min-h-0 overflow-hidden border-b border-l border-border/60 p-1.5"
              style={{
                gridColumn: placement.col + 2,
                gridRow: `${placement.row + 2} / span ${placement.rowSpan}`,
              }}
            >
              <Card />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeLabel({ time, rowIndex }: { time: string; rowIndex: number }) {
  const isCurrent = time === "12:00";

  return (
    <div
      className={cn(
        "flex items-start border-b border-border/60 px-2 pt-2 text-[11px]",
        isCurrent ? "font-semibold text-sky-400" : "text-muted-foreground"
      )}
      style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
    >
      {time}
    </div>
  );
}
