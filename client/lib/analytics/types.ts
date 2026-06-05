export type AnalyticsSummary = {
  total: number;
  blocked: number;
  avgProgress: number;
  byStatus: {
    backlog: number;
    todo: number;
    in_progress: number;
    done: number;
  };
  bySource: {
    github: number;
    asana: number;
    internal: number;
  };
};

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

export type WeeklyDay = {
  date: string;
  label: string;
  completed: number;
  started: number;
};

export type AnalyticsWeekly = {
  days: WeeklyDay[];
  totals: {
    completed: number;
    started: number;
  };
};

export type WeeklySummaryResponse = {
  summary: string;
  totals: AnalyticsWeekly["totals"];
};
