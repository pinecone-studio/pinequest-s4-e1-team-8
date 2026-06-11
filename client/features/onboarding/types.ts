import type { z } from "zod";
import type { projectSetupBaseSchema } from "./schemas/onboarding-schema";

export type WizardStep = "linking" | "setup" | "confirm";

export type ProjectSetupValues = z.infer<typeof projectSetupBaseSchema>;

export type AccountLinkingState = {
  githubConnected: boolean;
  githubLogin?: string;
  asanaConnected: boolean;
  asanaUserName?: string;
};
