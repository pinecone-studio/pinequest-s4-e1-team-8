import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { projects } from "./project.model";

export const projectResources = sqliteTable("project_resources", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectResourcesRelations = relations(projectResources, ({ one }) => ({
  project: one(projects, {
    fields: [projectResources.projectId],
    references: [projects.id],
  }),
}));

export type ProjectResource = typeof projectResources.$inferSelect;
export type NewProjectResource = typeof projectResources.$inferInsert;
