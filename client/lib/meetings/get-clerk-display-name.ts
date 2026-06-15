import type { useUser } from "@clerk/nextjs";

export const getClerkDisplayName = (user: ReturnType<typeof useUser>["user"]) => {
  if (!user) return "";

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.trim() ||
    ""
  );
};
