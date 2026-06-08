import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { workspaces } from "./workspace.model";
import { subTeams } from "./sub-team.model";
import { tasks } from "./task.model";
import { projectCollaborators } from "./project-collaborator.model";
import { users } from "./user.model";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  timezone: text("timezone"),
  githubConnected: integer("github_connected", { mode: "boolean" })
    .notNull()
    .default(false),
  asanaConnected: integer("asana_connected", { mode: "boolean" })
    .notNull()
    .default(false),
  isGithubDisconnected: integer("is_github_disconnected", { mode: "boolean" })
    .notNull()
    .default(false),
  isAsanaDisconnected: integer("is_asana_disconnected", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  subTeams: many(subTeams),
  tasks: many(tasks),
  collaborators: many(projectCollaborators),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
