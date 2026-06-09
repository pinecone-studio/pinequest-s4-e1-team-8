export type TeamRole = "Manager" | "Developer" | "Designer";

export interface TeamMember {
  email: string;
  name: string;
  role: TeamRole;
}

export type ScopedMilestone = {
  title: string;
  tasks: string[];
  isApproved: boolean;
};

export interface OnboardingData {
  projectId: string;
  workspaceId: string;
  projectName: string;
  description: string;
  timezone: string;
  members: TeamMember[];
  githubConnected: boolean;
  asanaConnected: boolean;
  isGithubDisconnected: boolean;
  isAsanaDisconnected: boolean;
  aiGoals: string;
  scopedMilestones?: ScopedMilestone[];
}

export type UserProject = OnboardingData & {
  id: string;
  createdAt: string;
};

export type UserProjectsProfile = {
  activeProjectId: string | null;
  projects: UserProject[];
};
