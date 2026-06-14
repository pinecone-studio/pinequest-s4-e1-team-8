"use client";

import { useUser } from "@clerk/nextjs";

type WelcomeHeaderProps = {
  todayLabel: string;
};

export function WelcomeHeader({ todayLabel }: WelcomeHeaderProps) {
  const { user } = useUser();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Hello{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome to Brisk, your personal meeting assistant · {todayLabel}
      </p>
    </div>
  );
}
