export type TeamRole = "Manager" | "Developer" | "Viewer";

export interface TeamMember {
  email: string;
  name: string;
  role: TeamRole;
}

export interface OnboardingData {
  projectName: string;
  description: string;
  timezone: string;
  members: TeamMember[];
  githubConnected: boolean;
  asanaConnected: boolean;
  aiGoals: string;
}
