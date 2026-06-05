export type BriskAgentHistoryItem = {
  type: string;
  content: unknown;
};

export type BriskAgentResponse = {
  success: boolean;
  projectId: string;
  phasesCreated: number;
  tasksCreated: number;
  history: BriskAgentHistoryItem[];
};

export type RunBriskAgentParams = {
  projectId: string;
  inputMessage: string;
  workspaceId?: string;
  projectName?: string;
  projectDescription?: string;
};

const getServerBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:8788").replace(
    /\/$/,
    "",
  );

const readErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (body.error !== undefined) {
      return String(body.error);
    }
  } catch {
    return `Agent request failed with status ${response.status}.`;
  }

  return `Agent request failed with status ${response.status}.`;
};

export const runBriskAgent = async ({
  projectId,
  inputMessage,
  workspaceId,
  projectName,
  projectDescription,
}: RunBriskAgentParams): Promise<BriskAgentResponse> => {
  const response = await fetch(`${getServerBaseUrl()}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      inputMessage,
      workspaceId,
      projectName,
      projectDescription,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as BriskAgentResponse;
};
