import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { MESSAGE_KINDS, messagesCsv, type MessageKind } from "@/lib/messages";
import { assets, ASSETS_BUCKET, storageConfigured } from "@/lib/storage";

const LINK_SECONDS = 15 * 60;

/**
 * POST /api/messages/export?kind=… — admins only. Writes a CSV of the messages to the private
 * `assets` bucket (Neon Object Storage) and returns a presigned download link valid for 15 minutes.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Object storage is not configured (AWS_* missing)." }, { status: 503 });

  const kindParam = req.nextUrl.searchParams.get("kind");
  const kind = MESSAGE_KINDS.includes(kindParam as MessageKind) ? (kindParam as MessageKind) : undefined;
  try {
    const { csv, count } = await messagesCsv(kind);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `exports/messages-${kind ?? "all"}-${stamp}.csv`;
    const files = assets();
    await files.upload(key, csv, { contentType: "text/csv; charset=utf-8", cacheControl: "private, no-store" });
    const url = await files.url(key, { expiresIn: LINK_SECONDS });
    return NextResponse.json({ url, key, bucket: ASSETS_BUCKET, count, expiresIn: LINK_SECONDS }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/messages/export] failed:", err);
    return NextResponse.json({ error: "Could not export the messages." }, { status: 500 });
  }
}
