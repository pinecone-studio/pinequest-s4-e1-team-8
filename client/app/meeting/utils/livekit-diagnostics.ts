export type LivekitTokenDiagnostics = {
  expiresAt?: number;
  identity?: string;
  issuer?: string;
  room?: string;
  roomJoin?: boolean;
};

export type LivekitUrlDiagnostics = {
  host: string;
  href: string;
  isValid: boolean;
  protocol: string;
};

type TokenPayload = {
  exp?: number;
  iss?: string;
  sub?: string;
  video?: {
    room?: string;
    roomJoin?: boolean;
  };
};

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );

  return atob(padded);
};

export const getLivekitUrlDiagnostics = (
  livekitUrl: string
): LivekitUrlDiagnostics => {
  try {
    const url = new URL(livekitUrl);

    return {
      host: url.host,
      href: url.href,
      isValid: url.protocol === "ws:" || url.protocol === "wss:",
      protocol: url.protocol,
    };
  } catch {
    return { host: "", href: livekitUrl, isValid: false, protocol: "" };
  }
};

export const getLivekitTokenDiagnostics = (
  token: string
): LivekitTokenDiagnostics => {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split(".")[1] ?? "")) as
      | TokenPayload
      | undefined;

    return {
      expiresAt: payload?.exp,
      identity: payload?.sub,
      issuer: payload?.iss,
      room: payload?.video?.room,
      roomJoin: payload?.video?.roomJoin,
    };
  } catch {
    return {};
  }
};

export const getLivekitRootError = (error: unknown) => {
  if (error instanceof Error) {
    const isPeerConnectionManagerClose =
      error.message.includes("PC manager") && error.message.includes("closed");

    if (!isPeerConnectionManagerClose) return error.message;
  }

  if (error && typeof error === "object" && "cause" in error) {
    const cause = (error as { cause?: unknown }).cause;

    if (cause instanceof Error) return cause.message;
    if (typeof cause === "string") return cause;
  }

  return error instanceof Error
    ? "LiveKit connection closed before the peer connection was ready."
    : String(error);
};

export const getLivekitErrorLogPayload = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    const entries = Object.entries(error);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return error;
};
