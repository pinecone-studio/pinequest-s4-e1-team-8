export type ProvisionProjectIntegrations = {
  githubRepoOwner: string;
  githubRepoName: string;
  githubRepoId: string;
  githubProjectId: string;
  githubProjectTitle: string;
  asanaWorkspaceGid: string;
  asanaProjectGid: string;
  asanaProjectName: string;
};

export type ProvisionProjectInput = {
  name: string;
  description?: string;
  workspaceId?: string;
  integrations: ProvisionProjectIntegrations;
};

export type ProvisionProjectResult = {
  projectId: string;
  workspaceId: string;
  name: string;
  inviteToken: string;
  integration: ProvisionProjectIntegrations;
};
