import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";
import { users } from "./user.model";

export const projectIntegrations = sqliteTable("project_integrations", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  githubRepoOwner: text("github_repo_owner"),
  githubRepoName: text("github_repo_name"),
  githubRepoId: text("github_repo_id").unique(),
  githubProjectId: text("github_project_id").unique(),
  githubProjectTitle: text("github_project_title"),
  asanaWorkspaceGid: text("asana_workspace_gid"),
  asanaProjectGid: text("asana_project_gid").unique(),
  asanaProjectName: text("asana_project_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const projectIntegrationsRelations = relations(
  projectIntegrations,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectIntegrations.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectIntegrations.userId],
      references: [users.id],
    }),
  }),
);

export type ProjectIntegration = typeof projectIntegrations.$inferSelect;
export type NewProjectIntegration = typeof projectIntegrations.$inferInsert;
