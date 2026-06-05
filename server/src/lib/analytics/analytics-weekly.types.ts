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
