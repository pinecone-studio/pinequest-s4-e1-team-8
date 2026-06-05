export type BriskAgentResponse = {
  success: boolean;
  history: any[];
};

export type RunBriskAgentParams = {
  projectId: string;
  inputMessage: string;
};

const getServerBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001").replace(
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
}: RunBriskAgentParams): Promise<BriskAgentResponse> => {
  const response = await fetch(`${getServerBaseUrl()}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, inputMessage }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as BriskAgentResponse;
};
