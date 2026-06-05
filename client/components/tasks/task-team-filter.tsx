import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";

type TaskTeamFilterProps = {
  activeTeam: string | null;
  tasks: TaskListItem[];
  onChange: (team: string | null) => void;
};

export function TaskTeamFilter({
  activeTeam,
  tasks,
  onChange,
}: TaskTeamFilterProps) {
  const teams = Array.from(new Set(tasks.map(getTaskTeam)));

  if (teams.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Teams
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <TeamButton active={activeTeam === null} onClick={() => onChange(null)}>
          All teams
        </TeamButton>
        {teams.map((team) => (
          <TeamButton
            key={team}
            active={activeTeam === team}
            onClick={() => onChange(team)}
          >
            {team}
          </TeamButton>
        ))}
      </div>
    </section>
  );
}

function TeamButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-violet-500 bg-violet-500 text-white"
          : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
