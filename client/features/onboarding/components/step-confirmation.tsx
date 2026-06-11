"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ProjectSetupValues } from "../types";

type StepConfirmationProps = {
  values: ProjectSetupValues;
  githubLogin?: string;
  asanaUserName?: string;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function StepConfirmation({
  values,
  githubLogin,
  asanaUserName,
}: StepConfirmationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Review and provision
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your 1:1:1 mapping before Brisk creates the project.
        </p>
      </div>

      <Card className="gap-4 p-5">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brisk project
          </div>
          <div className="text-lg font-semibold text-foreground">
            {values.projectName}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            GitHub
          </div>
          <SummaryRow
            label="Account"
            value={githubLogin ? `@${githubLogin}` : "Connected"}
          />
          <SummaryRow
            label="Repository"
            value={`${values.githubRepoOwner}/${values.githubRepoName}`}
          />
          <SummaryRow label="Project" value={values.githubProjectTitle} />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Asana
          </div>
          <SummaryRow
            label="Account"
            value={asanaUserName ?? "Connected"}
          />
          <SummaryRow label="Project" value={values.asanaProjectName} />
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Each Brisk project maps to exactly one GitHub repository, one GitHub
        project, and one Asana project. Linked resources cannot be reused by
        other projects.
      </p>
    </div>
  );
}
