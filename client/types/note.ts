import type { AppUser } from "./user";

export type Note = {
  id: string;
  title: string;
  date: string;
  owner: AppUser;
  team: string;
  summary: string;
  docUrl: string;
  content: string[];
};
