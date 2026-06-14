import { getBackendBaseUrls } from "@/app/meeting/api/meeting-proxy";

const getTargetUrl = (baseUrl: string, path: string) =>
  new URL(path, `${baseUrl}/`).toString();

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

  return `Recording backend request failed with status ${status}.`;
};

// Forwards a multipart/form-data upload to the Worker. The raw body and its
// boundary-bearing content-type header are preserved verbatim; the Clerk
// Authorization header is passed through so the backend can resolve the user.
export const proxyRecordingUpload = async (request: Request, path: string) => {
  const targetUrls = getBackendBaseUrls().map((baseUrl) =>
    getTargetUrl(baseUrl, path),
  );

  if (!targetUrls.length) {
    return Response.json(
      { error: "Recording backend URL is not configured." },
      { status: 500 },
    );
  }

  const body = await request.arrayBuffer();
  const headers: Record<string, string> = {};
  const contentType = request.headers.get("Content-Type");
  const authorization = request.headers.get("Authorization");
  if (contentType) headers["Content-Type"] = contentType;
  if (authorization) headers["Authorization"] = authorization;

  let lastError: unknown = null;

  for (const targetUrl of targetUrls) {
    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body,
      });
      const responseBody = await readResponseBody(response);

      if (!response.ok) {
        return Response.json(
          { error: getProxyError(responseBody, response.status) },
          { status: response.status },
        );
      }

      return Response.json(responseBody, { status: response.status });
    } catch (error) {
      lastError = error;
      console.error("[recordings] Upload proxy failed", { error, targetUrl });
    }
  }

  return Response.json(
    {
      error:
        lastError instanceof Error
          ? lastError.message
          : "Recording upload proxy failed.",
    },
    { status: 500 },
  );
};
