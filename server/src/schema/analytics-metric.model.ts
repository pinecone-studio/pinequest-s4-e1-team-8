import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";
import { users } from "./user.model";
import { workspaces } from "./workspace.model";

export const analyticsMetrics = sqliteTable("analytics_metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  cycleMetricsJson: text("cycle_metrics_json").notNull(),
  matrixJson: text("matrix_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const analyticsMetricsRelations = relations(analyticsMetrics, ({ one }) => ({
  user: one(users, {
    fields: [analyticsMetrics.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [analyticsMetrics.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [analyticsMetrics.workspaceId],
    references: [workspaces.id],
  }),
}));

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type NewAnalyticsMetric = typeof analyticsMetrics.$inferInsert;
