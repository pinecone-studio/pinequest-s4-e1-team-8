"use client";

import type { OnboardingData } from "@/components/onboarding/onboarding-types";
import {
  hasOnboardingProject,
  readOnboardingData,
} from "@/lib/onboarding-storage";
import { useEffect, useState } from "react";

export function useOnboardingData() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(readOnboardingData());
    setLoaded(true);
  }, []);

  return {
    data,
    loaded,
    hasProject: hasOnboardingProject(data),
  };
}
