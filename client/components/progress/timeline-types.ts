export type TimelineSource = "github" | "asana" | "internal";

export type TimelineMember = {
  initials: string;
  avatarUrl?: string;
};

export type TimelineItem = {
  id: string;
  source: TimelineSource;
  title: string;
  status: string;
  progress: number;
  start: Date;
  end: Date;
  blocked: boolean;
  url?: string;
  meta?: string;
  members: TimelineMember[];
};

export type TimelineScale = "week" | "month" | "quarter";

export const timelineScales: { value: TimelineScale; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

export const scaleDayWidth: Record<TimelineScale, number> = {
  week: 34,
  month: 11,
  quarter: 4,
};

export const timelineSources: TimelineSource[] = ["github", "asana", "internal"];

export const sourceMeta: Record<
  TimelineSource,
  {
    label: string;
    group: string;
    dotClass: string;
    trackClass: string;
    fillClass: string;
    chipActiveClass: string;
  }
> = {
  github: {
    label: "GitHub issues",
    group: "Developing",
    dotClass: "bg-violet-500",
    trackClass: "bg-violet-500/15 ring-violet-500/30",
    fillClass: "bg-violet-500",
    chipActiveClass: "border-violet-500/40 bg-violet-500/15 text-violet-200",
  },
  asana: {
    label: "Asana",
    group: "Normal",
    dotClass: "bg-rose-500",
    trackClass: "bg-rose-500/15 ring-rose-500/30",
    fillClass: "bg-rose-500",
    chipActiveClass: "border-rose-500/40 bg-rose-500/15 text-rose-200",
  },
  internal: {
    label: "Tasks",
    group: "Normal",
    dotClass: "bg-sky-500",
    trackClass: "bg-sky-500/15 ring-sky-500/30",
    fillClass: "bg-sky-500",
    chipActiveClass: "border-sky-500/40 bg-sky-500/15 text-sky-200",
  },
};
