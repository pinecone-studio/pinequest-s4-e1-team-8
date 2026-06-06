type ProxyMeetingRequestOptions = {
  body?: unknown;
  method: "GET" | "POST";
  path: string;
};

const LOCAL_BACKEND_FALLBACK_URL = "http://localhost:8788";

const getNormalizedBaseUrl = (url: string) => url.replace(/\/$/, "");

const getBackendBaseUrls = () => {
  const genericUrls = [process.env.API_URL, process.env.NEXT_PUBLIC_API_URL];
  const shouldPreferLocalFallback =
    process.env.NODE_ENV !== "production" &&
    genericUrls.some(
      (url) => getNormalizedBaseUrl(url ?? "") === "http://localhost:8787"
    );
  const configuredUrls = [
    process.env.MEETING_API_URL,
    process.env.BACKEND_API_URL,
    shouldPreferLocalFallback ? LOCAL_BACKEND_FALLBACK_URL : undefined,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NODE_ENV !== "production" && !shouldPreferLocalFallback
      ? LOCAL_BACKEND_FALLBACK_URL
      : undefined,
  ]
    .filter((url): url is string => Boolean(url))
    .map(getNormalizedBaseUrl);
  const uniqueUrls = [...new Set(configuredUrls)];

  if (
    process.env.NODE_ENV !== "production" &&
    !uniqueUrls.includes(LOCAL_BACKEND_FALLBACK_URL)
  ) {
    uniqueUrls.push(LOCAL_BACKEND_FALLBACK_URL);
  }

  return uniqueUrls;
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

const getTargetUrl = (baseUrl: string, path: string) => `${baseUrl}${path}`;

const logProxyFailure = ({
  body,
  error,
  status,
  targetUrl,
}: {
  body?: unknown;
  error?: unknown;
  status?: number;
  targetUrl: string;
}) => {
  console.error("[meeting] API proxy failed", {
    body,
    error: error instanceof Error ? error.message : undefined,
    status,
    targetUrl,
  });
};

export const proxyMeetingRequest = async ({
  body,
  method,
  path,
}: ProxyMeetingRequestOptions) => {
  const targetUrls = getBackendBaseUrls().map((baseUrl) =>
    getTargetUrl(baseUrl, path)
  );
  let lastError: unknown = null;

  if (!targetUrls.length) {
    return Response.json(
      { error: "Meeting backend URL is not configured." },
      { status: 500 }
    );
  }

  for (const targetUrl of targetUrls) {
    try {
      const response = await fetch(targetUrl, {
        body: body ? JSON.stringify(body) : undefined,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        method,
      });
      const responseBody = await readResponseBody(response);

      if (!response.ok) {
        logProxyFailure({
          body: responseBody,
          status: response.status,
          targetUrl,
        });

        return Response.json(
          { error: getProxyError(responseBody, response.status) },
          { status: response.status }
        );
      }

      return Response.json(responseBody, { status: response.status });
    } catch (error) {
      lastError = error;
      logProxyFailure({ error, targetUrl });
    }
  }

  return Response.json(
    { error: (lastError as Error | null)?.message ?? "Meeting proxy failed." },
    { status: 500 }
  );
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
