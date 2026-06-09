"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import {
  fetchMyProjects,
  projectToOnboardingData,
} from "@/lib/api/projects";
import {
  hasOnboardingProject,
  readOnboardingData,
  saveOnboardingData,
} from "@/lib/onboarding-storage";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export function useOnboardingData() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const local = readOnboardingData();
    setData(local);
    setLoaded(true);

    if (!isSignedIn) {
      return;
    }

    try {
      const projects = await fetchMyProjects();
      if (projects.length === 0) {
        return;
      }

      const active =
        projects.find((project) => project.id === local?.projectId) ??
        projects[0];

      const synced = projectToOnboardingData(
        active,
        local?.aiGoals ?? "",
      );
      setData(synced);
      setInviteToken(active.inviteToken);
      saveOnboardingData(synced);
    } catch {
      // Keep local fallback when API is unavailable.
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }
    void refresh();
  }, [authLoaded, refresh]);

  return {
    data,
    loaded,
    hasProject: hasOnboardingProject(data),
    inviteToken,
    refresh,
  };
}
