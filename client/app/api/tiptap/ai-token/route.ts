import jwt from "jsonwebtoken";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.TIPTAP_CONTENT_AI_SECRET;
  const appId = process.env.NEXT_PUBLIC_TIPTAP_CONTENT_AI_APP_ID;

  if (!secret || !appId) {
    return NextResponse.json(
      {
        error:
          "TipTap Content AI is not configured (NEXT_PUBLIC_TIPTAP_CONTENT_AI_APP_ID, TIPTAP_CONTENT_AI_SECRET).",
      },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign({ sub: userId }, secret, { expiresIn: "2h" });

  return NextResponse.json({ appId, token });
}
