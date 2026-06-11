import { relations } from "drizzle-orm/relations";
import { workspaces, members, users, projects, subTeamMembers, subTeams, tasks, aiConversations, aiMessages, syncMappings, githubInstallations, githubRepositories, githubUserAuthorizations, githubSyncedItems, activityEvents, githubIntegrations, asanaIntegrations, projectCollaborators, analyticsMetrics, reportSnapshots, projectRisks } from "./schema";

export const membersRelations = relations(members, ({one}) => ({
	workspace: one(workspaces, {
		fields: [members.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	members: many(members),
	projects: many(projects),
	tasks: many(tasks),
	aiConversations: many(aiConversations),
	githubInstallations: many(githubInstallations),
	githubRepositories: many(githubRepositories),
	githubSyncedItems: many(githubSyncedItems),
	activityEvents: many(activityEvents),
	analyticsMetrics: many(analyticsMetrics),
	reportSnapshots: many(reportSnapshots),
	projectRisks: many(projectRisks),
}));

export const usersRelations = relations(users, ({many}) => ({
	members: many(members),
	projects: many(projects),
	subTeamMembers: many(subTeamMembers),
	tasks: many(tasks),
	aiConversations: many(aiConversations),
	syncMappings: many(syncMappings),
	githubInstallations: many(githubInstallations),
	githubUserAuthorizations: many(githubUserAuthorizations),
	githubIntegrations: many(githubIntegrations),
	asanaIntegrations: many(asanaIntegrations),
	analyticsMetrics: many(analyticsMetrics),
	reportSnapshots: many(reportSnapshots),
	projectRisks: many(projectRisks),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	workspace: one(workspaces, {
		fields: [projects.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [projects.ownerId],
		references: [users.id]
	}),
	subTeams: many(subTeams),
	tasks: many(tasks),
	githubRepositories: many(githubRepositories),
	githubSyncedItems: many(githubSyncedItems),
	activityEvents: many(activityEvents),
	projectCollaborators: many(projectCollaborators),
	analyticsMetrics: many(analyticsMetrics),
	reportSnapshots: many(reportSnapshots),
	projectRisks: many(projectRisks),
}));

export const subTeamMembersRelations = relations(subTeamMembers, ({one}) => ({
	user: one(users, {
		fields: [subTeamMembers.userId],
		references: [users.id]
	}),
	subTeam: one(subTeams, {
		fields: [subTeamMembers.subTeamId],
		references: [subTeams.id]
	}),
}));

export const subTeamsRelations = relations(subTeams, ({one, many}) => ({
	subTeamMembers: many(subTeamMembers),
	project: one(projects, {
		fields: [subTeams.projectId],
		references: [projects.id]
	}),
	tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	user: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id]
	}),
	subTeam: one(subTeams, {
		fields: [tasks.subTeamId],
		references: [subTeams.id]
	}),
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	workspace: one(workspaces, {
		fields: [tasks.workspaceId],
		references: [workspaces.id]
	}),
	githubSyncedItems: many(githubSyncedItems),
}));

export const aiConversationsRelations = relations(aiConversations, ({one, many}) => ({
	user: one(users, {
		fields: [aiConversations.userId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [aiConversations.workspaceId],
		references: [workspaces.id]
	}),
	aiMessages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({one}) => ({
	aiConversation: one(aiConversations, {
		fields: [aiMessages.conversationId],
		references: [aiConversations.id]
	}),
}));

export const syncMappingsRelations = relations(syncMappings, ({one}) => ({
	user: one(users, {
		fields: [syncMappings.userId],
		references: [users.id]
	}),
}));

export const githubInstallationsRelations = relations(githubInstallations, ({one, many}) => ({
	user: one(users, {
		fields: [githubInstallations.installedByUserId],
		references: [users.id]
	}),
	workspace: one(workspaces, {
		fields: [githubInstallations.workspaceId],
		references: [workspaces.id]
	}),
	githubRepositories: many(githubRepositories),
}));

export const githubRepositoriesRelations = relations(githubRepositories, ({one}) => ({
	project: one(projects, {
		fields: [githubRepositories.projectId],
		references: [projects.id]
	}),
	workspace: one(workspaces, {
		fields: [githubRepositories.workspaceId],
		references: [workspaces.id]
	}),
	githubInstallation: one(githubInstallations, {
		fields: [githubRepositories.installationId],
		references: [githubInstallations.id]
	}),
}));

export const githubUserAuthorizationsRelations = relations(githubUserAuthorizations, ({one}) => ({
	user: one(users, {
		fields: [githubUserAuthorizations.userId],
		references: [users.id]
	}),
}));

export const githubSyncedItemsRelations = relations(githubSyncedItems, ({one}) => ({
	task: one(tasks, {
		fields: [githubSyncedItems.taskId],
		references: [tasks.id]
	}),
	project: one(projects, {
		fields: [githubSyncedItems.projectId],
		references: [projects.id]
	}),
	workspace: one(workspaces, {
		fields: [githubSyncedItems.workspaceId],
		references: [workspaces.id]
	}),
}));

export const activityEventsRelations = relations(activityEvents, ({one}) => ({
	project: one(projects, {
		fields: [activityEvents.projectId],
		references: [projects.id]
	}),
	workspace: one(workspaces, {
		fields: [activityEvents.workspaceId],
		references: [workspaces.id]
	}),
}));

export const githubIntegrationsRelations = relations(githubIntegrations, ({one}) => ({
	user: one(users, {
		fields: [githubIntegrations.userId],
		references: [users.id]
	}),
}));

export const asanaIntegrationsRelations = relations(asanaIntegrations, ({one}) => ({
	user: one(users, {
		fields: [asanaIntegrations.userId],
		references: [users.id]
	}),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({one}) => ({
	project: one(projects, {
		fields: [projectCollaborators.projectId],
		references: [projects.id]
	}),
}));

export const analyticsMetricsRelations = relations(analyticsMetrics, ({one}) => ({
	workspace: one(workspaces, {
		fields: [analyticsMetrics.workspaceId],
		references: [workspaces.id]
	}),
	project: one(projects, {
		fields: [analyticsMetrics.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [analyticsMetrics.userId],
		references: [users.id]
	}),
}));

export const reportSnapshotsRelations = relations(reportSnapshots, ({one}) => ({
	workspace: one(workspaces, {
		fields: [reportSnapshots.workspaceId],
		references: [workspaces.id]
	}),
	project: one(projects, {
		fields: [reportSnapshots.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [reportSnapshots.userId],
		references: [users.id]
	}),
}));

export const projectRisksRelations = relations(projectRisks, ({one}) => ({
	workspace: one(workspaces, {
		fields: [projectRisks.workspaceId],
		references: [workspaces.id]
	}),
	project: one(projects, {
		fields: [projectRisks.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectRisks.userId],
		references: [users.id]
	}),
}));