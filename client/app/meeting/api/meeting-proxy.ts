type ProxyMeetingRequestOptions = {
  body?: unknown;
  method: "GET" | "POST";
  path: string;
};

const getBackendBaseUrl = () => {
  const baseUrl = process.env.API_URL ?? process.env.BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error("API_URL or BACKEND_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
};

const readResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
};

const getProxyError = (body: unknown, status: number) => {
  if (body && typeof body === "object" && "error" in body) {
    return String((body as { error: unknown }).error);
  }

  return `Meeting backend request failed with status ${status}.`;
};

export const proxyMeetingRequest = async ({
  body,
  method,
  path,
}: ProxyMeetingRequestOptions) => {
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      method,
    });
    const responseBody = await readResponseBody(response);

    if (!response.ok) {
      return Response.json(
        { error: getProxyError(responseBody, response.status) },
        { status: response.status }
      );
    }

    return Response.json(responseBody, { status: response.status });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};

export const proxyMeetingPostRequest = async (
  request: Request,
  path: string
) => {
  try {
    return proxyMeetingRequest({
      body: await request.json(),
      method: "POST",
      path,
    });
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
};

export const proxyMeetingGetRequest = async (path: string) =>
  proxyMeetingRequest({ method: "GET", path });
