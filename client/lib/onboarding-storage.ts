import type { OnboardingData } from "@/components/onboarding/onboarding-types";

const STORAGE_KEY = "brisk-onboarding";

export function saveOnboardingData(data: OnboardingData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readOnboardingData(): OnboardingData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export function hasOnboardingProject(data: OnboardingData | null): data is OnboardingData {
  return !!data?.projectName?.trim();
}
