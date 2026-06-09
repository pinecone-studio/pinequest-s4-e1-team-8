"use client";

import { AddResourceDialog } from "@/components/dashboard/widgets/add-resource-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEssentialResources } from "@/hooks/use-essential-resources";
import { useGithubUserId } from "@/hooks/use-github-user-id";
import {
  fetchGithubStatus,
  setGithubUserId,
  type GithubStatus,
} from "@/lib/integrations/github";
import { ChevronDown, ExternalLink, GitBranch, Link2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type LinkResourcesMenuProps = {
  projectId?: string;
  disabled?: boolean;
};

export function LinkResourcesMenu({
  projectId,
  disabled = false,
}: LinkResourcesMenuProps) {
  const { userId, isLoaded: userReady } = useGithubUserId();
  const { resources, addResource, removeResource } =
    useEssentialResources(projectId);
  const [addOpen, setAddOpen] = useState(false);
  const [github, setGithub] = useState<GithubStatus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!userReady || !menuOpen) return;
    setGithubUserId(userId);
    fetchGithubStatus()
      .then(setGithub)
      .catch(() => setGithub(null));
  }, [menuOpen, userId, userReady]);

  const githubRepoUrl =
    github?.connected && github.repoOwner && github.repoName
      ? `https://github.com/${github.repoOwner}/${github.repoName}`
      : null;

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          disabled={disabled}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
          title={
            disabled
              ? "Complete onboarding to add project links"
              : "Open saved project links"
          }
        >
          <Link2 className="size-4 sm:hidden" />
          <span className="hidden sm:inline">Link</span>
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Project links</DropdownMenuLabel>
            {githubRepoUrl ? (
              <DropdownMenuItem
                onClick={() =>
                  window.open(githubRepoUrl, "_blank", "noopener,noreferrer")
                }
              >
                <GitBranch className="size-4" />
                <span className="truncate">
                  {github?.repoOwner}/{github?.repoName}
                </span>
                <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            ) : null}
            {resources.length === 0 ? (
              <DropdownMenuItem disabled>No saved links yet</DropdownMenuItem>
            ) : (
              resources.map((resource) => (
                <DropdownMenuItem
                  key={resource.id}
                  className="group justify-between gap-2"
                  onClick={() =>
                    window.open(resource.url, "_blank", "noopener,noreferrer")
                  }
                >
                  <span className="min-w-0 truncate">{resource.name}</span>
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                    aria-label={`Remove ${resource.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeResource(resource.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                setMenuOpen(false);
                setAddOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add link
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddResourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(resource) => {
          addResource(resource);
          setAddOpen(false);
        }}
      />
    </>
  );
}
