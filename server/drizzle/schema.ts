import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const d1Migrations = sqliteTable("d1_migrations", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  appliedAt: numeric("applied_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("workspaces_slug_unique").on(table.slug)],
);

export const members = sqliteTable("members", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  role: text().default("MEMBER").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const projects = sqliteTable(
  "projects",
  {
    id: text().primaryKey().notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    ownerId: text("owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    timezone: text(),
    githubConnected: integer("github_connected").default(0).notNull(),
    asanaConnected: integer("asana_connected").default(0).notNull(),
    isGithubDisconnected: integer("is_github_disconnected")
      .default(0)
      .notNull(),
    isAsanaDisconnected: integer("is_asana_disconnected").default(0).notNull(),
    inviteToken: text("invite_token"),
  },
  (table) => [
    uniqueIndex("projects_invite_token_unique").on(table.inviteToken),
  ],
);

export const subTeamMembers = sqliteTable("sub_team_members", {
  id: text().primaryKey().notNull(),
  subTeamId: text("sub_team_id")
    .notNull()
    .references(() => subTeams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
});

export const subTeams = sqliteTable("sub_teams", {
  id: text().primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text().notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text().primaryKey().notNull(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  subTeamId: text("sub_team_id").references(() => subTeams.id, {
    onDelete: "set null",
  }),
  assigneeId: text("assignee_id").references(() => users.id, {
    onDelete: "set null",
  }),
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
  githubRepoId: integer("github_repo_id"),
  githubNodeId: text("github_node_id"),
  githubNumber: integer("github_number"),
  sequenceOrder: integer("sequence_order").default(0).notNull(),
  dependencyTaskIdsJson: text("dependency_task_ids_json")
    .default("[]")
    .notNull(),
  dependenciesJson: text("dependencies_json").default("[]").notNull(),
  syncState: text("sync_state"),
  boardColumn: text("board_column"),
});

export const aiConversations = sqliteTable("ai_conversations", {
  id: text().primaryKey().notNull(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const aiMessages = sqliteTable("ai_messages", {
  id: text().primaryKey().notNull(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => aiConversations.id, { onDelete: "cascade" }),
  sender: text().notNull(),
  content: text().notNull(),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable(
  "users",
  {
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
  ],
);

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
  participantNames: text("participant_names"),
});

export const syncMappings = sqliteTable("sync_mappings", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  githubRepoId: text("github_repo_id").notNull(),
  asanaProjectGid: text("asana_project_gid").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const usersTable = sqliteTable(
  "users_table",
  {
    id: integer().primaryKey({ autoIncrement: true }).notNull(),
    role: text(),
    name: text(),
    email: text(),
    password: text(),
    age: integer(),
    tel: text(),
  },
  (table) => [uniqueIndex("users_table_email_unique").on(table.email)],
);

export const githubInstallations = sqliteTable(
  "github_installations",
  {
    id: text().primaryKey().notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    installationId: integer("installation_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type").notNull(),
    repositorySelection: text("repository_selection"),
    suspendedAt: integer("suspended_at"),
    installedByUserId: text("installed_by_user_id").references(() => users.id),
    installationToken: text("installation_token"),
    installationTokenExpiresAt: integer("installation_token_expires_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("github_installations_installation_id_unique").on(
      table.installationId,
    ),
  ],
);

export const githubRepositories = sqliteTable(
  "github_repositories",
  {
    id: text().primaryKey().notNull(),
    installationId: text("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    githubRepoId: integer("github_repo_id").notNull(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch"),
    private: integer("private").default(0).notNull(),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("github_repositories_installation_repo").on(
      table.installationId,
      table.githubRepoId,
    ),
  ],
);

export const githubUserAuthorizations = sqliteTable(
  "github_user_authorizations",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    githubUserId: integer("github_user_id"),
    githubLogin: text("github_login"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("github_user_authorizations_user_id_unique").on(table.userId),
  ],
);

export const githubSyncedItems = sqliteTable(
  "github_synced_items",
  {
    id: text().primaryKey().notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    githubRepoId: integer("github_repo_id").notNull(),
    githubNodeId: text("github_node_id").notNull(),
    itemType: text("item_type").notNull(),
    githubNumber: integer("github_number").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("github_synced_items_repo_node").on(
      table.githubRepoId,
      table.githubNodeId,
    ),
  ],
);

export const activityEvents = sqliteTable("activity_events", {
  id: text().primaryKey().notNull(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  actorLogin: text("actor_login"),
  eventType: text("event_type").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const githubIntegrations = sqliteTable(
  "github_integrations",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    githubLogin: text("github_login"),
    repoOwner: text("repo_owner"),
    repoName: text("repo_name"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    githubProjectId: text("github_project_id"),
  },
  (table) => [
    uniqueIndex("github_integrations_user_id_unique").on(table.userId),
  ],
);

export const asanaIntegrations = sqliteTable(
  "asana_integrations",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: integer("token_expires_at"),
    asanaUserGid: text("asana_user_gid"),
    asanaUserName: text("asana_user_name"),
    asanaUserEmail: text("asana_user_email"),
    workspaceGid: text("workspace_gid"),
    projectGid: text("project_gid"),
    projectName: text("project_name"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("asana_integrations_user_id_unique").on(table.userId),
  ],
);

export const projectCollaborators = sqliteTable("project_collaborators", {
  id: text().primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  email: text().notNull(),
  role: text().notNull(),
  createdAt: integer("created_at").notNull(),
});

export const analyticsMetrics = sqliteTable("analytics_metrics", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  cycleMetricsJson: text("cycle_metrics_json").notNull(),
  matrixJson: text("matrix_json").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const reportSnapshots = sqliteTable("report_snapshots", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  content: text().notNull(),
  contextJson: text("context_json").notNull(),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

export const projectRisks = sqliteTable(
  "project_risks",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    severity: text().notNull(),
    metricsJson: text("metrics_json").notNull(),
    evaluationJson: text("evaluation_json").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("project_risks_project_id_unique").on(table.projectId),
  ],
);

export const inviteTokens = sqliteTable(
  "invite_tokens",
  {
    id: text().primaryKey().notNull(),
    token: text().notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("invite_tokens_token_unique").on(table.token)],
);

export const milestones = sqliteTable("milestones", {
  id: text().primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text().notNull(),
  description: text(),
  dueDate: text("due_date"),
  sequenceOrder: integer("sequence_order").default(0).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
