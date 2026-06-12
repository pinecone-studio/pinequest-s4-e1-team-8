"use client";

import {
  fetchProjectResources,
  saveProjectResources,
  type EssentialResource,
} from "@/lib/api/projects";
import {
  ESSENTIAL_RESOURCES_EVENT,
  normalizeResourceUrl,
  readEssentialResources,
} from "@/lib/essential-resources-storage";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export function useEssentialResources(projectId: string | undefined) {
  const { isSignedIn } = useAuth();
  const [resources, setResources] = useState<EssentialResource[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const id = projectId?.trim();
    if (!id) {
      setResources([]);
      setLoaded(true);
      return;
    }

    if (!isSignedIn) {
      setResources([]);
      setLoaded(true);
      return;
    }

    try {
      const remote = await fetchProjectResources(id);
      setResources(remote);
    } catch {
      setResources([]);
    } finally {
      setLoaded(true);
    }
  }, [isSignedIn, projectId]);

  useEffect(() => {
    setLoaded(false);
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!projectId || detail?.projectId === projectId) {
        void reload();
      }
    };

    window.addEventListener(ESSENTIAL_RESOURCES_EVENT, onUpdated);
    return () => window.removeEventListener(ESSENTIAL_RESOURCES_EVENT, onUpdated);
  }, [projectId, reload]);

  const persistResources = useCallback(
    async (next: EssentialResource[]) => {
      const id = projectId?.trim();
      if (!id || !isSignedIn) {
        return next;
      }

      const saved = await saveProjectResources(id, next);
      setResources(saved);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(ESSENTIAL_RESOURCES_EVENT, { detail: { projectId: id } }),
        );
      }
      return saved;
    },
    [isSignedIn, projectId],
  );

  const addResource = useCallback(
    async (input: { name: string; url: string }) => {
      const id = projectId?.trim();
      if (!id || !isSignedIn) return;

      const name = input.name.trim();
      const url = normalizeResourceUrl(input.url);
      if (!name || !url) return;

      const next = [
        ...resources,
        { id: crypto.randomUUID(), name, url },
      ];
      await persistResources(next);
    },
    [isSignedIn, persistResources, projectId, resources],
  );

  const removeResource = useCallback(
    async (resourceId: string) => {
      const id = projectId?.trim();
      if (!id || !isSignedIn) return;

      const next = resources.filter((resource) => resource.id !== resourceId);
      await persistResources(next);
    },
    [isSignedIn, persistResources, projectId, resources],
  );

  const migrateLocalResources = useCallback(async () => {
    const id = projectId?.trim();
    if (!id || !isSignedIn || !loaded) {
      return;
    }

    const local = readEssentialResources(id);
    if (local.length === 0 || resources.length > 0) {
      return;
    }

    await persistResources(local);
  }, [isSignedIn, loaded, persistResources, projectId, resources.length]);

  useEffect(() => {
    void migrateLocalResources();
  }, [migrateLocalResources]);

  return { resources, addResource, removeResource, reload, loaded };
}
