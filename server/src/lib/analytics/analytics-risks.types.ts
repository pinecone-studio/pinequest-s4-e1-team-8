export type RiskLevel = "high" | "medium" | "low";

export type AnalyticsRiskItem = {
  id: string;
  title: string;
  team: string;
  reason: string;
  level: RiskLevel;
};

export type AnalyticsRisks = {
  blocked: number;
  dueThisWeek: number;
  urgent: number;
  items: AnalyticsRiskItem[];
};
