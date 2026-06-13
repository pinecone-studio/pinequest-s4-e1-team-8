type MeetingApiOptions = {
  body?: unknown;
  method?: "DELETE" | "GET" | "POST";
};

type ClerkWindow = Window & {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>;
    } | null;
  };
};

const getErrorMessage = async (response: Response) => {
  const fallback = `Meeting API request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as { error?: string };

    return data.error ?? fallback;
  } catch {
    return fallback;
  }
};

const getClerkToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  try {
    return (await (window as ClerkWindow).Clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
};

export const meetingApi = async <TResponse>(
  path: string,
  options: MeetingApiOptions = {}
) => {
  const token = await getClerkToken();
  const headers: Record<string, string> = {};

  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(path, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    headers: Object.keys(headers).length ? headers : undefined,
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as TResponse;
};
