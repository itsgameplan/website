import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/messages";
import { aiConfigured, describeAiError, draftReply, DRAFT_MODEL } from "@/lib/ai";

/** POST /api/messages/:id/draft — admins only: an AI-drafted first reply (Neon AI Gateway). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!aiConfigured()) return NextResponse.json({ error: "The AI Gateway is not configured (NEON_AI_GATEWAY_* missing)." }, { status: 503 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Bad message id." }, { status: 400 });
  const message = await getMessage(id);
  if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  try {
    const draft = await draftReply(message);
    return NextResponse.json({ draft, model: DRAFT_MODEL }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/messages/draft] AI Gateway call failed:", err);
    const { status, message: error } = describeAiError(err);
    return NextResponse.json({ error }, { status });
  }
}
