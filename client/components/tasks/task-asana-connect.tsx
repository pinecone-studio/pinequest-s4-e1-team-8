"use client";

import { Button } from "@/components/ui/button";
import {
  disconnectAsana,
  fetchAsanaProjects,
  fetchAsanaStatus,
  fetchAsanaWorkspaces,
  getAsanaConnectUrl,
  selectAsanaProject,
  syncAsanaTasks,
  type AsanaProject,
  type AsanaStatus,
  type AsanaWorkspace,
} from "@/lib/integrations/asana";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, Unplug } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const oauthErrorMessages: Record<string, string> = {
  api_not_found:
    "API server дээр Asana route олдсонгүй. Local server асаасан эсэхээ шалгаад (port 8787) дахин оролдоно уу.",
  save_failed:
    "Asana token хадгалж чадсангүй. Asana app дээр users:read scope идэвхтэй эсэхийг шалгаад дахин connect хийнэ үү.",
  invalid_client:
    "Client ID эсвэл Client Secret буруу байна. Asana console → OAuth дээрээс шинэ Secret хуулж client/.env.local дээр оруулаад client-ээ restart хийнэ үү.",
  token_exchange_failed:
    "Asana token солилт амжилтгүй. Redirect URL болон Client Secret-ээ шалгана уу.",
  missing_client_credentials:
    "ASANA_CLIENT_ID / ASANA_CLIENT_SECRET тохируулаагүй байна.",
};

type TaskAsanaConnectProps = {
  onSynced?: () => void;
  oauthError?: string | null;
};

