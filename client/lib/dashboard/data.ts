export const sidebarNavItems = [
  { label: "Dashboard", href: "/dashboard", dot: true },
  { label: "Tasks", href: "/tasks" },
  { label: "Analytics", href: "/analytics" },
  { label: "Project Board", href: "#", expandable: true },
  { label: "Schedule", href: "#" },
  { label: "Activities", href: "#" },
  { label: "Inbox", href: "#" },
] as const;

export const sidebarWorkflowItems = [
  { label: "Workflow", href: "/workflow" },
] as const;

export const toolbarColors = [
  "bg-amber-400",
  "bg-pink-400",
  "bg-sky-400",
  "bg-violet-500",
  "bg-emerald-400",
] as const;
