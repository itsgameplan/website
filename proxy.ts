import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const preferredLanguage = request.headers.get("accept-language")?.split(",")[0]?.trim().toLowerCase();
  const locale = preferredLanguage?.startsWith("ar") ? "ar" : "en";
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}

export const config = { matcher: "/" };
