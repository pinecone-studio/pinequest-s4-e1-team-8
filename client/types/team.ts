import type { AppUser } from "./user";

export type TeamRole = "Owner" | "Admin" | "Member";

export type TeamMember = {
  user: AppUser;
  role: TeamRole;
};

export type ResourceItem = {
  id: string;
  title: string;
  type: "link" | "doc" | "file";
  url: string;
  addedBy: string;
};

export type ResourceCategory = {
  id: string;
  name: string;
  items: ResourceItem[];
};

export type VoiceRoom = {
  id: string;
  name: string;
  participants: AppUser[];
};

export type TeamGoal = {
  title: string;
  progress: number;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  tag: string;
  members: TeamMember[];
  goal: TeamGoal;
  resources: ResourceCategory[];
  rooms: VoiceRoom[];
  noteIds: string[];
};
