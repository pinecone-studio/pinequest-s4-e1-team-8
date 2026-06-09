import type { RiskSeverity } from "../../schema/project-risk.model";

export type CapacityRiskMember = {
  userId: string;
  name: string | null;
  subTeamId: string;
  subTeamName: string;
};

export type PastDueMilestone = {
  taskId: string;
  title: string;
  dueDate: string;
  daysOverdue: number;
};

export type OpenBlocker = {
  taskId: string;
  title: string;
  status: string;
  priority: string;
};

export type ProjectRiskMetrics = {
  projectId: string;
  workspaceId: string;
  activeMemberCount: number;
  capacityRisks: CapacityRiskMember[];
  pastDueMilestones: PastDueMilestone[];
  openBlockers: OpenBlocker[];
};

export type RiskBottleneck = {
  bottleneckId: string;
  category: "Capacity" | "Schedule" | "Blocker";
  description: string;
  severity: RiskSeverity;
  recommendation: string;
};

export type ProjectRiskEvaluation = {
  overallSeverity: RiskSeverity;
  bottlenecks: RiskBottleneck[];
};
