"use client";

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

export function DashboardHeader() {
  const { data, loaded, hasProject } = useOnboardingData();
  const projectName = hasProject && data ? data.projectName : "Your Project";
  const members = data?.members ?? [];

  return (
    <header className="shrink-0 border-b border-border/60 px-6 py-4">
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,420px)_auto]">
        <div className="flex items-center gap-3">
          <span className="size-3 shrink-0 rounded-full bg-sky-400" />
          <h1 className="text-xl font-semibold tracking-tight">
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
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <FileText className="size-4" />
          </Button>
          <Button variant="outline" className="gap-1.5 rounded-xl">
            <Share2 className="size-4" />
            Share
          </Button>
          <Button className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700">
            Link
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
