import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";
import { users } from "./user.model";
import { workspaces } from "./workspace.model";

export const reportSnapshots = sqliteTable("report_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  contextJson: text("context_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const reportSnapshotsRelations = relations(reportSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [reportSnapshots.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [reportSnapshots.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [reportSnapshots.workspaceId],
    references: [workspaces.id],
  }),
}));

export type ReportSnapshot = typeof reportSnapshots.$inferSelect;
export type NewReportSnapshot = typeof reportSnapshots.$inferInsert;
