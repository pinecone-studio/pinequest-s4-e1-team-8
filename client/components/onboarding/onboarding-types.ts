export type TeamRole = "Manager" | "Developer" | "Viewer";

export interface TeamMember {
  email: string;
  name: string;
  role: TeamRole;
}

export interface OnboardingData {
  projectId: string;
  workspaceId: string;
  projectName: string;
  description: string;
  timezone: string;
  members: TeamMember[];
  githubConnected: boolean;
  asanaConnected: boolean;
  aiGoals: string;
}

export type UserProject = OnboardingData & {
  id: string;
  createdAt: string;
};

export type UserProjectsProfile = {
  activeProjectId: string | null;
  projects: UserProject[];
};
