import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { insertMessage, listMessages, MESSAGE_KINDS, parseMessage, type MessageKind } from "@/lib/messages";

/**
 * POST /api/messages — public: the site's forms store each submission here.
 * GET  /api/messages — admins only: ?kind=venture|advisory|contact&q=search&page=1&pageSize=25
 */

/* very small per-IP limiter for the public POST (per server instance) */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}
const clientIp = (req: NextRequest) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

export async function POST(req: NextRequest) {
  if (limited(clientIp(req))) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  // honeypot: bots tick the hidden box; pretend it worked and store nothing
  if (body && typeof body === "object" && (body as { botcheck?: unknown }).botcheck) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const parsed = parseMessage(body);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid message.", details: parsed.errors }, { status: 400 });

  try {
    const saved = await insertMessage(parsed.value);
    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (err) {
    console.error("[api/messages] insert failed:", err);
    return NextResponse.json({ error: "Could not save the message." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const kindParam = sp.get("kind");
  const kind = MESSAGE_KINDS.includes(kindParam as MessageKind) ? (kindParam as MessageKind) : undefined;
  try {
    const result = await listMessages({
      kind,
      search: sp.get("q") ?? undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 25,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/messages] list failed:", err);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
}
