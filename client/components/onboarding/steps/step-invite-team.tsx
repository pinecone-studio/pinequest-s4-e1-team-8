"use client";

import {
  useOnboardingStore,
  type CollaboratorRole,
} from "@/app/onboarding/use-onboarding-store";
import { useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";

const ROLES: CollaboratorRole[] = ["Manager", "Developer", "Designer"];

const AV_COLORS = [
  "#6366F1", "#0EA5E9", "#22C55E", "#F59E0B", "#EC4899",
  "#8B5CF6", "#14B8A6", "#F43F5E", "#0F172A", "#64748B",
];

const inputClassName =
  "rounded-lg border border-white/10 bg-[#121318] text-sm text-white placeholder:text-[#5c5c66] transition-[border-color,box-shadow] focus:border-violet-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20";

function avColor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 31 + name.charCodeAt(index)) % AV_COLORS.length;
  }
  return AV_COLORS[hash];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function collaboratorDisplayName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function roleBadgeStyle(role: CollaboratorRole) {
  if (role === "Manager") {
    return { bg: "rgba(124,58,237,0.18)", color: "#c4b5fd" };
  }
  if (role === "Developer") {
    return { bg: "rgba(34,197,94,0.15)", color: "#86efac" };
  }
  return { bg: "rgba(14,165,233,0.15)", color: "#7dd3fc" };
}

export function StepInviteTeam() {
  const {
    step2,
    addCollaborator,
    removeCollaborator,
    advanceFromStep2,
    setStep,
  } = useOnboardingStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("Developer");

  const canAdd = /\S+@\S+\.\S+/.test(email);

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    addCollaborator({ email, role });
    setEmail("");
    setRole("Developer");
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-white">
          Invite your team
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#8e8e93]">
          Add teammates by email and assign their role. They&apos;ll get an invite link.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          className={`${inputClassName} h-11 flex-1 px-3.5`}
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleAdd();
            }
          }}
        />
        <div className="relative w-[130px] flex-none">
          <select
            className={`${inputClassName} h-11 w-full cursor-pointer appearance-none pl-3.5 pr-8`}
            value={role}
            onChange={(event) => setRole(event.target.value as CollaboratorRole)}
          >
            {ROLES.map((entry) => (
              <option key={entry} className="bg-[#1a1b1f] text-white">
                {entry}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
            width="12"
            height="12"
            viewBox="0 0 12 12"
          >
            <path
              d="M2.5 4.5L6 8l3.5-3.5"
              stroke="#8e8e93"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <button
          className="flex h-11 flex-none items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!canAdd}
          onClick={handleAdd}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="min-h-24">
        {step2.collaborators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13.5px] text-[#6b6b73]">
            No members added yet — invite your first teammate above.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {step2.collaborators.map((collaborator, index) => {
              const displayName = collaboratorDisplayName(collaborator.email);
              const { bg, color } = roleBadgeStyle(collaborator.role);
              return (
                <div
                  key={`${collaborator.email}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#121318] px-3 py-2.5"
                >
                  <div
                    className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-[13px] font-semibold text-white select-none"
                    style={{ background: avColor(displayName) }}
                  >
                    {initials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-white">
                      {displayName}
                    </div>
                    <div className="truncate text-[12.5px] text-[#8e8e93]">
                      {collaborator.email}
                    </div>
                  </div>
                  <span
                    className="inline-flex h-6 flex-none items-center rounded-lg px-2.5 text-xs font-medium"
                    style={{ background: bg, color }}
                  >
                    {collaborator.role}
                  </span>
                  <button
                    className="p-1 text-[#6b6b73] transition-colors hover:text-red-400"
                    onClick={() => removeCollaborator(index)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center">
        <button
          className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          onClick={advanceFromStep2}
        >
          Continue
          <ArrowRight size={17} />
        </button>
        <button
          className="ml-auto px-1.5 text-[13.5px] font-medium text-[#8e8e93] transition-colors hover:text-violet-400"
          onClick={() => setStep(2)}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
