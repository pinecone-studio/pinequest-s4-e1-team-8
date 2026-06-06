import { clientApi } from "@/app/lib/client-api";

export type SyncedUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export async function syncClerkUser(input: {
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}): Promise<SyncedUser> {
  const { data } = await clientApi.post<{ user: SyncedUser }>("/users/sync", input);
  return data.user;
}
