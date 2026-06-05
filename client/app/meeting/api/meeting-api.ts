type MeetingApiOptions = {
  body?: unknown;
  method?: "GET" | "POST";
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

export const meetingApi = async <TResponse>(
  path: string,
  options: MeetingApiOptions = {}
) => {
  const response = await fetch(path, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    method: options.method ?? "GET",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as TResponse;
};
