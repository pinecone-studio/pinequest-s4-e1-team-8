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
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

export function useOnboardingData() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    const local = hydrateOnboardingData(readOnboardingData());

    if (!isSignedIn) {
      if (mountedRef.current) {
        setData(local);
        setLoaded(true);
      }
      return;
    }

    try {
      const projects = await fetchMyProjects(
        local?.projectId ? { force: true } : undefined,
      );

      if (projects.length === 0) {
        if (mountedRef.current) {
          setData(null);
          setInviteToken(null);
          setLoaded(true);
        }
        return;
      }

      const active =
        projects.find((project) => project.id === local?.projectId) ??
        projects[0];

      const synced = hydrateOnboardingData(
        projectToOnboardingData(active),
      );

      if (synced) {
        saveOnboardingData(synced);
        if (mountedRef.current) {
          setData(synced);
          setInviteToken(active.inviteToken);
          setLoaded(true);
        }
      }
    } catch {
      if (local && hasOnboardingProject(local) && mountedRef.current) {
        setData(local);
        setLoaded(true);
      } else if (mountedRef.current) {
        setData(null);
        setLoaded(true);
      }
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
