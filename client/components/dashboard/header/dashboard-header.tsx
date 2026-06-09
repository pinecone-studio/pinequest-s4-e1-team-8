"use client";

import { ShareProjectDialog } from "@/components/dashboard/share-project-dialog";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import { memberAvatarColor, memberInitials } from "@/lib/onboarding-utils";
import {
  Bell,
  ChevronDown,
  FileText,
  Mic,
  Search,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function DashboardHeader() {
  const { data, loaded, hasProject } = useOnboardingData();
  const [shareOpen, setShareOpen] = useState(false);
  const projectName = hasProject && data ? data.projectName : "Your Project";
  const members = data?.members ?? [];

  return (
    <>
      <header className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:grid lg:items-center lg:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,420px)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="size-3 shrink-0 rounded-full bg-sky-400" />
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {loaded ? projectName : "Loading…"}
            </h1>
            {members.length > 0 ? (
              <AvatarGroup>
                {members.slice(0, 4).map((member) => (
                  <Avatar key={member.email} size="sm">
                    <AvatarFallback
                      className={`${memberAvatarColor(member.name)} text-[10px] text-white`}
                    >
                      {memberInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
            ) : loaded && !hasProject ? (
              <Link
                href="/onboarding"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Set up project
              </Link>
            ) : null}
          </div>
          <div className="relative w-full">
            <Label htmlFor="global-search" className="sr-only">
              Search tasks
            </Label>
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="global-search"
              placeholder="Type to search"
              className="h-10 rounded-full border-border/60 bg-muted/30 pl-9 pr-10"
            />
            <Mic className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative hidden rounded-xl sm:inline-flex"
            >
              <Bell className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden rounded-xl sm:inline-flex"
            >
              <FileText className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 rounded-xl"
              disabled={!hasProject}
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700">
              <span className="hidden sm:inline">Link</span>
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <ShareProjectDialog open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
