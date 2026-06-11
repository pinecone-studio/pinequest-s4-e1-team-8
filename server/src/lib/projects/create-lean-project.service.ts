import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { nanoid } from "nanoid";
import * as schema from "../../schema/schema";
import {
  inviteTokens,
  milestones,
  projects,
  workspaces,
} from "../../schema/schema";
import { DEFAULT_WORKSPACE_ID } from "../tasks/task-defaults";
import type {
  CreateLeanProjectInput,
  CreateLeanProjectResult,
} from "./create-lean-project.types";

type Db = DrizzleD1Database<typeof schema>;

const INVITE_TOKEN_BYTES = 32;

export class CreateLeanProjectError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "CreateLeanProjectError";
  }
}

export function generateSecureInviteToken(): string {
  const bytes = new Uint8Array(INVITE_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `inv_${encoded}`;
}

export function buildInviteJoinLink(
  clientAppUrl: string | undefined,
  token: string,
): string {
  const path = `/invite/join?token=${encodeURIComponent(token)}`;
  if (!clientAppUrl?.trim()) {
    return path;
  }
  return `${clientAppUrl.replace(/\/$/, "")}${path}`;
}

async function ensureWorkspace(db: Db, workspaceId: string) {
  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (existing) {
    return;
  }

  await db.insert(workspaces).values({
    id: workspaceId,
    name: "Pinequest",
    slug: workspaceId.replace(/^ws_/, ""),
  });
}

function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("constraint") ||
    message.includes("foreign key") ||
    message.includes("unique")
  );
}

export async function createLeanProject(
  db: Db,
  ownerId: string,
  input: CreateLeanProjectInput,
  clientAppUrl?: string,
): Promise<CreateLeanProjectResult> {
  const workspaceId = input.workspaceId?.trim() || DEFAULT_WORKSPACE_ID;
  const projectId = `proj_${nanoid(12).replace(/-/g, "")}`;
  const inviteTokenId = `invt_${nanoid(10)}`;
  const token = generateSecureInviteToken();
  const now = new Date();
  const expiresAt = addDays(now, input.inviteExpiresInDays ?? 14);

  await ensureWorkspace(db, workspaceId);

  const milestoneRows = input.milestones.map((milestone, index) => ({
    id: `ms_${nanoid(10)}`,
    projectId,
    title: milestone.title.trim(),
    description: milestone.description?.trim() || null,
    dueDate: milestone.dueDate?.trim() || null,
    sequenceOrder: index,
    createdAt: now,
    updatedAt: now,
  }));

  const statements = [
    db.insert(projects).values({
      id: projectId,
      workspaceId,
      ownerId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      timezone: input.timezone?.trim() || null,
      inviteToken: token,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(inviteTokens).values({
      id: inviteTokenId,
      token,
      projectId,
      expiresAt,
      createdAt: now,
    }),
    ...milestoneRows.map((row) => db.insert(milestones).values(row)),
  ];

  try {
    await db.batch(statements as [(typeof statements)[0], ...typeof statements]);
  } catch (error) {
    if (isConstraintError(error)) {
      throw new CreateLeanProjectError(
        "Failed to create project due to a database constraint violation",
        409,
      );
    }
    throw error;
  }

  return {
    projectId,
    inviteToken: token,
    inviteLink: buildInviteJoinLink(clientAppUrl, token),
    expiresAt: expiresAt.toISOString(),
    milestones: milestoneRows.map((row) => ({
      id: row.id,
      title: row.title,
      sequenceOrder: row.sequenceOrder,
    })),
  };
}
