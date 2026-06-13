import { relations } from "drizzle-orm";
import { users, syncMappings } from "../db/schema";
import { members } from "./member.model";
import { subTeamMembers } from "./sub-team.model";
import { tasks } from "./task.model";
import { aiConversations } from "./ai.model";
import { meetings } from "./meeting.model";

export { users };

export const usersRelations = relations(users, ({ many }) => ({
  members: many(members),
  subTeamMembers: many(subTeamMembers),
  assignedTasks: many(tasks),
  aiConversations: many(aiConversations),
  syncMappings: many(syncMappings),
  meetings: many(meetings),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
