import type { GithubIntegration } from "../../schema/github-integration.model";
import {
  fetchOrgProjects,
  fetchUserProjects,
  type GithubProject,
} from "./projects";

function scoreProjectMatch(project: GithubProject, owner: string, repo: string) {
  const title = project.title.toLowerCase();
  const repoLower = repo.toLowerCase();
  const ownerLower = owner.toLowerCase();

  if (title === repoLower) return 100;
  if (title.includes(repoLower)) return 80;
  if (title.includes(ownerLower)) return 60;
  if (repoLower.includes(title)) return 50;
  return 0;
}

export async function resolveGithubBoardProjectId(
  token: string,
  integration: Pick<GithubIntegration, "githubProjectId">,
  owner: string,
  repo: string,
  requestedId?: string | null,
): Promise<string | null> {
  if (requestedId?.trim()) {
    return requestedId.trim();
  }

  if (integration.githubProjectId?.trim()) {
    return integration.githubProjectId.trim();
  }

  const [userProjects, orgProjects] = await Promise.all([
    fetchUserProjects(token),
    fetchOrgProjects(token, owner),
  ]);

  const candidates = [...orgProjects, ...userProjects].filter(
    (project, index, list) =>
      list.findIndex((entry) => entry.id === project.id) === index,
  );

  if (candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort((left, right) => {
    const scoreDelta =
      scoreProjectMatch(right, owner, repo) - scoreProjectMatch(left, owner, repo);
    if (scoreDelta !== 0) return scoreDelta;
    return Number(left.closed) - Number(right.closed);
  });

  return ranked[0]?.id ?? null;
}
