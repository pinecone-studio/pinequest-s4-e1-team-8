import { eq } from "drizzle-orm";
import type { getDrizzleDb } from "../lib/db/db";
import { syncMappings } from "../schema/schema";
import { mapGithubIssueToAsanaTask } from "./github";
import { createTask } from "./asana";
import type { GitHubIssue } from "./github";

type DB = ReturnType<typeof getDrizzleDb>;

export const syncIssueToAsana = async (
  db: DB,
  issue: GitHubIssue,
  githubRepoId: string,
): Promise<void> => {
  const mapping = await db.query.syncMappings.findFirst({
    where: eq(syncMappings.githubRepoId, githubRepoId),
    with: { user: true },
  });

  if (!mapping) return;

  const { user } = mapping;
  if (!user.encryptedAsanaToken) {
    throw new Error(`User ${user.id} has no Asana token configured`);
  }

  // TODO: decrypt user.encryptedAsanaToken with ENCRYPTION_KEY before use.
  const asanaToken = user.encryptedAsanaToken;
  const taskPayload = mapGithubIssueToAsanaTask(issue, mapping.asanaProjectGid);
  await createTask(asanaToken, taskPayload);
};
