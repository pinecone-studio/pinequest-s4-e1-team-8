"use client";

import { useUser } from "@clerk/nextjs";

type WelcomeHeaderProps = {
  todayLabel: string;
};

export function WelcomeHeader({ todayLabel }: WelcomeHeaderProps) {
  const { user } = useUser();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -top-16 right-0 size-64 rounded-full bg-primary/10 blur-3xl" />
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {todayLabel} · Here is what&apos;s happening across your workspace today.
      </p>
    </div>
  );
}
