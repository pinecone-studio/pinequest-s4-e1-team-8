import { google } from "googleapis";
import type { TddBlock, TddLayoutState } from "@/lib/onboarding/tdd-types";

type GoogleAuthClient = {
  accessToken: string;
  refreshToken: string | null;
  expiryMs: number | null;
  clientId: string;
  clientSecret: string;
};

type MarkdownSegment =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet"; text: string; depth: number }
  | { kind: "table_row"; cells: string[] };

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function parseMarkdownLines(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed.trim()) {
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      segments.push({
        kind: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^(\s*)[-*]\s+(.+)$/);
    if (bulletMatch) {
      const depth = Math.floor(bulletMatch[1].length / 2);
      segments.push({ kind: "bullet", text: bulletMatch[2].trim(), depth });
      continue;
    }

    if (trimmed.includes("|")) {
      const cells = trimmed
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      if (isTableSeparatorRow(cells)) {
        continue;
      }

      if (cells.length > 0) {
        segments.push({ kind: "table_row", cells });
        continue;
      }
    }

    segments.push({ kind: "paragraph", text: trimmed.trim() });
  }

  return segments;
}

function headingNamedStyle(level: number): string {
  if (level <= 1) {
    return "HEADING_1";
  }
  if (level === 2) {
    return "HEADING_2";
  }
  return "HEADING_3";
}

type InlineStyle = "bold" | "italic" | "code";

type InlineRun = {
  start: number;
  end: number;
  style: InlineStyle;
};

// Mirrors the canvas preview's inline parsing (renderInline in TddDraggableCanvas)
// so the exported doc shows actual bold/italic/code formatting instead of literal
// **/`/* markdown characters.
function buildInlineRuns(text: string): { plainText: string; runs: InlineRun[] } {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter((part) => part.length > 0);

  let plainText = "";
  const runs: InlineRun[] = [];

  for (const part of parts) {
    let style: InlineStyle | null = null;
    let inner = part;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      style = "bold";
      inner = part.slice(2, -2);
    } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      style = "code";
      inner = part.slice(1, -1);
    } else if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      style = "italic";
      inner = part.slice(1, -1);
    }

    const start = plainText.length;
    plainText += inner;
    if (style && plainText.length > start) {
      runs.push({ start, end: plainText.length, style });
    }
  }

  return { plainText, runs };
}

function inlineStyleRequests(textStart: number, runs: InlineRun[]): Array<Record<string, unknown>> {
  return runs.map((run) => {
    const range = { startIndex: textStart + run.start, endIndex: textStart + run.end };
    if (run.style === "bold") {
      return { updateTextStyle: { range, textStyle: { bold: true }, fields: "bold" } };
    }
    if (run.style === "italic") {
      return { updateTextStyle: { range, textStyle: { italic: true }, fields: "italic" } };
    }
    return {
      updateTextStyle: {
        range,
        textStyle: {
          weightedFontFamily: { fontFamily: "Roboto Mono" },
          backgroundColor: { color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.96 } } },
        },
        fields: "weightedFontFamily,backgroundColor",
      },
    };
  });
}

function buildBlockRequests(block: TddBlock, startIndex: number): {
  requests: Array<Record<string, unknown>>;
  endIndex: number;
} {
  const requests: Array<Record<string, unknown>> = [];
  let cursor = startIndex;

  const insertText = (text: string) => {
    requests.push({
      insertText: {
        location: { index: cursor },
        text,
      },
    });
    const textStart = cursor;
    cursor += text.length;
    return textStart;
  };

  const titleStart = insertText(`${block.title}\n`);
  requests.push({
    updateParagraphStyle: {
      range: { startIndex: titleStart, endIndex: titleStart + block.title.length },
      paragraphStyle: { namedStyleType: "HEADING_1" },
      fields: "namedStyleType",
    },
  });

  const segments = parseMarkdownLines(block.content);
  for (const segment of segments) {
    if (segment.kind === "heading") {
      const { plainText, runs } = buildInlineRuns(segment.text);
      const start = insertText(`${plainText}\n`);
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: start,
            endIndex: start + plainText.length,
          },
          paragraphStyle: { namedStyleType: headingNamedStyle(segment.level) },
          fields: "namedStyleType",
        },
      });
      requests.push(...inlineStyleRequests(start, runs));
      continue;
    }

    if (segment.kind === "bullet") {
      const { plainText, runs } = buildInlineRuns(segment.text);
      const prefix = "  ".repeat(segment.depth);
      const line = `${prefix}• ${plainText}\n`;
      const start = insertText(line);
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: start + prefix.length,
            endIndex: start + prefix.length + 1,
          },
          textStyle: { bold: true },
          fields: "bold",
        },
      });
      requests.push(...inlineStyleRequests(start + prefix.length + 2, runs));
      continue;
    }

    if (segment.kind === "table_row") {
      let rowText = "";
      const allRuns: InlineRun[] = [];
      segment.cells.forEach((cell, cellIndex) => {
        const { plainText, runs } = buildInlineRuns(cell);
        const cellStart = rowText.length;
        rowText += plainText;
        for (const run of runs) {
          allRuns.push({ start: cellStart + run.start, end: cellStart + run.end, style: run.style });
        }
        if (cellIndex < segment.cells.length - 1) {
          rowText += " | ";
        }
      });
      const start = insertText(`${rowText}\n`);
      requests.push(...inlineStyleRequests(start, allRuns));
      continue;
    }

    const { plainText, runs } = buildInlineRuns(segment.text);
    const start = insertText(`${plainText}\n`);
    requests.push(...inlineStyleRequests(start, runs));
  }

  insertText("\n");

  return { requests, endIndex: cursor };
}

export async function createGoogleDocFromTddLayout(
  auth: GoogleAuthClient,
  projectName: string,
  layout: TddLayoutState,
): Promise<{ documentId: string; documentUrl: string }> {
  const oauth2Client = new google.auth.OAuth2(auth.clientId, auth.clientSecret);
  oauth2Client.setCredentials({
    access_token: auth.accessToken,
    refresh_token: auth.refreshToken ?? undefined,
    expiry_date: auth.expiryMs ?? undefined,
  });

  const docs = google.docs({ version: "v1", auth: oauth2Client });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const title = `${projectName.trim() || "Brisk Project"} — TDD Document`;
  const created = await docs.documents.create({
    requestBody: { title },
  });

  const documentId = created.data.documentId;
  if (!documentId) {
    throw new Error("Google Docs API did not return a document ID.");
  }

  const sortedBlocks = [...layout.blocks].sort((left, right) => left.order - right.order);
  const requests: Array<Record<string, unknown>> = [];
  let index = 1;

  for (const block of sortedBlocks) {
    const built = buildBlockRequests(block, index);
    requests.push(...built.requests);
    index = built.endIndex;
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }

  await drive.permissions.create({
    fileId: documentId,
    requestBody: { role: "writer", type: "user" },
    fields: "id",
  });

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

export async function refreshGoogleAccessToken(
  auth: GoogleAuthClient,
): Promise<{ accessToken: string; expiryMs: number }> {
  const oauth2Client = new google.auth.OAuth2(auth.clientId, auth.clientSecret);
  oauth2Client.setCredentials({
    refresh_token: auth.refreshToken ?? undefined,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token.");
  }

  return {
    accessToken: credentials.access_token,
    expiryMs: credentials.expiry_date ?? Date.now() + 3600 * 1000,
  };
}
