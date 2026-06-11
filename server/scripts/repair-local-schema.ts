/**
 * Repairs local D1 when wrangler migrations are out of sync (tables created manually
 * or duplicate migration files blocked `db:migrate:local`).
 */
const DB_NAME = "server-preset-db";

const OPTIONAL_ALTER_STATEMENTS = [
  "ALTER TABLE `github_integrations` ADD `github_project_id` text",
  "ALTER TABLE `users` ADD `encrypted_google_access_token` text",
  "ALTER TABLE `users` ADD `encrypted_google_refresh_token` text",
  "ALTER TABLE `users` ADD `google_token_expiry` integer",
  "ALTER TABLE `projects` ADD `timezone` text",
  "ALTER TABLE `projects` ADD `github_connected` integer DEFAULT 0 NOT NULL",
  "ALTER TABLE `projects` ADD `asana_connected` integer DEFAULT 0 NOT NULL",
  "ALTER TABLE `projects` ADD `is_github_disconnected` integer DEFAULT 0 NOT NULL",
  "ALTER TABLE `projects` ADD `is_asana_disconnected` integer DEFAULT 0 NOT NULL",
  "ALTER TABLE `projects` ADD `invite_token` text",
  "ALTER TABLE `meeting_transcriptions` ADD `participant_names` text",
];

const PENDING_MIGRATIONS = [
  "0007_tan_timeslip.sql",
  "0007_yielding_molly_hayes.sql",
  "0009_rapid_fat_cobra.sql",
  "0010_asana_integrations.sql",
  "0011_project_onboarding.sql",
  "0012_analytics_metrics.sql",
  "0012_project_invite_token.sql",
  "0012_report_snapshots.sql",
  "0013_project_risks.sql",
  "0013_task_sequence_dependencies.sql",
  "0014_task_reprioritize_fields.sql",
  "0015_task_sync_state.sql",
  "0016_github_board_columns.sql",
  "0017_onboarding_sessions.sql",
  "0018_mixed_centennial.sql",
  "0018_onboarding_discovery_state.sql",
  "0019_create_lean_tables.sql",
  "0020_eager_cargill.sql",
];

async function runWrangler(args: string[]) {
  const proc = Bun.spawn(["bunx", "wrangler", "d1", "execute", DB_NAME, "--local", ...args], {
    cwd: import.meta.dir + "/..",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

async function runOptionalAlter(sql: string) {
  const { stderr, exitCode } = await runWrangler(["--command", sql]);
  if (exitCode === 0) {
    console.log(`✓ ${sql}`);
    return;
  }

  if (stderr.includes("duplicate column name")) {
    console.log(`· already applied: ${sql}`);
    return;
  }

  throw new Error(`Failed: ${sql}\n${stderr}`);
}

async function markMigration(name: string) {
  const sql = `INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('${name}', datetime('now'))`;
  const { stderr, exitCode } = await runWrangler(["--command", sql]);
  if (exitCode !== 0) {
    throw new Error(`Failed to mark migration ${name}\n${stderr}`);
  }
}

async function main() {
  const { stderr, exitCode } = await runWrangler([
    "--file=./scripts/repair-local-schema.sql",
  ]);
  if (exitCode !== 0) {
    throw new Error(`repair-local-schema.sql failed\n${stderr}`);
  }
  console.log("✓ repair-local-schema.sql");

  for (const sql of OPTIONAL_ALTER_STATEMENTS) {
    await runOptionalAlter(sql);
  }

  const { stderr: indexStderr, exitCode: indexExitCode } = await runWrangler([
    "--command",
    "CREATE UNIQUE INDEX IF NOT EXISTS `projects_invite_token_unique` ON `projects` (`invite_token`)",
  ]);
  if (indexExitCode !== 0 && !indexStderr.includes("already exists")) {
    throw new Error(`Failed to create invite_token index\n${indexStderr}`);
  }
  console.log("✓ projects_invite_token_unique");

  for (const name of PENDING_MIGRATIONS) {
    await markMigration(name);
    console.log(`✓ marked migration ${name}`);
  }

  console.log("\nLocal D1 schema repair complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
