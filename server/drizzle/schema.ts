import { sqliteTable, AnySQLiteColumn, check, integer, text, numeric, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const d1Migrations = sqliteTable("d1_migrations", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text(),
	appliedAt: numeric("applied_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	check("tasks_check_1", sql`status IN ('todo', 'in_progress', 'done'`),
	check("tasks_check_2", sql`priority IN ('low', 'medium', 'high'`),
]);

export const usersTable = sqliteTable("users_table", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	role: text(),
	name: text(),
	email: text(),
	password: text(),
	age: integer(),
	tel: text(),
},
(table) => [
	uniqueIndex("users_table_email_unique").on(table.email),
	check("tasks_check_1", sql`status IN ('todo', 'in_progress', 'done'`),
	check("tasks_check_2", sql`priority IN ('low', 'medium', 'high'`),
]);

export const tasks = sqliteTable("tasks", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	status: text().default("todo"),
	priority: text().default("medium"),
	blocked: numeric(),
	dueDate: text("due_date"),
},
(table) => [
	check("tasks_check_1", sql`status IN ('todo', 'in_progress', 'done'`),
	check("tasks_check_2", sql`priority IN ('low', 'medium', 'high'`),
]);

export const meetingTranscriptions = sqliteTable("meeting_transcriptions", {
	id: text().primaryKey().notNull(),
	meetingId: text("meeting_id").notNull(),
	roomName: text("room_name").notNull(),
	audioUrl: text("audio_url"),
	egressId: text("egress_id"),
	transcript: text(),
	summary: text(),
	errorMessage: text("error_message"),
	status: text().default("pending").notNull(),
	createdAt: integer("created_at"),
	updatedAt: integer("updated_at"),
	completedAt: integer("completed_at"),
},
(table) => [
	check("tasks_check_1", sql`status IN ('todo', 'in_progress', 'done'`),
	check("tasks_check_2", sql`priority IN ('low', 'medium', 'high'`),
]);

