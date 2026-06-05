import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.model";

export const githubIntegrations = sqliteTable("github_integrations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  accessToken: text("access_token").notNull(),
  githubLogin: text("github_login"),
  repoOwner: text("repo_owner"),
  repoName: text("repo_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const githubIntegrationsRelations = relations(
  githubIntegrations,
  ({ one }) => ({
    user: one(users, {
      fields: [githubIntegrations.userId],
      references: [users.id],
    }),
  }),
);

export type GithubIntegration = typeof githubIntegrations.$inferSelect;
export type NewGithubIntegration = typeof githubIntegrations.$inferInsert;
