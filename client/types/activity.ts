import type { AppUser } from "./user";

export type ActivityItem = {
  id: string;
  user: AppUser;
  action: string;
  target: string;
  team: string;
  timestamp: string;
};
