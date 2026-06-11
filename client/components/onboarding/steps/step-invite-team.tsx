"use client";

import {
  useOnboardingStore,
  type CollaboratorRole,
} from "@/app/onboarding/use-onboarding-store";
import {
  OnboardingStepActions,
  OnboardingStepHeading,
  onboardingInputClassName,
  onboardingSelectClassName,
} from "@/components/onboarding/onboarding-layout";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const ROLES: CollaboratorRole[] = ["Manager", "Developer", "Designer"];

type InviteRow = {
  id: string;
  email: string;
  role: CollaboratorRole;
};

function createRow(partial?: Partial<InviteRow>): InviteRow {
  return {
    id: crypto.randomUUID(),
    email: "",
    role: "Developer",
    ...partial,
  };
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function collaboratorDisplayName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StepInviteTeam() {
  const { step2, addCollaborator, removeCollaborator, advanceFromStep2 } =
    useOnboardingStore();

  const [rows, setRows] = useState<InviteRow[]>(() => [
    createRow(),
    createRow(),
    createRow(),
  ]);

  const existingEmails = useMemo(
    () => new Set(step2.collaborators.map((entry) => entry.email.toLowerCase())),
    [step2.collaborators],
  );

  const updateRow = (id: string, patch: Partial<InviteRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createRow()]);
  };

  const removeRow = (id: string) => {
    setRows((current) => {
      const next = current.filter((row) => row.id !== id);
      return next.length > 0 ? next : [createRow()];
    });
  };

  const syncInvitesAndContinue = () => {
    const pending = rows.filter(
      (row) =>
        isValidEmail(row.email) &&
        !existingEmails.has(row.email.trim().toLowerCase()),
    );

    for (const row of pending) {
      addCollaborator({ email: row.email.trim(), role: row.role });
    }

    advanceFromStep2();
  };

  return (
    <div>
      <OnboardingStepHeading
        title="Invite your team"
        description="Add teammates by email and assign their role. They'll get an invite link."
      />

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              className={cn(onboardingInputClassName, "min-w-0 flex-1")}
              placeholder="Teammate's email"
              value={row.email}
              onChange={(event) => updateRow(row.id, { email: event.target.value })}
              autoFocus={index === 0}
            />
            <div className="relative w-[132px] shrink-0">
              <select
                className={cn(
                  onboardingSelectClassName,
                  "w-full cursor-pointer appearance-none pr-8",
                )}
                value={row.role}
                onChange={(event) =>
                  updateRow(row.id, { role: event.target.value as CollaboratorRole })
                }
              >
                {ROLES.map((entry) => (
                  <option key={entry} value={entry} className="bg-card">
                    {entry}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden
              >
                <path
                  d="M2.5 4.5L6 8l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {rows.length > 1 ? (
              <button
                type="button"
                aria-label="Remove invite row"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => removeRow(row.id)}
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <div className="size-10 shrink-0" />
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm text-[#6d8ef7] transition-colors hover:text-[#8aa6ff]"
        >
          <Plus className="size-4" />
          Add another teammate
        </button>
      </div>

      {step2.collaborators.length > 0 ? (
        <div className="mt-8 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Added to project
          </p>
          <div className="space-y-2">
            {step2.collaborators.map((collaborator, index) => (
              <div
                key={`${collaborator.email}-${index}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {collaboratorDisplayName(collaborator.email)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {collaborator.email}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/90">
                  {collaborator.role}
                </span>
                <button
                  type="button"
                  aria-label="Remove teammate"
                  className="text-muted-foreground transition-colors hover:text-red-400"
                  onClick={() => removeCollaborator(index)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <OnboardingStepActions
        onContinue={syncInvitesAndContinue}
        onSkip={advanceFromStep2}
        skipLabel="Continue without invites"
      />
    </div>
  );
}
