import { and, eq, inArray, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../../schema/schema";
import {
  projectCollaborators,
  projects,
  subTeamMembers,
  subTeams,
  users,
} from "../../schema/schema";

type Db = DrizzleD1Database<typeof schema>;

export async function getUserEmail(db: Db, userId: string) {
  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.email?.toLowerCase() ?? null;
}

export async function userCanAccessProject(
  db: Db,
  projectId: string,
  userId: string,
) {
  const email = await getUserEmail(db, userId);
  if (!email) {
    return false;
  }

  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);
  if (owned) {
    return true;
  }

  const [collaborator] = await db
    .select({ id: projectCollaborators.id })
    .from(projectCollaborators)
    .where(
      and(
        eq(projectCollaborators.projectId, projectId),
        sql`lower(${projectCollaborators.email}) = ${email}`,
      ),
    )
    .limit(1);
  if (collaborator) {
    return true;
  }

  const subTeamRows = await db
    .select({ id: subTeams.id })
    .from(subTeams)
    .where(eq(subTeams.projectId, projectId));

  if (subTeamRows.length === 0) {
    return false;
  }

  const [member] = await db
    .select({ id: subTeamMembers.id })
    .from(subTeamMembers)
    .where(
      and(
        eq(subTeamMembers.userId, userId),
        inArray(
          subTeamMembers.subTeamId,
          subTeamRows.map((row) => row.id),
        ),
      ),
    )
    .limit(1);

  return Boolean(member);
}

export async function listAccessibleProjectIds(db: Db, userId: string) {
  const email = await getUserEmail(db, userId);
  const ids = new Set<string>();

  const owned = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, userId));
  for (const row of owned) {
    ids.add(row.id);
  }

  if (email) {
    const collaborators = await db
      .select({ projectId: projectCollaborators.projectId })
      .from(projectCollaborators)
      .where(sql`lower(${projectCollaborators.email}) = ${email}`);
    for (const row of collaborators) {
      ids.add(row.projectId);
    }
  }

  const teamProjects = await db
    .select({ projectId: subTeams.projectId })
    .from(subTeamMembers)
    .innerJoin(subTeams, eq(subTeamMembers.subTeamId, subTeams.id))
    .where(eq(subTeamMembers.userId, userId));

  for (const row of teamProjects) {
    ids.add(row.projectId);
  }

  return [...ids];
}
