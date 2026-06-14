import {
  CalendarDaysIcon,
  HomeIcon,
  MicIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/home", icon: HomeIcon },
  { label: "Meetings", href: "/meetings", icon: CalendarDaysIcon },
  { label: "Recordings", href: "/recordings", icon: MicIcon },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
