export type CreateLeanMilestoneInput = {
  title: string;
  description?: string;
  dueDate?: string;
};

export type CreateLeanProjectInput = {
  name: string;
  description?: string;
  workspaceId?: string;
  timezone?: string;
  /** Days until the invite expires. Defaults to 14. */
  inviteExpiresInDays?: number;
  milestones: CreateLeanMilestoneInput[];
};

export type CreateLeanProjectResult = {
  projectId: string;
  inviteToken: string;
  inviteLink: string;
  expiresAt: string;
  milestones: Array<{
    id: string;
    title: string;
    sequenceOrder: number;
  }>;
};
