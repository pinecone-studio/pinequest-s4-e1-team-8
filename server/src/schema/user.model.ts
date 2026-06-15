import { relations } from "drizzle-orm";
import { users } from "../db/schema";
import { meetings } from "./meeting.model";

export { users };

export const usersRelations = relations(users, ({ many }) => ({
  meetings: many(meetings),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
