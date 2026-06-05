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
