"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { ExternalLink, FolderOpen } from "lucide-react";
import Link from "next/link";

export function LastProjectsWidget() {
  const { loaded, hasProject } = useOnboardingData();

  if (!loaded) {
    return <LastProjectsCardSkeleton />;
  }

  if (!hasProject) {
    return (
      <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
        <CardHeader className="px-4 pb-1">
          <CardTitle className="text-base">Last Projects</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="items-center pb-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Last Projects</CardTitle>
          <Badge variant="secondary">1</Badge>
        </div>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="h-auto gap-1 px-0 text-violet-500"
            disabled
          >
            View on Figma
            <ExternalLink className="size-3" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-2">
            <WireframePreview variant="ui" />
            <WireframePreview variant="flow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WireframePreview({ variant }: { variant: "ui" | "flow" }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-xl border border-border/50 bg-[#121318] p-2">
      {variant === "ui" ? (
        <div className="grid h-full grid-cols-3 gap-1">
          <div className="col-span-1 rounded bg-muted/30" />
          <div className="col-span-2 space-y-1">
            <div className="h-2 w-2/3 rounded bg-muted/40" />
            <div className="h-full rounded bg-muted/20" />
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="size-3 rounded-full border border-violet-400/50 bg-violet-500/20"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-8 text-center">
      <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
        <FolderOpen className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No projects yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Your recent projects will appear here once you add one.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="text-xs font-medium text-violet-500 hover:text-violet-400"
      >
        Start onboarding
      </Link>
    </div>
  );
}

function LastProjectsCardSkeleton() {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="px-4 pb-1">
        <div className="h-5 w-28 animate-pulse rounded bg-muted/50" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/30" />
      </CardContent>
    </Card>
  );
}
