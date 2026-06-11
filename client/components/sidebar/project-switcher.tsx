"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import {
  fetchMyProjects,
  projectToOnboardingData,
  type ProjectSummary,
} from "@/lib/api/projects";
import {
  PROJECT_CHANGED_EVENT,
  saveOnboardingData,
} from "@/lib/onboarding-storage";
import { Briefcase, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function ProjectSwitcher() {
  const { data, loaded, hasProject } = useOnboardingData();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const mountedRef = useRef(false);

  const activeId = data?.projectId ?? "";
  const activeName = hasProject ? data?.projectName : "";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchMyProjects();
      if (!mountedRef.current) {
        return;
      }
      setProjects(list);
      setLoadedOnce(true);
    } catch {
      // Keep the trigger usable even if the list fails to load.
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open && !loadedOnce) {
      void loadProjects();
    }
  };

  const handlePick = (id: string) => {
    if (id === activeId) {
      return;
    }
    const project = projects.find((entry) => entry.id === id);
    if (!project) {
      return;
    }
    saveOnboardingData(projectToOnboardingData(project, data?.aiGoals ?? ""));
    window.dispatchEvent(new Event(PROJECT_CHANGED_EVENT));
  };

  if (!loaded) {
    return null;
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent px-2.5 text-[13px] text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent/80 focus-visible:ring-2 focus-visible:ring-violet-500/40">
        <span className="flex min-w-0 items-center gap-2">
          <Briefcase className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">
            {activeName || "Select project"}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width) min-w-56">
        <DropdownMenuRadioGroup value={activeId} onValueChange={handlePick}>
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {loading ? (
            <DropdownMenuLabel className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Loading…
            </DropdownMenuLabel>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <DropdownMenuRadioItem key={project.id} value={project.id}>
                <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{project.name}</span>
              </DropdownMenuRadioItem>
            ))
          ) : (
            <DropdownMenuLabel className="text-muted-foreground">
              {loadedOnce ? "No projects yet" : "Open to load projects"}
            </DropdownMenuLabel>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
