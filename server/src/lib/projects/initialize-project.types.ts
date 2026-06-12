export type CollaboratorRole = "Developer" | "Designer" | "Manager";

export type InitializeProjectStep1 = {
  projectName: string;
  description: string;
  timezone: string;
};

export type InitializeProjectStep2 = {
  collaborators: Array<{
    email: string;
    role: CollaboratorRole;
  }>;
};

export type InitializeProjectStep3 = {
  githubConnected: boolean;
  asanaConnected: boolean;
  isGithubDisconnected: boolean;
  isAsanaDisconnected: boolean;
};

export type InitializeProjectMilestoneDraft = {
  title: string;
  tasks: string[];
  isApproved: boolean;
};

export type InitializeProjectStep4 = {
  milestoneDrafts: InitializeProjectMilestoneDraft[];
};

export type InitializeProjectPayload = {
  step1: InitializeProjectStep1;
  step2: InitializeProjectStep2;
  step3: InitializeProjectStep3;
  step4: InitializeProjectStep4;
  workspaceId?: string;
  projectId?: string;
  onboardingSessionId?: string;
  aiGoals?: string;
  tddLayoutState?: unknown;
  tddConfirmed?: boolean;
  essentialResources?: Array<{ name: string; url: string }>;
};

export type InitializeProjectValidationResult =
  | { ok: true; data: InitializeProjectPayload }
  | { ok: false; error: string; field: string };
