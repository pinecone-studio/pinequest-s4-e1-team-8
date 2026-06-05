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
        "min-w-[240px] shrink-0 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors dark:bg-[#1f2024]",
        active
          ? "border-violet-500 border-dashed ring-1 ring-violet-500/40"
          : "border-border/70 hover:border-violet-400/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              visual.bgClass,
            )}
          >
            <Icon className={cn("size-4", visual.iconClass)} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{team.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{team.tool}</p>
          </div>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground">
          <MoreVertical className="size-4" />
        </span>
      </div>

      <div className="mt-4 flex items-center">
        {team.members.slice(0, 4).map((member, index) => (
          <span
            key={`${team.name}-${member}-${index}`}
            className={cn(
              "grid size-8 place-items-center rounded-full border-2 border-card text-[11px] font-semibold text-white dark:border-[#1f2024]",
              index > 0 && "-ml-2",
              memberColors[index % memberColors.length],
            )}
          >
            {member}
          </span>
        ))}
        <span className="-ml-1 grid size-8 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
          <Plus className="size-4" />
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-4 text-xs font-medium">
          <span className="text-muted-foreground">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
          <Clock className="size-3.5" />
          {team.timeLeft}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5 text-violet-400" />
            {team.doneCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3.5 text-orange-400" />
            {team.blockedCount}
          </span>
        </div>
      </div>
    </button>
  );
}
