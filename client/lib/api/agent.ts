export type BriskErrorCode =
  | "INVALID_INPUT"
  | "WORKSPACE_NOT_FOUND"
  | "MODEL_FAILURE"
  | "INVALID_BREAKDOWN"
  | "DB_WRITE_FAILED";

export type BriskAgentHistoryItem = {
  type: string;
  content: unknown;
};

export type BriskAgentSuccessResponse = {
  success: true;
  projectId: string;
  phasesCreated: number;
  tasksCreated: number;
  history: BriskAgentHistoryItem[];
};

export type BriskAgentErrorResponse = {
  success: false;
  error: string;
  code: BriskErrorCode | null;
};

export type BriskAgentResponse = BriskAgentSuccessResponse | BriskAgentErrorResponse;

export type RunBriskAgentParams = {
  projectId: string;
  inputMessage: string;
  workspaceId?: string;
  userId?: string;
  projectName?: string;
  projectDescription?: string;
};

const getServerBaseUrl = () =>
  (
    process.env.NEXT_PUBLIC_API_URL ??
    "https://server-preset.danny-otgontsetseg.workers.dev"
  ).replace(/\/$/, "");

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // fallthrough
  }
  return `Agent request failed with status ${response.status}.`;
};

export const runBriskAgent = async (
  params: RunBriskAgentParams,
  authToken?: string | null,
): Promise<BriskAgentResponse> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${getServerBaseUrl()}/api/run-agent`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      projectId: params.projectId,
      inputMessage: params.inputMessage,
      workspaceId: params.workspaceId,
      userId: params.userId,
      projectName: params.projectName,
      projectDescription: params.projectDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as BriskAgentResponse;
};
