"use client";

import {
  ESSENTIAL_RESOURCES_EVENT,
  normalizeResourceUrl,
  readEssentialResources,
  saveEssentialResources,
  type EssentialResource,
} from "@/lib/essential-resources-storage";
import { useCallback, useEffect, useState } from "react";

export function useEssentialResources(projectId: string | undefined) {
  const [resources, setResources] = useState<EssentialResource[]>([]);

  const reload = useCallback(() => {
    if (!projectId?.trim()) {
      setResources([]);
      return;
    }
    setResources(readEssentialResources(projectId));
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      if (!projectId || detail?.projectId === projectId) {
        reload();
      }
    };

    window.addEventListener(ESSENTIAL_RESOURCES_EVENT, onUpdated);
    return () => window.removeEventListener(ESSENTIAL_RESOURCES_EVENT, onUpdated);
  }, [projectId, reload]);

  const addResource = useCallback(
    (input: { name: string; url: string }) => {
      const id = projectId?.trim();
      if (!id) return;

      const name = input.name.trim();
      const url = normalizeResourceUrl(input.url);
      if (!name || !url) return;

      const next = [
        ...readEssentialResources(id),
        { id: crypto.randomUUID(), name, url },
      ];
      saveEssentialResources(id, next);
      setResources(next);
    },
    [projectId],
  );

  const removeResource = useCallback(
    (resourceId: string) => {
      const id = projectId?.trim();
      if (!id) return;

      const next = readEssentialResources(id).filter(
        (resource) => resource.id !== resourceId,
      );
      saveEssentialResources(id, next);
      setResources(next);
    },
    [projectId],
  );

  return { resources, addResource, removeResource, reload };
}
