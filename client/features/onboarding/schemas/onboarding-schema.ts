import {
  isAsanaProjectMapped,
  isGithubProjectMapped,
  isGithubRepoMapped,
  type ProjectIntegrationMapping,
} from "@/services/integrations";
import { z } from "zod";

export const projectSetupBaseSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required"),
  githubRepoId: z.string().trim().min(1, "Select a GitHub repository"),
  githubRepoOwner: z.string().trim().min(1),
  githubRepoName: z.string().trim().min(1),
  githubRepoNodeId: z.string().optional(),
  githubProjectId: z.string().trim().min(1, "Select a GitHub project"),
  githubProjectTitle: z.string().trim().min(1),
  asanaWorkspaceGid: z.string().trim().min(1, "Select an Asana workspace"),
  asanaProjectGid: z.string().trim().min(1, "Select an Asana project"),
  asanaProjectName: z.string().trim().min(1),
});

export function createProjectSetupSchema(mappings: ProjectIntegrationMapping[]) {
  return projectSetupBaseSchema.superRefine((data, ctx) => {
    if (isGithubRepoMapped(mappings, data.githubRepoId)) {
      ctx.addIssue({
        code: "custom",
        message: "This GitHub repository is already linked to another Brisk project",
        path: ["githubRepoId"],
      });
    }

    if (isGithubProjectMapped(mappings, data.githubProjectId)) {
      ctx.addIssue({
        code: "custom",
        message: "This GitHub project is already linked to another Brisk project",
        path: ["githubProjectId"],
      });
    }

    if (isAsanaProjectMapped(mappings, data.asanaProjectGid)) {
      ctx.addIssue({
        code: "custom",
        message: "This Asana project is already linked to another Brisk project",
        path: ["asanaProjectGid"],
      });
    }
  });
}

export const projectSetupSchema = createProjectSetupSchema([]);

export const accountLinkingSchema = z.object({
  githubConnected: z.literal(true, {
    error: "Connect GitHub to continue",
  }),
  asanaConnected: z.literal(true, {
    error: "Connect Asana to continue",
  }),
});
