import { relations } from "drizzle-orm/relations";
import { workspaces, members, users, projects, subTeamMembers, subTeams, tasks, aiConversations, aiMessages, syncMappings, githubIntegrations } from "./schema";

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
}));

export const usersRelations = relations(users, ({many}) => ({
	members: many(members),
	subTeamMembers: many(subTeamMembers),
	tasks: many(tasks),
	aiConversations: many(aiConversations),
	syncMappings: many(syncMappings),
	githubIntegrations: many(githubIntegrations),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	workspace: one(workspaces, {
		fields: [projects.workspaceId],
		references: [workspaces.id]
	}),
	subTeams: many(subTeams),
	tasks: many(tasks),
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

export const tasksRelations = relations(tasks, ({one}) => ({
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

export const githubIntegrationsRelations = relations(githubIntegrations, ({one}) => ({
	user: one(users, {
		fields: [githubIntegrations.userId],
		references: [users.id]
	}),
}));