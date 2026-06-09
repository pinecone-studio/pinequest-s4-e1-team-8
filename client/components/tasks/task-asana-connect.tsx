"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  disconnectAsana,
  fetchAsanaProjects,
  fetchAsanaStatus,
  fetchAsanaWorkspaces,
  getAsanaConnectUrl,
  selectAsanaProject,
  setAsanaUserId,
  syncAsanaTasks,
  type AsanaProject,
  type AsanaStatus,
  type AsanaWorkspace,
} from "@/lib/integrations/asana";
import { cn } from "@/lib/utils";
import { Briefcase, ChevronDown, Loader2, LogOut } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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

type TaskAsanaContextValue = {
  userId: string;
  userReady: boolean;
  status: AsanaStatus | null;
  workspaces: AsanaWorkspace[];
  projects: AsanaProject[];
  workspaceGid: string;
  projectGid: string;
  isLoading: boolean;
  isSyncing: boolean;
  disconnecting: boolean;
  error: string | null;
  selectedProjectName: string;
  selectedWorkspaceName: string;
  handleWorkspaceChange: (workspaceGid: string) => Promise<void>;
  handleProjectChange: (projectGid: string) => Promise<void>;
  handleDisconnect: () => Promise<void>;
  handleConnect: () => void;
};

const TaskAsanaContext = createContext<TaskAsanaContextValue | null>(null);

function useTaskAsana() {
  const context = useContext(TaskAsanaContext);
  if (!context) {
    throw new Error("TaskAsana components must be used within TaskAsanaProvider");
  }
  return context;
}

type TaskAsanaProviderProps = {
  children: ReactNode;
  onSynced?: () => void;
  oauthError?: string | null;
};

export function TaskAsanaProvider({
  children,
  onSynced,
  oauthError,
}: TaskAsanaProviderProps) {
  const { userId, isLoaded: userReady } = useInternalUserId();
  const [status, setStatus] = useState<AsanaStatus | null>(null);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [workspaceGid, setWorkspaceGid] = useState("");
  const [projectGid, setProjectGid] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
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
    if (!userReady) return;
    setAsanaUserId(userId);
    void loadStatus();
  }, [userReady, userId, loadStatus]);

  const handleWorkspaceChange = useCallback(
    async (nextWorkspaceGid: string) => {
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
    },
    [syncProject],
  );

  const handleProjectChange = useCallback(
    async (nextProjectGid: string) => {
      setProjectGid(nextProjectGid);
      if (!workspaceGid || !nextProjectGid) return;

      const project = projects.find((entry) => entry.gid === nextProjectGid);
      await syncProject(workspaceGid, nextProjectGid, project?.name ?? "Asana", {
        force: true,
      });
    },
    [projects, syncProject, workspaceGid],
  );

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
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
    } finally {
      setDisconnecting(false);
    }
  }, [loadStatus]);

  const handleConnect = useCallback(() => {
    setAsanaUserId(userId);
    window.location.href = getAsanaConnectUrl();
  }, [userId]);

  const selectedProjectName =
    projects.find((project) => project.gid === projectGid)?.name ??
    status?.projectName ??
    "Select project";

  const selectedWorkspaceName =
    workspaces.find((workspace) => workspace.gid === workspaceGid)?.name ??
    "Workspace";

  const value: TaskAsanaContextValue = {
    userId,
    userReady,
    status,
    workspaces,
    projects,
    workspaceGid,
    projectGid,
    isLoading,
    isSyncing,
    disconnecting,
    error,
    selectedProjectName,
    selectedWorkspaceName,
    handleWorkspaceChange,
    handleProjectChange,
    handleDisconnect,
    handleConnect,
  };

  return (
    <TaskAsanaContext.Provider value={value}>{children}</TaskAsanaContext.Provider>
  );
}

/** Connected pill — place to the left of Risk alert. */
export function TaskAsanaHeaderBadge() {
  const { userReady, status, isLoading, isSyncing, handleConnect } = useTaskAsana();

  if (!userReady || isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <Button type="button" size="sm" className="rounded-lg" onClick={handleConnect}>
        Connect Asana
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
        "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <span className="size-2 rounded-full bg-emerald-500" />
      <span className="font-medium text-emerald-700 dark:text-emerald-400">
        Asana Connected
      </span>
      {status.asanaUserName ? (
        <span className="text-muted-foreground">
          @{formatAsanaHandle(status.asanaUserName)}
        </span>
      ) : null}
      {isSyncing ? (
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

/** Disconnect — below Risk alert / Refresh in the header. */
export function TaskAsanaHeaderActions() {
  const { status, userReady, isLoading, disconnecting, handleDisconnect } =
    useTaskAsana();

  if (!userReady || isLoading || !status?.connected) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disconnecting}
      onClick={() => void handleDisconnect()}
      title="Disconnect Asana"
    >
      {disconnecting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Disconnect
    </Button>
  );
}

/** Project picker — below GitHub / Asana / Internal tabs. */
export function TaskAsanaProjectBar() {
  const {
    status,
    userReady,
    isLoading,
    workspaces,
    projects,
    workspaceGid,
    projectGid,
    selectedProjectName,
    selectedWorkspaceName,
    handleWorkspaceChange,
    handleProjectChange,
  } = useTaskAsana();

  if (!userReady || isLoading || !status?.connected) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {workspaces.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 min-w-40 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
          >
            <span className="truncate">{selectedWorkspaceName}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width)">
            <DropdownMenuRadioGroup
              value={workspaceGid}
              onValueChange={(value) => void handleWorkspaceChange(value)}
            >
              {workspaces.map((workspace) => (
                <DropdownMenuRadioItem key={workspace.gid} value={workspace.gid}>
                  {workspace.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-9 min-w-48 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Briefcase className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedProjectName}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width)">
          {projects.length === 0 ? (
            <DropdownMenuLabel className="text-muted-foreground">
              No projects found
            </DropdownMenuLabel>
          ) : (
            <DropdownMenuRadioGroup
              value={projectGid}
              onValueChange={(value) => void handleProjectChange(value)}
            >
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuRadioItem key={project.gid} value={project.gid}>
                  <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{project.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TaskAsanaErrorMessage() {
  const { error } = useTaskAsana();
  if (!error) return null;
  return <p className="text-sm text-rose-400">{error}</p>;
}

function formatAsanaHandle(name: string) {
  return name.trim().replace(/\s+/g, "");
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
