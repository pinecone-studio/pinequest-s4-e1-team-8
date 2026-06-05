import type { TaskSource } from "@/components/tasks/task-types";

export const taskSources: TaskSource[] = ["github", "asana", "internal"];

export const sourceLabels: Record<TaskSource, string> = {
  github: "GitHub",
  asana: "Asana",
  internal: "Internal",
};
