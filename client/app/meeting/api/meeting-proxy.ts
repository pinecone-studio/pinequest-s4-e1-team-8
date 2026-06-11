type ProxyMeetingRequestOptions = {
  body?: unknown;
  method: "DELETE" | "GET" | "POST";
  path: string;
};

const DEPLOYED_BACKEND_FALLBACK_URL =
  "https://server-preset.danny-otgontsetseg.workers.dev";

const stripUnmatchedTrailingBrackets = (value: string) => {
  let normalizedValue = value;
  const openBrackets = [...normalizedValue].filter((char) => char === "[").length;
  let closeBrackets = [...normalizedValue].filter((char) => char === "]").length;

  while (normalizedValue.endsWith("]") && closeBrackets > openBrackets) {
    normalizedValue = normalizedValue.slice(0, -1);
    closeBrackets -= 1;
  }

  return normalizedValue;
};

const getNormalizedBaseUrl = (url: string) => {
  const sanitizedUrl = stripUnmatchedTrailingBrackets(url.trim()).replace(
    /\/+$/,
    "",
  );

  try {
    return new URL(sanitizedUrl).toString().replace(/\/+$/, "");
  } catch {
    console.warn("[meeting] Ignoring invalid backend URL", { url });
    return null;
  }
};

const getBackendBaseUrls = () => {
  const genericUrls = [process.env.API_URL, process.env.NEXT_PUBLIC_API_URL];
  const normalizedGenericUrls = genericUrls
    .filter((url): url is string => Boolean(url))
    .map(getNormalizedBaseUrl)
    .filter((url): url is string => Boolean(url));
  const hasConfiguredGenericUrl = normalizedGenericUrls.length > 0;
  const configuredUrls = [
    process.env.MEETING_API_URL,
    process.env.BACKEND_API_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    hasConfiguredGenericUrl ? undefined : DEPLOYED_BACKEND_FALLBACK_URL,
  ]
    .filter((url): url is string => Boolean(url))
    .map(getNormalizedBaseUrl)
    .filter((url): url is string => Boolean(url));
  const uniqueUrls = [...new Set(configuredUrls)];

  if (
    !hasConfiguredGenericUrl &&
    !uniqueUrls.includes(DEPLOYED_BACKEND_FALLBACK_URL)
  ) {
    uniqueUrls.push(DEPLOYED_BACKEND_FALLBACK_URL);
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

const getTargetUrl = (baseUrl: string, path: string) =>
  new URL(path, `${baseUrl}/`).toString();

const isLocalBackendUrl = (targetUrl: string) => {
  try {
    const hostname = new URL(targetUrl).hostname;

    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const getProxyConnectionError = (error: unknown, targetUrl: string) => {
  const errorMessage =
    error instanceof Error ? error.message : "Meeting proxy failed.";

  if (isLocalBackendUrl(targetUrl)) {
    return (
      `Local meeting backend is unavailable at ${targetUrl}. ` +
      "Start the server Worker with `cd server && bunx wrangler dev --port 8787`, then refresh Meeting Summaries."
    );
  }

  return errorMessage;
};

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
    {
      error: lastError
        ? getProxyConnectionError(lastError, targetUrls.at(-1) ?? "")
        : "Meeting proxy failed.",
    },
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

export const proxyMeetingDeleteRequest = async (path: string) =>
  proxyMeetingRequest({ method: "DELETE", path });
