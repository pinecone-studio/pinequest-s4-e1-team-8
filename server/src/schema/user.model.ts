import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { members } from "./member.model";
import { subTeamMembers } from "./sub-team.model";
import { tasks } from "./task.model";
import { aiConversations } from "./ai.model";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  members: many(members),
  subTeamMembers: many(subTeamMembers),
  assignedTasks: many(tasks),
  aiConversations: many(aiConversations),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
