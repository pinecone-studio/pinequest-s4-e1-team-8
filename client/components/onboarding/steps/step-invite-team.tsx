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
import { buildInviteUrl } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
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
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function collaboratorDisplayName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function StepInviteTeam() {
  const { step2, inviteToken, addCollaborator, removeCollaborator, advanceFromStep2 } =
    useOnboardingStore();

  const [rows, setRows] = useState<InviteRow[]>(() => [
    createRow(),
    createRow(),
    createRow(),
  ]);
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteUrl = inviteToken ? buildInviteUrl(inviteToken) : "";

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  const existingEmails = useMemo(
    () => new Set(step2.collaborators.map((entry) => entry.email.toLowerCase())),
    [step2.collaborators],
  );

  const rowErrors = useMemo(() => {
    const seen = new Set<string>();
    return rows.map((row) => {
      const trimmed = row.email.trim();
      if (!trimmed) {
        return null;
      }
      if (!isValidEmail(trimmed)) {
        return "Enter a valid email address";
      }
      const normalized = trimmed.toLowerCase();
      if (existingEmails.has(normalized) || seen.has(normalized)) {
        return "This email was already added";
      }
      seen.add(normalized);
      return null;
    });
  }, [rows, existingEmails]);

  const hasErrors = rowErrors.some((error) => error !== null);

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
    if (hasErrors) {
      return;
    }

    const pending = rows.filter((row) => row.email.trim().length > 0);

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

      <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Share invite link
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Anyone with this link can join the project — share it now, even
          before you finish setup.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            className={cn(onboardingInputClassName, "min-w-0 flex-1 text-muted-foreground")}
            value={inviteUrl || "Generating link…"}
          />
          <button
            type="button"
            disabled={!inviteUrl}
            onClick={() => void copyInviteLink()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {linkCopied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
            {linkCopied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const error = rowErrors[index];

          return (
            <div key={row.id}>
              <div className="flex items-center gap-2">
                <input
                  className={cn(
                    onboardingInputClassName,
                    "min-w-0 flex-1",
                    error &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  placeholder="Teammate's email"
                  value={row.email}
                  onChange={(event) => updateRow(row.id, { email: event.target.value })}
                  aria-invalid={Boolean(error)}
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
              {error ? (
                <p className="mt-1.5 pl-1 text-xs text-destructive">{error}</p>
              ) : null}
            </div>
          );
        })}

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
        continueDisabled={hasErrors}
      />
    </div>
  );
}
