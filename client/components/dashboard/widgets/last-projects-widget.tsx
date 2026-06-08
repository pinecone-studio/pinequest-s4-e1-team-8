"use client";

import { AddResourceDialog } from "@/components/dashboard/widgets/add-resource-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import {
  readEssentialResources,
  saveEssentialResources,
  type EssentialResource,
} from "@/lib/essential-resources-storage";
import { ExternalLink, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function LastProjectsWidget() {
  const { data, loaded } = useOnboardingData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resources, setResources] = useState<EssentialResource[]>([]);

  useEffect(() => {
    if (!loaded) return;

    const projectId = data?.projectId;
    if (!projectId) {
      setResources([]);
      return;
    }

    setResources(readEssentialResources(projectId));
  }, [data?.projectId, loaded]);

  const handleAddResource = (resource: { name: string; url: string }) => {
    const projectId = data?.projectId ?? "default";
    const nextResources = [
      ...resources,
      {
        id: crypto.randomUUID(),
        name: resource.name,
        url: resource.url,
      },
    ];

    setResources(nextResources);
    saveEssentialResources(projectId, nextResources);
    setDialogOpen(false);
  };

  return (
    <>
      <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
        <CardHeader className="items-center pb-1">
          <CardTitle className="text-base">Essential Resources</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-3.5" />
              Add resource
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex h-48 flex-col rounded-2xl border border-dashed border-border/60 bg-muted/10 p-3">
            {resources.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">No resources yet</p>
              </div>
            ) : (
              <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
                {resources.map((resource) => (
                  <li key={resource.id}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {resource.name}
                      </span>
                      <ExternalLink className="size-3.5 shrink-0 text-violet-400" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <AddResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddResource}
      />
    </>
  );
}
