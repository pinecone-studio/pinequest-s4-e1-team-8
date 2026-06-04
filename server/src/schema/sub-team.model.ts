import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";
import { users } from "./user.model";
import { tasks } from "./task.model";

export const subTeams = sqliteTable("sub_teams", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const subTeamMembers = sqliteTable("sub_team_members", {
  id: text("id").primaryKey(),
  subTeamId: text("sub_team_id")
    .notNull()
    .references(() => subTeams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const subTeamsRelations = relations(subTeams, ({ one, many }) => ({
  project: one(projects, {
    fields: [subTeams.projectId],
    references: [projects.id],
  }),
  subTeamMembers: many(subTeamMembers),
  tasks: many(tasks),
}));

export const subTeamMembersRelations = relations(subTeamMembers, ({ one }) => ({
  subTeam: one(subTeams, {
    fields: [subTeamMembers.subTeamId],
    references: [subTeams.id],
  }),
  user: one(users, {
    fields: [subTeamMembers.userId],
    references: [users.id],
  }),
}));

export type SubTeam = typeof subTeams.$inferSelect;
export type NewSubTeam = typeof subTeams.$inferInsert;
export type SubTeamMember = typeof subTeamMembers.$inferSelect;
export type NewSubTeamMember = typeof subTeamMembers.$inferInsert;
