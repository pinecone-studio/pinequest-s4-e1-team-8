const BASE_URL = process.env.API_URL ?? "http://localhost:8788";
const TOKEN = process.env.CLERK_TEST_TOKEN ?? "";

type WorkspaceTestCase = {
  label: string;
  workspaceId: string;
  projectId: string;
  inputMessage: string;
};

type AgentResponse = {
  success: boolean;
  projectId?: string;
  phasesCreated?: number;
  tasksCreated?: number;
  error?: string;
  code?: string | null;
  field?: string;
};

const WORKSPACES: WorkspaceTestCase[] = [
  {
    label: "Workspace A — landing page",
    workspaceId: "workspace-test-1",
    projectId: "project-test-1",
    inputMessage: "Build a landing page with hero section and contact form",
  },
  {
    label: "Workspace B — API integration",
    workspaceId: "workspace-test-2",
    projectId: "project-test-2",
    inputMessage: "Integrate a third-party payments API with error handling",
  },
];

function buildAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  };
}

async function runWorkspaceTest(tc: WorkspaceTestCase): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/run-agent`, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify({
      inputMessage: tc.inputMessage,
      projectId: tc.projectId,
      workspaceId: tc.workspaceId,
    }),
  });

  const body = (await res.json()) as AgentResponse;

  console.log(`\n[${tc.label}]`);
  console.log(`  status : ${res.status}`);
  console.log(`  success: ${body.success}`);

  if (body.success) {
    console.log(`  phases : ${body.phasesCreated}`);
    console.log(`  tasks  : ${body.tasksCreated}`);
    console.log(`  project: ${body.projectId}`);
  } else {
    console.log(`  error  : ${body.error}`);
    if (body.code) console.log(`  code   : ${body.code}`);
  }
}

async function runUnauthenticatedTest(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/run-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputMessage: "test",
      projectId: "proj-unauth",
      workspaceId: "ws-unauth",
    }),
  });

  const body = (await res.json()) as AgentResponse;

  console.log("\n[Unauthenticated request]");
  console.log(`  status : ${res.status}`);
  console.log(`  error  : ${body.error}`);

  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
}

async function main(): Promise<void> {
  if (!TOKEN) {
    console.error("CLERK_TEST_TOKEN is not set. Export it before running this script.");
    process.exit(1);
  }

  console.log(`Running agent tests against ${BASE_URL}`);

  await runUnauthenticatedTest();

  for (const tc of WORKSPACES) {
    await runWorkspaceTest(tc);
  }

  console.log("\nAll test cases completed.");
}

main().catch((err) => {
  console.error("Test suite failed:", (err as Error).message);
  process.exit(1);
});
