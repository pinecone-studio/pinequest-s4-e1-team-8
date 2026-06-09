"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";
import { createProjectId } from "@/lib/onboarding-utils";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-defaults";

export type { MilestoneDraft };
import {
  readOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding-draft-storage";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

export type CollaboratorRole = "Developer" | "Designer" | "Manager";

export type OnboardingCollaborator = {
  email: string;
  role: CollaboratorRole;
};

export type OnboardingStep1 = {
  projectName: string;
  description: string;
  timezone: string;
};

export type OnboardingStep2 = {
  collaborators: OnboardingCollaborator[];
};

export type OnboardingStep3 = {
  githubConnected: boolean;
  asanaConnected: boolean;
  isGithubDisconnected: boolean;
  isAsanaDisconnected: boolean;
};

export type OnboardingStep4 = {
  milestoneDrafts: MilestoneDraft[];
};

type OnboardingStoreState = {
  step: number;
  projectId: string;
  workspaceId: string;
  aiGoals: string;
  step1: OnboardingStep1;
  step2: OnboardingStep2;
  step3: OnboardingStep3;
  step4: OnboardingStep4;
};

type OnboardingStoreContextValue = OnboardingStoreState & {
  patchStep1: (patch: Partial<OnboardingStep1>) => void;
  addCollaborator: (collaborator: OnboardingCollaborator) => void;
  removeCollaborator: (index: number) => void;
  toggleGithubConnection: () => void;
  toggleAsanaConnection: () => void;
  setAsanaConnected: (connected: boolean) => void;
  setAiGoals: (aiGoals: string) => void;
  setMilestoneDrafts: (milestoneDrafts: MilestoneDraft[]) => void;
  canAdvanceFromStep1: boolean;
  advanceFromStep1: () => boolean;
  advanceFromStep2: () => void;
  advanceFromStep3: () => void;
  skipStep3: () => void;
  setStep: (step: number) => void;
  toOnboardingData: () => OnboardingData;
  toInitializePayload: () => import("@/lib/api/projects").InitializeProjectPayload;
};

type OnboardingStoreAction =
  | { type: "RESTORE"; draft: OnboardingDraft }
  | { type: "SET_STEP"; step: number }
  | { type: "PATCH_STEP1"; patch: Partial<OnboardingStep1> }
  | { type: "ADD_COLLABORATOR"; collaborator: OnboardingCollaborator }
  | { type: "REMOVE_COLLABORATOR"; index: number }
  | { type: "TOGGLE_GITHUB" }
  | { type: "TOGGLE_ASANA" }
  | { type: "SET_ASANA_CONNECTED"; connected: boolean }
  | { type: "SKIP_STEP3" }
  | { type: "SET_AI_GOALS"; aiGoals: string }
  | { type: "SET_MILESTONE_DRAFTS"; milestoneDrafts: MilestoneDraft[] };

const INITIAL_STATE: OnboardingStoreState = {
  step: 0,
  projectId: createProjectId(),
  workspaceId: DEFAULT_WORKSPACE_ID,
  aiGoals: "",
  step1: {
    projectName: "",
    description: "",
    timezone: "(GMT+00:00) UTC",
  },
  step2: {
    collaborators: [],
  },
  step3: {
    githubConnected: false,
    asanaConnected: false,
    isGithubDisconnected: false,
    isAsanaDisconnected: false,
  },
  step4: {
    milestoneDrafts: [],
  },
};

function collaboratorDisplayName(email: string) {
  return email
    .split("@")[0]
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function onboardingReducer(
  state: OnboardingStoreState,
  action: OnboardingStoreAction,
): OnboardingStoreState {
  switch (action.type) {
    case "RESTORE":
      return {
        step: action.draft.step,
        projectId: action.draft.projectId,
        workspaceId: action.draft.workspaceId,
        aiGoals: action.draft.aiGoals,
        step1: action.draft.step1,
        step2: action.draft.step2,
        step3: action.draft.step3,
        step4: action.draft.step4,
      };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "PATCH_STEP1":
      return { ...state, step1: { ...state.step1, ...action.patch } };
    case "ADD_COLLABORATOR":
      return {
        ...state,
        step2: {
          collaborators: [...state.step2.collaborators, action.collaborator],
        },
      };
    case "REMOVE_COLLABORATOR":
      return {
        ...state,
        step2: {
          collaborators: state.step2.collaborators.filter(
            (_, index) => index !== action.index,
          ),
        },
      };
    case "TOGGLE_GITHUB": {
      const nextConnected = !state.step3.githubConnected;
      return {
        ...state,
        step3: {
          ...state.step3,
          githubConnected: nextConnected,
          isGithubDisconnected: nextConnected
            ? false
            : true,
        },
      };
    }
    case "TOGGLE_ASANA": {
      const nextConnected = !state.step3.asanaConnected;
      return {
        ...state,
        step3: {
          ...state.step3,
          asanaConnected: nextConnected,
          isAsanaDisconnected: nextConnected
            ? false
            : true,
        },
      };
    }
    case "SET_ASANA_CONNECTED":
      return {
        ...state,
        step3: {
          ...state.step3,
          asanaConnected: action.connected,
          isAsanaDisconnected: action.connected
            ? false
            : state.step3.isAsanaDisconnected,
        },
      };
    case "SKIP_STEP3":
      return {
        ...state,
        step: 3,
        step3: {
          ...state.step3,
          isGithubDisconnected: state.step3.githubConnected
            ? state.step3.isGithubDisconnected
            : true,
          isAsanaDisconnected: state.step3.asanaConnected
            ? state.step3.isAsanaDisconnected
            : true,
        },
      };
    case "SET_AI_GOALS":
      return { ...state, aiGoals: action.aiGoals };
    case "SET_MILESTONE_DRAFTS":
      return {
        ...state,
        step4: { milestoneDrafts: action.milestoneDrafts },
      };
    default:
      return state;
  }
}

function toOnboardingData(state: OnboardingStoreState): OnboardingData {
  return {
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    projectName: state.step1.projectName,
    description: state.step1.description,
    timezone: state.step1.timezone,
    members: state.step2.collaborators.map((collaborator) => ({
      email: collaborator.email,
      name: collaboratorDisplayName(collaborator.email),
      role: collaborator.role,
    })),
    githubConnected: state.step3.githubConnected,
    asanaConnected: state.step3.asanaConnected,
    isGithubDisconnected: state.step3.isGithubDisconnected,
    isAsanaDisconnected: state.step3.isAsanaDisconnected,
    aiGoals: state.aiGoals,
  };
}

function toInitializePayload(
  state: OnboardingStoreState,
): import("@/lib/api/projects").InitializeProjectPayload {
  return {
    projectId: state.projectId,
    workspaceId: state.workspaceId,
    step1: { ...state.step1 },
    step2: { collaborators: [...state.step2.collaborators] },
    step3: { ...state.step3 },
    step4: {
      milestoneDrafts: state.step4.milestoneDrafts.map((draft) => ({
        title: draft.title,
        tasks: draft.tasks,
        isApproved: draft.isApproved,
      })),
    },
  };
}

const OnboardingStoreContext =
  createContext<OnboardingStoreContextValue | null>(null);

export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);
  const [draftReady, setDraftReady] = useState(false);

  // Restore session draft after mount so SSR and first client render match.
  useEffect(() => {
    const draft = readOnboardingDraft();
    if (draft) {
      dispatch({ type: "RESTORE", draft });
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) {
      return;
    }
    saveOnboardingDraft({
      step: state.step,
      projectId: state.projectId,
      workspaceId: state.workspaceId,
      aiGoals: state.aiGoals,
      step1: state.step1,
      step2: state.step2,
      step3: state.step3,
      step4: state.step4,
    });
  }, [draftReady, state]);

  const canAdvanceFromStep1 = state.step1.projectName.trim().length > 0;

  const patchStep1 = useCallback((patch: Partial<OnboardingStep1>) => {
    dispatch({ type: "PATCH_STEP1", patch });
  }, []);

  const addCollaborator = useCallback((collaborator: OnboardingCollaborator) => {
    dispatch({ type: "ADD_COLLABORATOR", collaborator });
  }, []);

  const removeCollaborator = useCallback((index: number) => {
    dispatch({ type: "REMOVE_COLLABORATOR", index });
  }, []);

  const toggleGithubConnection = useCallback(() => {
    dispatch({ type: "TOGGLE_GITHUB" });
  }, []);

  const toggleAsanaConnection = useCallback(() => {
    dispatch({ type: "TOGGLE_ASANA" });
  }, []);

  const setAsanaConnected = useCallback((connected: boolean) => {
    dispatch({ type: "SET_ASANA_CONNECTED", connected });
  }, []);

  const setAiGoals = useCallback((aiGoals: string) => {
    dispatch({ type: "SET_AI_GOALS", aiGoals });
  }, []);

  const setMilestoneDrafts = useCallback((milestoneDrafts: MilestoneDraft[]) => {
    dispatch({ type: "SET_MILESTONE_DRAFTS", milestoneDrafts });
  }, []);

  const setStep = useCallback((step: number) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const advanceFromStep1 = useCallback(() => {
    if (state.step1.projectName.trim().length === 0) {
      return false;
    }
    dispatch({ type: "SET_STEP", step: 1 });
    return true;
  }, [state.step1.projectName]);

  const advanceFromStep2 = useCallback(() => {
    dispatch({ type: "SET_STEP", step: 2 });
  }, []);

  const advanceFromStep3 = useCallback(() => {
    dispatch({ type: "SET_STEP", step: 3 });
  }, []);

  const skipStep3 = useCallback(() => {
    dispatch({ type: "SKIP_STEP3" });
  }, []);

  const value = useMemo<OnboardingStoreContextValue>(
    () => ({
      ...state,
      patchStep1,
      addCollaborator,
      removeCollaborator,
      toggleGithubConnection,
      toggleAsanaConnection,
      setAsanaConnected,
      setAiGoals,
      setMilestoneDrafts,
      canAdvanceFromStep1,
      advanceFromStep1,
      advanceFromStep2,
      advanceFromStep3,
      skipStep3,
      setStep,
      toOnboardingData: () => toOnboardingData(state),
      toInitializePayload: () => toInitializePayload(state),
    }),
    [
      state,
      patchStep1,
      addCollaborator,
      removeCollaborator,
      toggleGithubConnection,
      toggleAsanaConnection,
      setAsanaConnected,
      setAiGoals,
      setMilestoneDrafts,
      canAdvanceFromStep1,
      advanceFromStep1,
      advanceFromStep2,
      advanceFromStep3,
      skipStep3,
      setStep,
    ],
  );

  return createElement(
    OnboardingStoreContext.Provider,
    { value },
    children,
  );
}

export function useOnboardingStore() {
  const context = useContext(OnboardingStoreContext);
  if (!context) {
    throw new Error("useOnboardingStore must be used within OnboardingStoreProvider");
  }
  return context;
}
