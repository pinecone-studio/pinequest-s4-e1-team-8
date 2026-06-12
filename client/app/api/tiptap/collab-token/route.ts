import jwt from "jsonwebtoken";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const secret = process.env.TIPTAP_COLLAB_JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "TipTap collaboration is not configured (TIPTAP_COLLAB_JWT_SECRET)." },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign(
    {
      sub: userId,
      allowedDocumentNames: ["tdd/*"],
    },
    secret,
    { expiresIn: "2h" },
  );

  return new NextResponse(token, {
    headers: { "Content-Type": "text/plain" },
  });
}
