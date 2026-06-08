"use client";

import { TaskDetailFields } from "@/components/tasks/task-detail-fields";
import { TaskDetailSections } from "@/components/tasks/task-detail-sections";
import { detailTitleClass } from "@/components/tasks/task-detail-ui";
import type { TaskListItem, TaskUpdate } from "@/components/tasks/task-types";

type TaskDetailFormProps = {
  task: TaskListItem;
  onUpdate: (change: TaskUpdate) => void;
};

export function TaskDetailForm({ task, onUpdate }: TaskDetailFormProps) {
  return (
    <>
      <input
        className={detailTitleClass}
        value={task.title}
        placeholder="Task name"
        onChange={(event) => onUpdate({ title: event.target.value })}
      />

      <TaskDetailFields task={task} onUpdate={onUpdate} />

      <TaskDetailSections
        description={task.description ?? ""}
        onDescriptionChange={(value) => onUpdate({ description: value })}
      />
    </>
  );
}
