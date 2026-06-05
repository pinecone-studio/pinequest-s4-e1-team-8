import { relations } from "drizzle-orm";
import { users, syncMappings } from "../db/schema";
import { members } from "./member.model";
import { subTeamMembers } from "./sub-team.model";
import { tasks } from "./task.model";
import { aiConversations } from "./ai.model";

export { users };

export const usersRelations = relations(users, ({ many }) => ({
  members: many(members),
  subTeamMembers: many(subTeamMembers),
  assignedTasks: many(tasks),
  aiConversations: many(aiConversations),
  syncMappings: many(syncMappings),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