export function TaskAsanaConnect({ onSynced, oauthError }: TaskAsanaConnectProps) {
  const [status, setStatus] = useState<AsanaStatus | null>(null);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [workspaceGid, setWorkspaceGid] = useState("");
  const [projectGid, setProjectGid] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? oauthErrorMessages[oauthError] ?? oauthError : null,
  );
  const syncRequestRef = useRef(0);
  const lastSyncedKeyRef = useRef<string | null>(null);

  const syncProject = useCallback(
    async (
      wsGid: string,
      projGid: string,
      projectName: string,
      options?: { force?: boolean },
    ) => {
      if (!wsGid || !projGid) return;

      const syncKey = `${wsGid}:${projGid}`;
      if (!options?.force && lastSyncedKeyRef.current === syncKey) {
        return;
      }

      const requestId = ++syncRequestRef.current;
      setIsSyncing(true);
      setError(null);
      try {
        await selectAsanaProject({
          workspaceGid: wsGid,
          projectGid: projGid,
          projectName,
        });
        await syncAsanaTasks();

        if (requestId !== syncRequestRef.current) return;

        lastSyncedKeyRef.current = syncKey;
        setStatus((current) =>
          current
            ? {
                ...current,
                workspaceGid: wsGid,
                projectGid: projGid,
                projectName,
              }
            : current,
        );
        onSynced?.();
      } catch (err) {
        if (requestId === syncRequestRef.current) {
          setError(extractLocalError(err, "Failed to sync Asana tasks"));
        }
      } finally {
        if (requestId === syncRequestRef.current) {
          setIsSyncing(false);
        }
      }
    },
    [onSynced],
  );

  const loadWorkspacesAndProjects = useCallback(
    async (next: AsanaStatus) => {
      try {
        const nextWorkspaces = await fetchAsanaWorkspaces();
        setWorkspaces(nextWorkspaces);

        const activeWorkspace = next.workspaceGid ?? nextWorkspaces[0]?.gid ?? "";
        setWorkspaceGid(activeWorkspace);

        if (!activeWorkspace) return;

        const nextProjects = await fetchAsanaProjects(activeWorkspace);
        setProjects(nextProjects);

        const activeProject = next.projectGid ?? nextProjects[0]?.gid ?? "";
        setProjectGid(activeProject);

        if (activeProject) {
          const project = nextProjects.find((entry) => entry.gid === activeProject);
          await syncProject(activeWorkspace, activeProject, project?.name ?? "Asana");
        }
      } catch (err) {
        setError(
          extractLocalError(
            err,
            "Could not load Asana workspaces. Disconnect and connect again.",
          ),
        );
      }
    },
    [syncProject],
  );

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetchAsanaStatus();
      setStatus(next);
      if (next.connected) {
        void loadWorkspacesAndProjects(next);
      }
    } catch (err) {
      setError(extractLocalError(err, "Failed to load Asana status"));
    } finally {
      setIsLoading(false);
    }
  }, [loadWorkspacesAndProjects]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleWorkspaceChange = async (nextWorkspaceGid: string) => {
    setWorkspaceGid(nextWorkspaceGid);
    setProjectGid("");
    setProjects([]);

    if (!nextWorkspaceGid) return;

    try {
      const nextProjects = await fetchAsanaProjects(nextWorkspaceGid);
      setProjects(nextProjects);

      const firstProject = nextProjects[0]?.gid ?? "";
      setProjectGid(firstProject);

      if (firstProject) {
        await syncProject(
          nextWorkspaceGid,
          firstProject,
          nextProjects[0]?.name ?? "Asana",
          { force: true },
        );
      }
    } catch (err) {
      setError(extractLocalError(err, "Failed to load projects"));
    }
  };

  const handleProjectChange = async (nextProjectGid: string) => {
    setProjectGid(nextProjectGid);
    if (!workspaceGid || !nextProjectGid) return;

    const project = projects.find((entry) => entry.gid === nextProjectGid);
    await syncProject(workspaceGid, nextProjectGid, project?.name ?? "Asana", {
      force: true,
    });
  };

  const handleSync = async () => {
    if (!workspaceGid || !projectGid) {
      setError("Select a workspace and project first.");
      return;
    }

    const project = projects.find((entry) => entry.gid === projectGid);
    await syncProject(workspaceGid, projectGid, project?.name ?? "Asana", {
      force: true,
    });
  };

  const handleDisconnect = async () => {
    try {
      await disconnectAsana();
      lastSyncedKeyRef.current = null;
      setWorkspaces([]);
      setProjects([]);
      setWorkspaceGid("");
      setProjectGid("");
      await loadStatus();
    } catch (err) {
      setError(extractLocalError(err, "Failed to disconnect Asana"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-[#18191d] px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking Asana connection...
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 bg-[#18191d] px-4 py-4">
        <div>
          <p className="text-sm font-medium">Connect Asana</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with Asana OAuth to import tasks from your workspace.
          </p>
          {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
        </div>
        <Button
          type="button"
          className="rounded-lg"
          onClick={() => {
            window.location.href = getAsanaConnectUrl();
          }}
        >
          Connect Asana
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-[#18191d] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            Connected as {status.asanaUserName ?? "Asana user"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSyncing
              ? "Syncing tasks..."
              : status.projectName
                ? `Showing tasks from ${status.projectName}`
                : "Select a project to load tasks."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={isSyncing}
            onClick={() => void handleSync()}
          >
            <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
            Sync Asana
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => void handleDisconnect()}
          >
            <Unplug className="size-4" />
            Disconnect
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Workspace
          <select
            className="h-9 rounded-lg border border-border/60 bg-[#25262b] px-3 text-sm outline-none"
            value={workspaceGid}
            onChange={(event) => void handleWorkspaceChange(event.target.value)}
          >
            <option value="">Select workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.gid} value={workspace.gid}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Project
          <select
            className="h-9 rounded-lg border border-border/60 bg-[#25262b] px-3 text-sm outline-none"
            value={projectGid}
            onChange={(event) => void handleProjectChange(event.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.gid} value={project.gid}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}

function extractLocalError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    return (
      (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
      fallback
    );
  }
  return err instanceof Error ? err.message : fallback;
}
