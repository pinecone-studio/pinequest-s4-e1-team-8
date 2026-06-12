import { buildBackendAuthHeaders } from "@/lib/api/backend-auth";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AgentRunBody = {
  blockTitle?: string;
  content?: string;
  instruction?: string;
  selectedText?: string;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AgentRunBody | null;
  const instruction = body?.instruction?.trim();
  const content = body?.content?.trim() ?? "";
  const blockTitle = body?.blockTitle?.trim() ?? "TDD section";
  const selectedText = body?.selectedText?.trim() ?? "";

  if (!instruction) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  const contentAiSecret = process.env.TIPTAP_CONTENT_AI_SECRET;
  const contentAiAppId = process.env.NEXT_PUBLIC_TIPTAP_CONTENT_AI_APP_ID;
  const apiUrl = process.env.TIPTAP_CONTENT_AI_API_URL ?? "https://api.tiptap.dev";

  if (contentAiSecret && contentAiAppId) {
    try {
      const tiptapResponse = await fetch(`${apiUrl}/v1/ai/agent/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${contentAiSecret}`,
          "X-Tiptap-App-Id": contentAiAppId,
        },
        body: JSON.stringify({
          instruction,
          document: content,
          selectedText: selectedText || undefined,
          blockTitle,
        }),
      });

      if (tiptapResponse.ok) {
        const payload = (await tiptapResponse.json()) as {
          content?: string;
          message?: string;
        };
        return NextResponse.json({
          content: payload.content ?? content,
          message: payload.message ?? "Applied TipTap agent edits.",
          source: "tiptap-cloud",
        });
      }
    } catch {
      // Fall through to Brisk refine endpoint.
    }
  }

  const apiBase =
    process.env.LOCAL_API_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787";

  const { getToken } = await auth();
  const token = await getToken();
  const headers = await buildBackendAuthHeaders(async () => token);

  const refineResponse = await fetch(`${apiBase}/api/onboarding/refine-selection`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      blockTitle,
      paragraphContext: content,
      selectedText: selectedText || content.slice(0, 1200),
      instruction,
    }),
  });

  if (!refineResponse.ok) {
    const errorText = await refineResponse.text().catch(() => "Agent request failed");
    return NextResponse.json({ error: errorText }, { status: refineResponse.status });
  }

  const refined = (await refineResponse.json()) as { refinedText?: string };
  const refinedText = refined.refinedText?.trim();
  if (!refinedText) {
    return NextResponse.json({ error: "Agent returned no edits" }, { status: 502 });
  }

  let nextContent = content;
  if (selectedText && content.includes(selectedText)) {
    nextContent = content.replace(selectedText, refinedText);
  } else if (selectedText) {
    nextContent = `${content}\n\n${refinedText}`;
  } else {
    nextContent = refinedText;
  }

  return NextResponse.json({
    content: nextContent,
    message: "Applied agent edits.",
    source: "brisk-refine",
  });
}
