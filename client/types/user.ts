export type AppUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  initials: string;
  role?: string;
  team?: string;
};
