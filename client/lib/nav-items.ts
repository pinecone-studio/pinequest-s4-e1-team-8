import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  MicIcon,
  NotebookTextIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Meetings", href: "/meetings", icon: CalendarDaysIcon },
  { label: "Recordings", href: "/recordings", icon: MicIcon },
  { label: "Notes", href: "/notes", icon: NotebookTextIcon },
  { label: "Teams", href: "/teams", icon: UsersIcon },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
