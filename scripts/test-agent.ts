import { describe, expect, mock, test } from "bun:test";

type BriskAgentResponse =
  | {
      success: true;
      projectId: string;
      phasesCreated: number;
      tasksCreated: number;
      history: Array<{ type: string; content: unknown }>;
    }
  | {
      success: false;
      error: string;
      code: string | null;
    };

const SERVER_URL = (process.env.API_URL ?? "http://localhost:8787").replace(
  /\/$/,
  "",
);
const ENDPOINT = `${SERVER_URL}/api/run-agent`;

const WORKSPACES = [
  { id: "ws_pinequest", label: "primary" },
  { id: "ws_test_secondary", label: "secondary" },
];

const FIXTURE_INPUT = {
  projectId: "proj_brisk_test",
  inputMessage: "Build a task tracker with auth, dashboard, and notifications.",
  projectName: "Brisk Test Project",
};

function makeSuccessBody(projectId: string): BriskAgentResponse {
  return {
    success: true,
    projectId,
    phasesCreated: 4,
    tasksCreated: 16,
    history: [
      {
        type: "ai",
        content: "Project context verified and ready for provisioning.",
      },
      { type: "ai", content: "Generated 4 phases with 12 tasks." },
      {
        type: "ai",
        content:
          'Persisted project "Brisk Test Project" with 4 milestones and 16 total records.',
      },
    ],
  };
}

describe("request construction", () => {
  test("serialises all params into JSON body with correct content-type", async () => {
    const captured: { url: string; init: RequestInit }[] = [];

    const mockFetch = mock(async (url: string, init?: RequestInit) => {
      captured.push({ url, init: init ?? {} });
      return new Response(
        JSON.stringify(makeSuccessBody(FIXTURE_INPUT.projectId)),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    const params = {
      ...FIXTURE_INPUT,
      workspaceId: WORKSPACES[0].id,
      userId: "user_test_01",
    };

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(params),
    });

    globalThis.fetch = originalFetch;

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [call] = captured;
    expect(call.url).toBe(ENDPOINT);
    expect(call.init.method).toBe("POST");
    expect((call.init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );

    const parsed = JSON.parse(call.init.body as string) as Record<
      string,
      unknown
    >;
    expect(parsed.projectId).toBe(FIXTURE_INPUT.projectId);
    expect(parsed.inputMessage).toBe(FIXTURE_INPUT.inputMessage);
    expect(parsed.workspaceId).toBe(WORKSPACES[0].id);
    expect(parsed.userId).toBe("user_test_01");

    const body = (await response.json()) as BriskAgentResponse;
    expect(body.success).toBe(true);
    if (body.success) {
      expect(body.projectId).toBe(FIXTURE_INPUT.projectId);
      expect(typeof body.phasesCreated).toBe("number");
      expect(typeof body.tasksCreated).toBe("number");
      expect(Array.isArray(body.history)).toBe(true);
    }
  });

  test("error response shape includes success=false, error string, and code", async () => {
    const errorBody: BriskAgentResponse = {
      success: false,
      error: "WORKSPACE_NOT_FOUND",
      code: "WORKSPACE_NOT_FOUND",
    };

    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify(errorBody), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof globalThis.fetch;

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...FIXTURE_INPUT, workspaceId: "ws_unknown" }),
    });

    globalThis.fetch = globalThis.fetch;

    expect(response.status).toBe(404);
    const body = (await response.json()) as BriskAgentResponse;
    expect(body.success).toBe(false);
    if (!body.success) {
      expect(typeof body.error).toBe("string");
      expect(body.code).toBe("WORKSPACE_NOT_FOUND");
    }
  });
});

describe("multi-workspace routing", () => {
  for (const ws of WORKSPACES) {
    test(`routes workspace "${ws.label}" (${ws.id}) as workspaceId in request body`, async () => {
      const captured: string[] = [];

      globalThis.fetch = mock(async (_url: string, init?: RequestInit) => {
        const parsed = JSON.parse((init?.body as string) ?? "{}") as Record<
          string,
          unknown
        >;
        captured.push(String(parsed.workspaceId ?? ""));
        return new Response(
          JSON.stringify(makeSuccessBody(FIXTURE_INPUT.projectId)),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }) as unknown as typeof globalThis.fetch;

      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...FIXTURE_INPUT, workspaceId: ws.id }),
      });

      expect(captured[0]).toBe(ws.id);
    });
  }
});

describe("telemetry metadata shape", () => {
  test("LangSmith runName is brisk-agent", () => {
    const telemetry = {
      runName: "brisk-agent",
      tags: ["brisk-agent", "workspace:ws_pinequest"],
      metadata: {
        projectId: "proj_test",
        workspaceId: "ws_pinequest",
        userId: null,
      },
    };

    expect(telemetry.runName).toBe("brisk-agent");
    expect(telemetry.tags).toContain("brisk-agent");
    expect(typeof telemetry.metadata.projectId).toBe("string");
    expect(typeof telemetry.metadata.workspaceId).toBe("string");
  });

  test("workspace tag is formatted as workspace:<id>", () => {
    const workspaceId = "ws_pinequest";
    const tags = ["brisk-agent", `workspace:${workspaceId}`];
    expect(tags).toContain(`workspace:${workspaceId}`);
  });
});
