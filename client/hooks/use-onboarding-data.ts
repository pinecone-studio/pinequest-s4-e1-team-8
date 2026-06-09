"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import {
  fetchMyProjects,
  projectToOnboardingData,
} from "@/lib/api/projects";
import {
  hasOnboardingProject,
  hydrateOnboardingData,
  readOnboardingData,
  saveOnboardingData,
} from "@/lib/onboarding-storage";
import { resolveScopedMilestones } from "@/lib/onboarding/scoped-milestones";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export function useOnboardingData() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const raw = readOnboardingData();
    const local = hydrateOnboardingData(raw);

    if (local && hasOnboardingProject(local)) {
      const hadScoped = (raw?.scopedMilestones?.length ?? 0) > 0;
      if (!hadScoped) {
        saveOnboardingData(local);
      }
      setData(local);
    } else {
      setData(local);
    }

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

      const synced = hydrateOnboardingData(
        projectToOnboardingData(active, local?.aiGoals ?? ""),
      );
      if (synced) {
        synced.scopedMilestones = resolveScopedMilestones(
          local?.scopedMilestones ?? synced.scopedMilestones,
        );
        setData(synced);
        setInviteToken(active.inviteToken);
        saveOnboardingData(synced);
      }
    } catch {
      // Keep hydrated local fallback when API is unavailable.
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
