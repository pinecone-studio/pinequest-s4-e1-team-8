import { clientApi } from "@/app/lib/client-api";

const DEV_USER_ID = "user_wr";

export function getGithubRepo(): { owner: string; repo: string } | null {
  const value = process.env.NEXT_PUBLIC_GITHUB_REPO;
  if (!value?.includes("/")) return null;
  const [owner, repo] = value.split("/");
  return owner && repo ? { owner, repo } : null;
}

export function redirectToGithubConnect() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";
  window.location.href = `${api}/integrations/github/connect?userId=${DEV_USER_ID}`;
}

export async function syncGithubIssues() {
  const repo = getGithubRepo();
  if (!repo) return;

  await clientApi.post("/integrations/github/sync", {
    userId: DEV_USER_ID,
    owner: repo.owner,
    repo: repo.repo,
  });
}
