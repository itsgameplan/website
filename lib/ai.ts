import { neon } from "@neon/ai-sdk-provider";
import { APICallError, generateText } from "ai";
import type { FormMessage } from "@/lib/messages";

/**
 * Neon AI Gateway via the AI SDK. `@neon/ai-sdk-provider` reads NEON_AI_GATEWAY_BASE_URL and
 * NEON_AI_GATEWAY_TOKEN (written by `neon deploy` / `neon env pull`), so there is no provider key.
 * Any catalog model ID works; override with AI_DRAFT_MODEL.
 */
export const DRAFT_MODEL = process.env.AI_DRAFT_MODEL || "claude-haiku-4-5";

export const aiConfigured = () => Boolean(process.env.NEON_AI_GATEWAY_BASE_URL && process.env.NEON_AI_GATEWAY_TOKEN);

const KIND_CONTEXT: Record<FormMessage["kind"], string> = {
  venture: "an application to the Gameplan Venture Program (Gameplan backs founders with cash, services or both, for equity)",
  advisory: "an enquiry to Gameplan Advisory (Gameplan runs strategy, governance, marketing, partnerships, launches, sales and events end to end for organisations)",
  contact: "a general message sent through the Gameplan website's contact form",
};

/** A short, warm first reply the team can edit before sending. Written in the visitor's language. */
export async function draftReply(m: FormMessage) {
  const { text } = await generateText({
    model: neon(DRAFT_MODEL),
    maxOutputTokens: 400,
    system: [
      "You draft first replies for the Gameplan team (Gameplan builds, backs and accelerates ambitious ideas, rooted in sport).",
      "Write a short, warm, professional email reply of 80 to 140 words. No subject line, no placeholders in brackets, no promises about money, dates or outcomes.",
      "Thank them, show you read their message by referring to specifics, and propose a short call as the next step.",
      `Reply in ${m.locale === "ar" ? "Arabic" : "English"}. Sign off as "The Gameplan team".`,
    ].join(" "),
    prompt: [
      `This is ${KIND_CONTEXT[m.kind]}.`,
      `From: ${m.name}${m.company ? ` (${m.company})` : ""}`,
      ...Object.entries(m.answers).map(([q, a]) => `${q}: ${a}`),
      m.notes ? `Notes: ${m.notes}` : "",
      "",
      "Their message:",
      m.message,
    ].filter(Boolean).join("\n"),
  });
  return text.trim();
}

/** Turns gateway failures into something an admin can act on. */
export function describeAiError(err: unknown): { status: number; message: string } {
  if (APICallError.isInstance(err)) {
    const body = String(err.responseBody ?? "");
    if (err.statusCode === 403 && body.includes("paid_plan_required")) {
      return { status: 503, message: "The Neon AI Gateway has no credits yet. Add a card and buy AI Gateway credits on the Neon Billing page, then try again." };
    }
    if (err.statusCode === 429) return { status: 503, message: "The AI Gateway is rate-limiting requests. Try again in a minute." };
    return { status: 502, message: `The AI Gateway returned ${err.statusCode ?? "an error"}.` };
  }
  return { status: 500, message: "Could not draft a reply." };
}
