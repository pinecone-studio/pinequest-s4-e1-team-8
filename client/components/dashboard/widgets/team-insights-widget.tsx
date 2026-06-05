"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

export function TeamInsightsWidget() {
  const { loaded, hasProject } = useOnboardingData();

  if (!loaded) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
        <CardHeader className="px-4 pb-1">
          <div className="h-5 w-32 animate-pulse rounded bg-muted/50" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="h-48 animate-pulse rounded-2xl bg-muted/30" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="items-center pb-1">
        <CardTitle className="text-base">Team Insights</CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 text-violet-500"
            disabled
          >
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-8 text-center">
          <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
            <BarChart3 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No insights yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasProject
                ? "Team activity and progress will show up here once tasks are added and work begins."
                : "Set up your project and add tasks to start tracking team activity."}
            </p>
          </div>
          {!hasProject ? (
            <Link
              href="/onboarding"
              className="text-xs font-medium text-violet-500 hover:text-violet-400"
            >
              Complete onboarding
            </Link>
          ) : (
            <Link
              href="/tasks"
              className="text-xs font-medium text-violet-500 hover:text-violet-400"
            >
              Go to tasks
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
