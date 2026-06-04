export const sidebarNavItems = [
  { label: "Dashboard",     href: "/dashboard", dot: true },
  { label: "Project Board", href: "#"                     },
  { label: "Schedule",      href: "#", subtitle: "June, 28, 2023", badge: 2 },
  { label: "Activities",    href: "#", badge: "New" },
  { label: "Inbox",         href: "#", count: 24 },
] as const;

export const projectTree = [
  { label: "Edu Design Landing", level: 0, icon: "square",   badge: 4  },
  { label: "Team Project",       level: 0, icon: "circle",   expanded: true },
  { label: "Website",            level: 1, icon: "dot" },
  { label: "Apps",               level: 1, icon: "dot",      active: true },
  { label: "Dribbble Shot",      level: 2, icon: "dot" },
  { label: "Tripple Website",    level: 0, icon: "triangle" },
  { label: "Social App",         level: 0, icon: "circle",   badge: 3  },
] as const;

export const calendarDays = [
  { date: "26", day: "Mon" },
  { date: "27", day: "Tue" },
  { date: "28", day: "Wed" },
  { date: "29", day: "Thu" },
] as const;

export const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00"] as const;

export const calendarPlacements = [
  { id: "meeting", row: 0, col: 0, rowSpan: 2 },
  { id: "project", row: 2, col: 0, rowSpan: 2 },
  { id: "design", row: 0, col: 1, rowSpan: 5 },
  { id: "add", row: 1, col: 2, rowSpan: 2 },
  { id: "checklist", row: 0, col: 3, rowSpan: 5 },
] as const;

export const teamAvatars = [
  { initials: "WR", color: "bg-violet-500" },
  { initials: "MR", color: "bg-sky-500" },
  { initials: "SJ", color: "bg-amber-500" },
  { initials: "AK", color: "bg-pink-500" },
] as const;

export const checklistItems = [
  { label: "Research", done: true },
  { label: "Wireframe", done: true },
  { label: "UI Design", done: true },
  { label: "Prototype", done: false },
  { label: "A/B Test", done: false },
] as const;

export const toolbarColors = [
  "bg-amber-400",
  "bg-pink-400",
  "bg-sky-400",
  "bg-violet-500",
  "bg-emerald-400",
] as const;

export const chartDays = ["M", "T", "W", "T", "F", "S", "S"] as const;

export const chartBars = [
  { doing: 28, progress: 42, completed: 30 },
  { doing: 18, progress: 52, completed: 30 },
  { doing: 32, progress: 38, completed: 30 },
  { doing: 22, progress: 48, completed: 30 },
  { doing: 36, progress: 34, completed: 30 },
  { doing: 14, progress: 36, completed: 50 },
  { doing: 20, progress: 30, completed: 50 },
] as const;

export const lastProject = {
  title: "Smart Home UI Ux",
  members: ["S", "W", "M"],
  comments: ["Sarah", "Wilson"],
} as const;
