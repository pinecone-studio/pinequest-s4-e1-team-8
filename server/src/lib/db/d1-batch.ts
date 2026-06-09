import type { getDrizzleDb } from "./db";

const D1_BATCH_LIMIT = 100;

type DrizzleDb = ReturnType<typeof getDrizzleDb>;
type BatchItem = Parameters<DrizzleDb["batch"]>[0][number];

export async function runD1Statements(
  db: DrizzleDb,
  statements: BatchItem[],
): Promise<void> {
  if (statements.length === 0) {
    return;
  }

  if (statements.length === 1) {
    await statements[0];
    return;
  }

  for (let index = 0; index < statements.length; index += D1_BATCH_LIMIT) {
    const chunk = statements.slice(index, index + D1_BATCH_LIMIT);

    if (chunk.length === 1) {
      await chunk[0];
      continue;
    }

    await db.batch(chunk as [BatchItem, ...BatchItem[]]);
  }
}
