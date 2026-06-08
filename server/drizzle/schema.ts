import { sqliteTable, AnySQLiteColumn, integer, text, numeric, uniqueIndex, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const d1Migrations = sqliteTable("d1_migrations", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text(),
	appliedAt: numeric("applied_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const workspaces = sqliteTable("workspaces", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("workspaces_slug_unique").on(table.slug),
]);

export const members = sqliteTable("members", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" } ),
	role: text().default("MEMBER").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const projects = sqliteTable("projects", {
	id: text().primaryKey().notNull(),
	workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	description: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const subTeamMembers = sqliteTable("sub_team_members", {
	id: text().primaryKey().notNull(),
	subTeamId: text("sub_team_id").notNull().references(() => subTeams.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").notNull(),
});

export const subTeams = sqliteTable("sub_teams", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	name: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
	id: text().primaryKey().notNull(),
	workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" } ),
	projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	subTeamId: text("sub_team_id").references(() => subTeams.id, { onDelete: "set null" } ),
	assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" } ),
	parentId: text("parent_id"),
	title: text().notNull(),
	description: text(),
	status: text().default("BACKLOG").notNull(),
	priority: text().default("MEDIUM").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	source: text().default("internal").notNull(),
	tool: text(),
	dueDate: text("due_date"),
	progress: integer().default(0).notNull(),
	blocked: integer().default(0).notNull(),
	doneCount: integer("done_count").default(0).notNull(),
	blockedCount: integer("blocked_count").default(0).notNull(),
	timeLeft: text("time_left"),
	membersJson: text("members_json").default("[]").notNull(),
});

export const aiConversations = sqliteTable("ai_conversations", {
	id: text().primaryKey().notNull(),
	workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	title: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const aiMessages = sqliteTable("ai_messages", {
	id: text().primaryKey().notNull(),
	conversationId: text("conversation_id").notNull().references(() => aiConversations.id, { onDelete: "cascade" } ),
	sender: text().notNull(),
	content: text().notNull(),
	createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	clerkId: text("clerk_id").notNull(),
	email: text().notNull(),
	name: text().notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	encryptedGithubToken: text("encrypted_github_token"),
	encryptedAsanaToken: text("encrypted_asana_token"),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
	uniqueIndex("users_clerk_id_unique").on(table.clerkId),
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
});

export const syncMappings = sqliteTable("sync_mappings", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	githubRepoId: text("github_repo_id").notNull(),
	asanaProjectGid: text("asana_project_gid").notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const githubIntegrations = sqliteTable("github_integrations", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	accessToken: text("access_token").notNull(),
	githubLogin: text("github_login"),
	repoOwner: text("repo_owner"),
	repoName: text("repo_name"),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("github_integrations_user_id_unique").on(table.userId),
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
]);

