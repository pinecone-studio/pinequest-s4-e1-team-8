"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import type { MilestoneDraft } from "@/lib/onboarding/parse-milestone-drafts";
import type { TddLayoutState } from "@/lib/onboarding/tdd-types";
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
  onboardingSessionId: string;
  tddLayoutState: TddLayoutState | null;
  tddConfirmed: boolean;
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
  setGithubConnected: (connected: boolean) => void;
  setAsanaConnected: (connected: boolean) => void;
  setAiGoals: (aiGoals: string) => void;
  setMilestoneDrafts: (milestoneDrafts: MilestoneDraft[]) => void;
  setOnboardingSessionId: (sessionId: string) => void;
  setTddLayoutState: (layout: TddLayoutState | null) => void;
  canAdvanceFromStep1: boolean;
  advanceFromStep1: () => boolean;
  advanceFromTddDiscovery: () => void;
  advanceFromPlanning: () => void;
  advanceFromStep2: () => void;
  skipFromStep1: () => void;
  skipTddDiscovery: () => void;
  skipStep3: () => void;
  goToPreviousStep: () => void;
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
  | { type: "SET_GITHUB_CONNECTED"; connected: boolean }
  | { type: "SET_ASANA_CONNECTED"; connected: boolean }
  | { type: "SKIP_STEP3" }
  | { type: "SET_AI_GOALS"; aiGoals: string }
  | { type: "SET_MILESTONE_DRAFTS"; milestoneDrafts: MilestoneDraft[] }
  | { type: "SET_ONBOARDING_SESSION_ID"; sessionId: string }
  | { type: "SET_TDD_LAYOUT_STATE"; layout: TddLayoutState | null }
  | { type: "SET_TDD_CONFIRMED"; confirmed: boolean };

const INITIAL_STATE: OnboardingStoreState = {
  step: 0,
  projectId: createProjectId(),
  workspaceId: DEFAULT_WORKSPACE_ID,
  aiGoals: "",
  onboardingSessionId: "",
  tddLayoutState: null,
  tddConfirmed: false,
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
        onboardingSessionId: action.draft.onboardingSessionId ?? "",
        tddLayoutState: action.draft.tddLayoutState ?? null,
        tddConfirmed: action.draft.tddConfirmed ?? false,
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
    case "SET_GITHUB_CONNECTED":
      return {
        ...state,
        step3: {
          ...state.step3,
          githubConnected: action.connected,
          isGithubDisconnected: action.connected
            ? false
            : state.step3.isGithubDisconnected,
        },
      };
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
        step: 4,
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
    case "SET_ONBOARDING_SESSION_ID":
      return { ...state, onboardingSessionId: action.sessionId };
    case "SET_TDD_LAYOUT_STATE":
      return { ...state, tddLayoutState: action.layout };
    case "SET_TDD_CONFIRMED":
      return { ...state, tddConfirmed: action.confirmed };
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
      onboardingSessionId: state.onboardingSessionId,
      tddLayoutState: state.tddLayoutState,
      tddConfirmed: state.tddConfirmed,
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

  const setGithubConnected = useCallback((connected: boolean) => {
    dispatch({ type: "SET_GITHUB_CONNECTED", connected });
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

  const setOnboardingSessionId = useCallback((sessionId: string) => {
    dispatch({ type: "SET_ONBOARDING_SESSION_ID", sessionId });
  }, []);

  const setTddLayoutState = useCallback((layout: TddLayoutState | null) => {
    dispatch({ type: "SET_TDD_LAYOUT_STATE", layout });
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

  const skipFromStep1 = useCallback(() => {
    if (state.step1.projectName.trim().length === 0) {
      dispatch({
        type: "PATCH_STEP1",
        patch: { projectName: "Untitled Project" },
      });
    }
    dispatch({ type: "SET_STEP", step: 1 });
  }, [state.step1.projectName]);

  const skipTddDiscovery = useCallback(() => {
    dispatch({ type: "SET_STEP", step: 2 });
  }, []);

  const advanceFromTddDiscovery = useCallback(() => {
    dispatch({ type: "SET_TDD_CONFIRMED", confirmed: true });
    dispatch({ type: "SET_STEP", step: 2 });
  }, []);

  const advanceFromPlanning = useCallback(() => {
    dispatch({ type: "SET_STEP", step: 3 });
  }, []);

  const advanceFromStep2 = useCallback(() => {
    dispatch({ type: "SET_STEP", step: 4 });
  }, []);

  const skipStep3 = useCallback(() => {
    dispatch({ type: "SKIP_STEP3" });
  }, []);

  const goToPreviousStep = useCallback(() => {
    if (state.step > 0) {
      dispatch({ type: "SET_STEP", step: state.step - 1 });
    }
  }, [state.step]);

  const value = useMemo<OnboardingStoreContextValue>(
    () => ({
      ...state,
      patchStep1,
      addCollaborator,
      removeCollaborator,
      toggleGithubConnection,
      toggleAsanaConnection,
      setGithubConnected,
      setAsanaConnected,
      setAiGoals,
      setMilestoneDrafts,
      setOnboardingSessionId,
      setTddLayoutState,
      canAdvanceFromStep1,
      advanceFromStep1,
      skipFromStep1,
      skipTddDiscovery,
      advanceFromTddDiscovery,
      advanceFromPlanning,
      advanceFromStep2,
      skipStep3,
      goToPreviousStep,
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
      setGithubConnected,
      setAsanaConnected,
      setAiGoals,
      setMilestoneDrafts,
      setOnboardingSessionId,
      setTddLayoutState,
      canAdvanceFromStep1,
      advanceFromStep1,
      skipFromStep1,
      skipTddDiscovery,
      advanceFromTddDiscovery,
      advanceFromPlanning,
      advanceFromStep2,
      skipStep3,
      goToPreviousStep,
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
