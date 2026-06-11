"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import {
  fetchMyProjects,
  projectToOnboardingData,
} from "@/lib/api/projects";
import {
  hasOnboardingProject,
  hydrateOnboardingData,
  PROJECT_CHANGED_EVENT,
  readOnboardingData,
  saveOnboardingData,
} from "@/lib/onboarding-storage";
import { resolveScopedMilestones } from "@/lib/onboarding/scoped-milestones";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

export function useOnboardingData() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    const raw = readOnboardingData();
    const local = hydrateOnboardingData(raw);

    if (local && hasOnboardingProject(local)) {
      const hadScoped = (raw?.scopedMilestones?.length ?? 0) > 0;
      if (!hadScoped) {
        saveOnboardingData(local);
      }
    }

    if (mountedRef.current) {
      setData(local);
      setLoaded(true);
    }

    if (!isSignedIn) {
      return;
    }

    try {
      let projects = await fetchMyProjects();
      // The active project may be newer than a cached list — refetch once.
      if (local?.projectId && !projects.some((p) => p.id === local.projectId)) {
        projects = await fetchMyProjects({ force: true });
      }
      if (projects.length === 0 || !mountedRef.current) {
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
        saveOnboardingData(synced);
        if (mountedRef.current) {
          setData(synced);
          setInviteToken(active.inviteToken);
        }
      }
    } catch {
      // Keep hydrated local fallback when API is unavailable.
    }
  }, [isSignedIn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!authLoaded) {
      return;
    }
    void refresh();
  }, [authLoaded, refresh]);

  useEffect(() => {
    const handleProjectChanged = () => void refresh();
    window.addEventListener(PROJECT_CHANGED_EVENT, handleProjectChanged);
    return () =>
      window.removeEventListener(PROJECT_CHANGED_EVENT, handleProjectChanged);
  }, [refresh]);

  return {
    data,
    loaded,
    hasProject: hasOnboardingProject(data),
    inviteToken,
    refresh,
  };
}
