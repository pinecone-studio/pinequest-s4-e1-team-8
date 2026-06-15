"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { MeetingTaskItem } from "../hooks/use-meeting-tasks";
import type { MeetingSessionParticipant } from "./meeting-session-provider";

export type AssigneeSuggestion = {
  email?: string;
  identity: string;
  name: string;
};

type MeetingTasksCardProps = {
  onAddTask: (input: {
    assigneeIdentity?: string;
    assigneeName?: string;
    label: string;
  }) => void;
  onToggleTask: (id: string) => void;
  participants: MeetingSessionParticipant[];
  tasks: MeetingTaskItem[];
};

const ASSIGNEE_TRIGGER_PATTERN = /@([^\s@]*)$/;

const getAssigneeEmail = (identity: string) => {
  const stableId = identity.split("__")[1];
  return stableId && stableId.includes("@") ? stableId : undefined;
};

export const MeetingTasksCard = ({
  onAddTask,
  onToggleTask,
  participants,
  tasks,
}: MeetingTasksCardProps) => {
  const [draft, setDraft] = useState("");
  const [assigneeQuery, setAssigneeQuery] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<AssigneeSuggestion | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const completedCount = tasks.filter((task) => task.completed).length;

  const suggestions = useMemo<AssigneeSuggestion[]>(() => {
    if (assigneeQuery === null) return [];

    const query = assigneeQuery.toLowerCase();

    return participants
      .map((participant) => ({
        email: getAssigneeEmail(participant.identity),
        identity: participant.identity,
        name: participant.displayName,
      }))
      .filter((suggestion) => suggestion.name.toLowerCase().includes(query));
  }, [assigneeQuery, participants]);

  const handleDraftChange = (value: string) => {
    setDraft(value);

    if (selectedAssignee && !value.includes(`@${selectedAssignee.name}`)) {
      setSelectedAssignee(null);
    }

    const match = value.match(ASSIGNEE_TRIGGER_PATTERN);
    setAssigneeQuery(match ? match[1] : null);
  };

  const handleSelectAssignee = (suggestion: AssigneeSuggestion) => {
    setDraft((current) => current.replace(ASSIGNEE_TRIGGER_PATTERN, `@${suggestion.name} `));
    setSelectedAssignee(suggestion);
    setAssigneeQuery(null);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const label = draft
      .replace(ASSIGNEE_TRIGGER_PATTERN, "")
      .replace(selectedAssignee ? `@${selectedAssignee.name}` : "", "")
      .trim();

    if (!label) return;

    onAddTask({
      assigneeIdentity: selectedAssignee?.identity,
      assigneeName: selectedAssignee?.name,
      label,
    });

    setDraft("");
    setSelectedAssignee(null);
    setAssigneeQuery(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (suggestions.length) {
        handleSelectAssignee(suggestions[0]);
        return;
      }

      handleSubmit();
      return;
    }

    if (event.key === "Escape") {
      setAssigneeQuery(null);
    }
  };

  const canSubmit = Boolean(
    draft.replace(ASSIGNEE_TRIGGER_PATTERN, "").trim(),
  );

  return (
    <section className="relative flex flex-col gap-3 rounded-2xl bg-zinc-950 p-4 text-white transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tasks List</h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70">
          {completedCount}/{tasks.length} done
        </span>
      </div>

      <ul className="flex max-h-48 flex-col gap-2.5 overflow-y-auto">
        {tasks.length ? (
          tasks.map((task) => (
            <li className="flex items-center gap-3" key={task.id}>
              <button
                aria-pressed={task.completed}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  task.completed
                    ? "border-emerald-400 bg-emerald-400 text-zinc-950"
                    : "border-white/25 text-transparent hover:border-white/50",
                )}
                onClick={() => onToggleTask(task.id)}
                type="button"
              >
                <Check className="size-3" />
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  task.completed ? "text-white/40 line-through" : "text-white/90",
                )}
              >
                {task.label}
                {task.assigneeName ? (
                  <span className="ml-1.5 text-xs text-white/40">
                    @{task.assigneeName}
                  </span>
                ) : null}
              </span>
              {task.dueLabel ? (
                <span className="shrink-0 text-xs text-white/40">{task.dueLabel}</span>
              ) : null}
            </li>
          ))
        ) : (
          <li className="text-sm text-white/40">No tasks yet</li>
        )}
      </ul>

      <div className="relative">
        {suggestions.length ? (
          <div className="absolute bottom-full left-0 z-10 mb-2 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl transition-all duration-200">
            {suggestions.map((suggestion) => (
              <button
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-all duration-200 hover:bg-white/10"
                key={suggestion.identity}
                onClick={() => handleSelectAssignee(suggestion)}
                type="button"
              >
                <span className="text-sm font-medium text-white">{suggestion.name}</span>
                {suggestion.email ? (
                  <span className="text-xs text-white/40">{suggestion.email}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all duration-200 focus-within:border-white/20">
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task, @ to assign"
            ref={inputRef}
            type="text"
            value={draft}
          />
          <button
            aria-label="Add task"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-zinc-950 transition-all duration-200 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canSubmit}
            onClick={handleSubmit}
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
