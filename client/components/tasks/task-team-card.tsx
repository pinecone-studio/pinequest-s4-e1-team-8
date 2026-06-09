import {
  getProgressColor,
  getTeamVisual,
  memberColors,
  type TeamSummary,
} from "@/components/tasks/task-team-utils";
import { cn } from "@/lib/utils";
import {
  Clock,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Plus,
} from "lucide-react";

type TaskTeamCardProps = {
  team: TeamSummary;
  active: boolean;
  onClick: () => void;
};

export function TaskTeamCard({ team, active, onClick }: TaskTeamCardProps) {
  const visual = getTeamVisual(team.name);
  const Icon = visual.icon;
  const progress = Math.min(Math.max(team.progress, 0), 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full max-w-[220px] rounded-lg border bg-card p-3 text-left shadow-sm transition-colors",
        active
          ? "border-violet-500 border-dashed ring-1 ring-violet-500/40"
          : "border-border/70 hover:border-violet-400/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full",
              visual.bgClass,
            )}
          >
            <Icon className={cn("size-3.5", visual.iconClass)} />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug">
              {team.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {team.tool}
            </p>
          </div>
        </div>
        <span className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground">
          <MoreVertical className="size-3.5" />
        </span>
      </div>

      <div className="mt-2.5 flex items-center">
        {team.members.slice(0, 3).map((member, index) => (
          <span
            key={`${team.name}-${member}-${index}`}
            className={cn(
              "grid size-6 place-items-center rounded-full border-2 border-card text-[10px] font-semibold text-white border-elevated",
              index > 0 && "-ml-1.5",
              memberColors[index % memberColors.length],
            )}
          >
            {member}
          </span>
        ))}
        <span className="-ml-1 grid size-6 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
          <Plus className="size-3" />
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium">
          <span className="text-muted-foreground">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex max-w-[58%] items-center gap-1 truncate rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">{team.timeLeft}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="size-3 text-violet-700 dark:text-violet-400" />
            {team.doneCount}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Paperclip className="size-3 text-orange-400" />
            {team.blockedCount}
          </span>
        </div>
      </div>
    </button>
  );
}
