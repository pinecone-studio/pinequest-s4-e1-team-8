import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.model";

export const asanaIntegrations = sqliteTable("asana_integrations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  asanaUserGid: text("asana_user_gid"),
  asanaUserName: text("asana_user_name"),
  asanaUserEmail: text("asana_user_email"),
  workspaceGid: text("workspace_gid"),
  projectGid: text("project_gid"),
  projectName: text("project_name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const asanaIntegrationsRelations = relations(
  asanaIntegrations,
  ({ one }) => ({
    user: one(users, {
      fields: [asanaIntegrations.userId],
      references: [users.id],
    }),
  }),
);

export type AsanaIntegration = typeof asanaIntegrations.$inferSelect;
export type NewAsanaIntegration = typeof asanaIntegrations.$inferInsert;
