import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";

export const inviteTokens = sqliteTable(
  "invite_tokens",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("invite_tokens_token_unique").on(table.token)],
);

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  project: one(projects, {
    fields: [inviteTokens.projectId],
    references: [projects.id],
  }),
}));

export type InviteToken = typeof inviteTokens.$inferSelect;
export type NewInviteToken = typeof inviteTokens.$inferInsert;
