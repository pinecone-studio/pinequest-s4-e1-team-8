import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { workspaces } from "./workspace.model";
import { projects } from "./project.model";
import { subTeams } from "./sub-team.model";
import { users } from "./user.model";

export const taskStatusEnum = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
] as const;
export type TaskStatus = (typeof taskStatusEnum)[number];

export const taskPriorityEnum = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof taskPriorityEnum)[number];

/** Matches task page tabs in client/components/tasks/task-list.tsx */
export const taskSourceEnum = ["github", "asana", "internal"] as const;
export type TaskSource = (typeof taskSourceEnum)[number];

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  subTeamId: text("sub_team_id").references(() => subTeams.id, {
    onDelete: "set null",
  }),
  assigneeId: text("assignee_id").references(() => users.id, {
    onDelete: "set null",
  }),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: taskStatusEnum }).notNull().default("BACKLOG"),
  priority: text("priority", { enum: taskPriorityEnum })
    .notNull()
    .default("MEDIUM"),
  source: text("source", { enum: taskSourceEnum }).notNull().default("internal"),
  tool: text("tool"),
  dueDate: text("due_date"),
  progress: integer("progress").notNull().default(0),
  blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
  doneCount: integer("done_count").notNull().default(0),
  blockedCount: integer("blocked_count").notNull().default(0),
  timeLeft: text("time_left"),
  /** JSON array of members, e.g. [{"initials":"MG","avatarUrl":"https://..."}] */
  membersJson: text("members_json").notNull().default("[]"),
  sequenceOrder: integer("sequence_order").notNull().default(0),
  dependencyTaskIdsJson: text("dependency_task_ids_json").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  subTeam: one(subTeams, {
    fields: [tasks.subTeamId],
    references: [subTeams.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
