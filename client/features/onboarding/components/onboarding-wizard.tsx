"use client";

import {
  OnboardingShell,
  OnboardingStepActions,
} from "@/components/onboarding/onboarding-layout";
import { useInternalUserId } from "@/hooks/use-internal-user-id";
import {
  configureIntegrationUser,
  fetchAsanaResources,
  fetchGithubResources,
  fetchIntegrationStatuses,
  fetchProjectIntegrationMappings,
  persistAsanaSelection,
  persistGithubSelection,
  provisionProject,
  type AsanaProject,
  type GithubProject,
  type GithubRepoOption,
  type ProjectIntegrationMapping,
} from "@/services/integrations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createProjectSetupSchema } from "../schemas/onboarding-schema";
import type { AccountLinkingState, ProjectSetupValues, WizardStep } from "../types";
import { StepAccountLinking } from "./step-account-linking";
import { StepConfirmation } from "./step-confirmation";
import { StepProjectSetup } from "./step-project-setup";

const STEP_INDEX: Record<WizardStep, number> = {
  linking: 0,
  setup: 1,
  confirm: 2,
};

export function OnboardingWizard() {
  const router = useRouter();
  const { userId, isLoaded: userReady } = useInternalUserId();

  const [step, setStep] = useState<WizardStep>("linking");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [linkingState, setLinkingState] = useState<AccountLinkingState>({
    githubConnected: false,
    asanaConnected: false,
  });

  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [workspaces, setWorkspaces] = useState<
    Awaited<ReturnType<typeof fetchAsanaResources>>["workspaces"]
  >([]);
  const [asanaProjectsByWorkspace, setAsanaProjectsByWorkspace] = useState<
    Record<string, AsanaProject[]>
  >({});
  const [mappings, setMappings] = useState<ProjectIntegrationMapping[]>([]);

  const form = useForm<ProjectSetupValues>({
    resolver: async (values, context, options) =>
      zodResolver(createProjectSetupSchema(mappings))(values, context, options),
    defaultValues: {
      projectName: "",
      githubRepoId: "",
      githubRepoOwner: "",
      githubRepoName: "",
      githubProjectId: "",
      githubProjectTitle: "",
      asanaWorkspaceGid: "",
      asanaProjectGid: "",
      asanaProjectName: "",
    },
    mode: "onChange",
  });

  const refreshStatuses = useCallback(async () => {
    if (!userReady) return;

    configureIntegrationUser(userId);
    setLoading(true);
    setError(null);

    try {
      const [statuses, mappingList] = await Promise.all([
        fetchIntegrationStatuses(),
        fetchProjectIntegrationMappings().catch(() => [] as ProjectIntegrationMapping[]),
      ]);

      setLinkingState({
        githubConnected: statuses.github.connected,
        githubLogin: statuses.github.githubLogin,
        asanaConnected: statuses.asana.connected,
        asanaUserName: statuses.asana.asanaUserName,
      });
      setMappings(mappingList);

      if (statuses.github.connected) {
        const githubResources = await fetchGithubResources();
        setRepos(githubResources.repos);
        setProjects(githubResources.projects);
      }

      if (statuses.asana.connected) {
        const asanaResources = await fetchAsanaResources();
        setWorkspaces(asanaResources.workspaces);
        const projectsByWorkspace = Object.fromEntries(
          asanaResources.projectsByWorkspace.map((entry) => [
            entry.workspace.gid,
            entry.projects,
          ]),
        ) as Record<string, AsanaProject[]>;
        setAsanaProjectsByWorkspace(projectsByWorkspace);

        if (statuses.asana.workspaceGid) {
          form.setValue("asanaWorkspaceGid", statuses.asana.workspaceGid);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [form, userId, userReady]);

  useEffect(() => {
    void refreshStatuses();
  }, [refreshStatuses]);

  const canAdvanceFromLinking =
    linkingState.githubConnected && linkingState.asanaConnected;

  const handleNext = async () => {
    setError(null);

    if (step === "linking") {
      if (!canAdvanceFromLinking) {
        setError("Connect both GitHub and Asana to continue.");
        return;
      }
      setStep("setup");
      return;
    }

    if (step === "setup") {
      const valid = await form.trigger();
      if (!valid) return;
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      const values = form.getValues();
      setSubmitting(true);
      setError(null);

      try {
        await persistGithubSelection({
          repoOwner: values.githubRepoOwner,
          repoName: values.githubRepoName,
          githubProjectId: values.githubProjectId,
        });
        await persistAsanaSelection({
          workspaceGid: values.asanaWorkspaceGid,
          projectGid: values.asanaProjectGid,
          projectName: values.asanaProjectName,
        });

        const result = await provisionProject({
          name: values.projectName,
          integrations: {
            githubRepoOwner: values.githubRepoOwner,
            githubRepoName: values.githubRepoName,
            githubRepoId: values.githubRepoId,
            githubProjectId: values.githubProjectId,
            githubProjectTitle: values.githubProjectTitle,
            asanaWorkspaceGid: values.asanaWorkspaceGid,
            asanaProjectGid: values.asanaProjectGid,
            asanaProjectName: values.asanaProjectName,
          },
        });

        router.push(`/dashboard?project=${result.projectId}`);
      } catch (err) {
        const message =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { error?: string } } }).response?.data
            ?.error
            ? (err as { response: { data: { error: string } } }).response.data
                .error
            : err instanceof Error
              ? err.message
              : "Failed to provision project";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "setup") {
      setStep("linking");
      return;
    }
    if (step === "confirm") {
      setStep("setup");
    }
  };

  const handleSkip = () => {
    if (step === "confirm") {
      router.push("/dashboard");
      return;
    }
    if (step === "linking") {
      setStep("setup");
      return;
    }
    setStep("confirm");
  };

  return (
    <OnboardingShell
      step={STEP_INDEX[step]}
      totalSteps={3}
      onBack={step === "linking" ? undefined : handleBack}
      showBack={step !== "linking"}
      maxWidth="xl"
    >
      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {step === "linking" ? (
        <StepAccountLinking
          userId={userId}
          state={linkingState}
          loading={loading}
          onGithubConnected={refreshStatuses}
          onAsanaConnected={refreshStatuses}
        />
      ) : null}

      {step === "setup" ? (
        <StepProjectSetup
          form={form}
          repos={repos}
          projects={projects}
          workspaces={workspaces}
          asanaProjectsByWorkspace={asanaProjectsByWorkspace}
          mappings={mappings}
          loading={loading}
          onReposChange={setRepos}
          onProjectsChange={setProjects}
          onAsanaProjectsChange={(workspaceGid, projects) => {
            setAsanaProjectsByWorkspace((current) => ({
              ...current,
              [workspaceGid]: projects,
            }));
          }}
        />
      ) : null}

      {step === "confirm" ? (
        <StepConfirmation
          values={form.getValues()}
          githubLogin={linkingState.githubLogin}
          asanaUserName={linkingState.asanaUserName}
        />
      ) : null}

      <OnboardingStepActions
        onContinue={() => void handleNext()}
        onSkip={handleSkip}
        continueLabel={step === "confirm" ? "Create project" : "Continue"}
        skipLabel="Skip"
        continueDisabled={
          submitting || loading || (step === "linking" && !canAdvanceFromLinking)
        }
        loading={submitting}
      />
    </OnboardingShell>
  );
}
