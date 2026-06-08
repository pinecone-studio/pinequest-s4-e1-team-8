"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import { createProjectId } from "@/lib/onboarding-utils";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-defaults";
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useReducer,
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

type OnboardingStoreState = {
  step: number;
  projectId: string;
  workspaceId: string;
  aiGoals: string;
  step1: OnboardingStep1;
  step2: OnboardingStep2;
  step3: OnboardingStep3;
};

type OnboardingStoreContextValue = OnboardingStoreState & {
  patchStep1: (patch: Partial<OnboardingStep1>) => void;
  addCollaborator: (collaborator: OnboardingCollaborator) => void;
  removeCollaborator: (index: number) => void;
  toggleGithubConnection: () => void;
  toggleAsanaConnection: () => void;
  setAiGoals: (aiGoals: string) => void;
  canAdvanceFromStep1: boolean;
  advanceFromStep1: () => boolean;
  advanceFromStep2: () => void;
  advanceFromStep3: () => void;
  skipStep3: () => void;
  setStep: (step: number) => void;
  toOnboardingData: () => OnboardingData;
};

type OnboardingStoreAction =
  | { type: "SET_STEP"; step: number }
  | { type: "PATCH_STEP1"; patch: Partial<OnboardingStep1> }
  | { type: "ADD_COLLABORATOR"; collaborator: OnboardingCollaborator }
  | { type: "REMOVE_COLLABORATOR"; index: number }
  | { type: "TOGGLE_GITHUB" }
  | { type: "TOGGLE_ASANA" }
  | { type: "SKIP_STEP3" }
  | { type: "SET_AI_GOALS"; aiGoals: string };

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

const OnboardingStoreContext =
  createContext<OnboardingStoreContextValue | null>(null);

export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);

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

  const setAiGoals = useCallback((aiGoals: string) => {
    dispatch({ type: "SET_AI_GOALS", aiGoals });
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
      setAiGoals,
      canAdvanceFromStep1,
      advanceFromStep1,
      advanceFromStep2,
      advanceFromStep3,
      skipStep3,
      setStep,
      toOnboardingData: () => toOnboardingData(state),
    }),
    [
      state,
      patchStep1,
      addCollaborator,
      removeCollaborator,
      toggleGithubConnection,
      toggleAsanaConnection,
      setAiGoals,
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
