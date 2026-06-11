import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "../db/schema";

export const onboardingSessionStatuses = [
  "INTERVIEWING",
  "CANVAS_EDIT",
  "CONCLUDED",
] as const;

export type OnboardingSessionStatus = (typeof onboardingSessionStatuses)[number];

export const onboardingSessions = sqliteTable("onboarding_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  transcript: text("transcript"),
  tddLayoutState: text("tdd_layout_state"),
  discoveryState: text("discovery_state"),
  planningBrief: text("planning_brief"),
  status: text("status").notNull().$type<OnboardingSessionStatus>().default("INTERVIEWING"),
  docUrl: text("doc_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const onboardingSessionsRelations = relations(onboardingSessions, ({ one }) => ({
  user: one(users, {
    fields: [onboardingSessions.userId],
    references: [users.id],
  }),
}));

export type OnboardingSession = typeof onboardingSessions.$inferSelect;
export type NewOnboardingSession = typeof onboardingSessions.$inferInsert;
