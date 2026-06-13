import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  MicIcon,
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
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
