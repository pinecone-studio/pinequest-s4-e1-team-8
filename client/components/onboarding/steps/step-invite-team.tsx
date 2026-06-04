"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import type { OnboardingData, TeamMember, TeamRole } from "../onboarding-types";

const ROLES: TeamRole[] = ["Manager", "Developer", "Viewer"];

const AV_COLORS = [
  "#6366F1", "#0EA5E9", "#22C55E", "#F59E0B", "#EC4899",
  "#8B5CF6", "#14B8A6", "#F43F5E", "#0F172A", "#64748B",
];

function avColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AV_COLORS.length;
  return AV_COLORS[h];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function roleBadgeStyle(role: TeamRole) {
  if (role === "Manager") return { bg: "#EEF0FF", color: "#6366F1" };
  if (role === "Developer") return { bg: "#ECFDF3", color: "#15803D" };
  return { bg: "#F1F2F4", color: "#64748B" };
}

interface StepInviteTeamProps {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepInviteTeam({ data, onChange, onNext, onSkip }: StepInviteTeamProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Developer");

  const canAdd = /\S+@\S+\.\S+/.test(email);

  const addMember = () => {
    if (!canAdd) return;
    const name = email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    onChange({ members: [...data.members, { email, name, role }] });
    setEmail("");
    setRole("Developer");
  };

  const removeMember = (i: number) => {
    onChange({ members: data.members.filter((_, j) => j !== i) });
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-[#0F172A]">
          Invite your team
        </h2>
        <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
          Add teammates by email and assign their role. They&apos;ll get an invite link.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 h-11 px-3.5 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
        />
        <div className="relative flex-none w-[130px]">
          <select
            className="w-full h-11 pl-3.5 pr-8 bg-white border border-[#E8E9EC] rounded-lg text-sm text-[#0F172A] appearance-none cursor-pointer transition-[border-color,box-shadow] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[#6366F1]/14"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 12 12">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#64748B" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <button
          className="flex-none h-11 px-4 flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#1c2740] disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          disabled={!canAdd}
          onClick={addMember}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="min-h-24">
        {data.members.length === 0 ? (
          <div className="border-[1.5px] border-dashed border-[#E8E9EC] rounded-xl py-6 px-4 text-center text-[13.5px] text-[#94A3B8]">
            No members added yet — invite your first teammate above.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.members.map((m: TeamMember, i: number) => {
              const { bg, color } = roleBadgeStyle(m.role);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 border border-[#E8E9EC] rounded-xl px-3 py-2.5"
                >
                  <div
                    className="w-[34px] h-[34px] rounded-full flex-none grid place-items-center text-white text-[13px] font-semibold select-none"
                    style={{ background: avColor(m.name) }}
                  >
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-[#0F172A]">{m.name}</div>
                    <div className="text-[12.5px] text-[#64748B] truncate">{m.email}</div>
                  </div>
                  <span
                    className="inline-flex items-center h-6 px-2.5 rounded-lg text-xs font-medium flex-none"
                    style={{ background: bg, color }}
                  >
                    {m.role}
                  </span>
                  <button
                    className="text-[#94A3B8] hover:text-[#EF4444] p-1 transition-colors"
                    onClick={() => removeMember(i)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center mt-7">
        <button
          className="min-w-[150px] h-11 px-5 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5457e5] text-white text-sm font-semibold rounded-lg transition-colors"
          onClick={onNext}
        >
          Continue
          <ArrowRight size={17} />
        </button>
        <button
          className="ml-auto text-[13.5px] font-medium text-[#64748B] hover:text-[#6366F1] px-1.5 transition-colors"
          onClick={onSkip}
        >
          Skip for now
        </button>
      </div>
    </>
  );
}
