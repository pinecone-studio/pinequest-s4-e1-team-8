import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";
import { users } from "./user.model";
import { workspaces } from "./workspace.model";

export const riskSeverityEnum = ["Low", "Medium", "High", "Critical"] as const;
export type RiskSeverity = (typeof riskSeverityEnum)[number];

export const projectRisks = sqliteTable("project_risks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  severity: text("severity", { enum: riskSeverityEnum }).notNull(),
  metricsJson: text("metrics_json").notNull(),
  evaluationJson: text("evaluation_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const projectRisksRelations = relations(projectRisks, ({ one }) => ({
  user: one(users, {
    fields: [projectRisks.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [projectRisks.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [projectRisks.workspaceId],
    references: [workspaces.id],
  }),
}));

export type ProjectRisk = typeof projectRisks.$inferSelect;
export type NewProjectRisk = typeof projectRisks.$inferInsert;
