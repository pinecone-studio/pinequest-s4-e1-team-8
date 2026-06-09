"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingData } from "@/hooks/use-onboarding-data";
import {
  addSubTeamMember,
  buildInviteUrl,
  createSubTeam,
  fetchProjectMembers,
  fetchSubTeams,
  type SubTeam,
} from "@/lib/api/projects";
import { Check, Copy, Plus, Users, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

type ShareProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareProjectDialog({
  open,
  onOpenChange,
}: ShareProjectDialogProps) {
  const titleId = useId();
  const { data, inviteToken } = useOnboardingData();
  const [copied, setCopied] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [members, setMembers] = useState<
    Array<{ email: string; name: string; role: string }>
  >([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMemberEmail, setSelectedMemberEmail] = useState("");

  const inviteUrl = inviteToken ? buildInviteUrl(inviteToken) : "";

  const loadTeams = useCallback(async () => {
    if (!data?.projectId) return;
    setLoadingTeams(true);
    try {
      const [teams, memberData] = await Promise.all([
        fetchSubTeams(data.projectId),
        fetchProjectMembers(data.projectId),
      ]);
      setSubTeams(teams);
      setMembers(memberData.members);
    } catch {
      setSubTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, [data?.projectId]);

  useEffect(() => {
    if (!open) return;
    void loadTeams();
  }, [loadTeams, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const copyInviteLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTeam = async () => {
    const name = teamName.trim();
    if (!name || !data?.projectId) return;
    const team = await createSubTeam(data.projectId, name);
    setSubTeams((prev) => [...prev, team]);
    setTeamName("");
    setSelectedTeamId(team.id);
  };

  const handleAddMemberToTeam = async () => {
    if (!selectedTeamId || !selectedMemberEmail) return;
    await addSubTeamMember(selectedTeamId, selectedMemberEmail);
    await loadTeams();
    setSelectedMemberEmail("");
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/50"
        aria-label="Close share dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              Share project
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite teammates — members get access to every feature in this
              project.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invitation link</Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                readOnly
                value={inviteUrl || "Complete onboarding to generate a link"}
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1.5"
                disabled={!inviteUrl}
                onClick={() => void copyInviteLink()}
              >
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send this link — teammates sign in and join{" "}
              {data?.projectName ?? "your project"}.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-4 text-violet-700 dark:text-violet-400" />
              <h3 className="text-sm font-semibold">Mini teams</h3>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Split members into small groups inside the project.
            </p>

            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Team name (e.g. Frontend)"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
              <Button
                type="button"
                className="shrink-0 gap-1"
                disabled={!teamName.trim() || !data?.projectId}
                onClick={() => void handleCreateTeam()}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {loadingTeams ? (
              <p className="text-xs text-muted-foreground">Loading teams…</p>
            ) : subTeams.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No mini teams yet.
              </p>
            ) : (
              <div className="space-y-3">
                {subTeams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                  >
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {team.members.length === 0
                        ? "No members assigned"
                        : team.members.map((m) => m.name).join(", ")}
                    </p>
                  </div>
                ))}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm"
                    value={selectedTeamId}
                    onChange={(event) => setSelectedTeamId(event.target.value)}
                  >
                    <option value="">Select team</option>
                    {subTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm"
                    value={selectedMemberEmail}
                    onChange={(event) =>
                      setSelectedMemberEmail(event.target.value)
                    }
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.email} value={member.email}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={!selectedTeamId || !selectedMemberEmail}
                    onClick={() => void handleAddMemberToTeam()}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
