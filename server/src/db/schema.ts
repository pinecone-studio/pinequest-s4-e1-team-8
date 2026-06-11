import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  encryptedGithubToken: text("encrypted_github_token"),
  encryptedAsanaToken: text("encrypted_asana_token"),
  encryptedGoogleAccessToken: text("encrypted_google_access_token"),
  encryptedGoogleRefreshToken: text("encrypted_google_refresh_token"),
  googleTokenExpiry: integer("google_token_expiry"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const syncMappings = sqliteTable("sync_mappings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  githubRepoId: text("github_repo_id").notNull(),
  asanaProjectGid: text("asana_project_gid").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const syncMappingsRelations = relations(syncMappings, ({ one }) => ({
  user: one(users, {
    fields: [syncMappings.userId],
    references: [users.id],
  }),
}));

export type SyncMapping = typeof syncMappings.$inferSelect;
export type NewSyncMapping = typeof syncMappings.$inferInsert;
