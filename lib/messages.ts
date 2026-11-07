import { pool } from "@/lib/db";

/** The forms on the site: Venture Program, Advisory and Contact (EN and AR). */
export const MESSAGE_KINDS = ["venture", "advisory", "contact"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export type FormMessage = {
  id: number;
  kind: MessageKind;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  /** the visitor's picks, labelled in English: { "What's it about?": "Partnership" } */
  answers: Record<string, string>;
  notes: string | null;
  message: string;
  locale: "en" | "ar";
  page: string | null;
  createdAt: string;
};

export type NewMessage = Omit<FormMessage, "id" | "createdAt">;

/** Idempotent: safe to run on every `npm run db:setup`. */
export const MESSAGES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS form_message (
    id          BIGSERIAL PRIMARY KEY,
    kind        TEXT NOT NULL CHECK (kind IN ('venture', 'advisory', 'contact')),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    company     TEXT,
    phone       TEXT,
    answers     JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes       TEXT,
    message     TEXT NOT NULL,
    locale      TEXT NOT NULL DEFAULT 'en',
    page        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS form_message_created_idx ON form_message (created_at DESC);
  CREATE INDEX IF NOT EXISTS form_message_kind_idx ON form_message (kind, created_at DESC);
`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 120, email: 254, company: 160, phone: 40, notes: 4000, message: 8000, page: 500, answerKey: 120, answerValue: 500, answers: 20 };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Checks and trims a submission from the public form. Returns the clean message or a list of problems. */
export function parseMessage(body: unknown): { ok: true; value: NewMessage } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const kind = b.kind as MessageKind;
  if (!MESSAGE_KINDS.includes(kind)) errors.push("kind must be one of " + MESSAGE_KINDS.join(", "));
  const name = str(b.name, LIMITS.name);
  if (!name) errors.push("name is required");
  const email = str(b.email, LIMITS.email);
  if (!EMAIL_RE.test(email)) errors.push("a valid email is required");
  const message = str(b.message, LIMITS.message);
  if (!message) errors.push("message is required");

  const answers: Record<string, string> = {};
  if (b.answers && typeof b.answers === "object" && !Array.isArray(b.answers)) {
    for (const [k, v] of Object.entries(b.answers as Record<string, unknown>).slice(0, LIMITS.answers)) {
      const key = k.trim().slice(0, LIMITS.answerKey);
      const value = str(v, LIMITS.answerValue);
      if (key && value) answers[key] = value;
    }
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      kind, name, email, message, answers,
      company: str(b.company, LIMITS.company) || null,
      phone: str(b.phone, LIMITS.phone) || null,
      notes: str(b.notes, LIMITS.notes) || null,
      locale: b.locale === "ar" ? "ar" : "en",
      page: str(b.page, LIMITS.page) || null,
    },
  };
}

type Row = {
  id: string; kind: MessageKind; name: string; email: string; company: string | null; phone: string | null;
  answers: Record<string, string>; notes: string | null; message: string; locale: "en" | "ar"; page: string | null; created_at: Date;
};
const toMessage = (r: Row): FormMessage => ({
  id: Number(r.id), kind: r.kind, name: r.name, email: r.email, company: r.company, phone: r.phone,
  answers: r.answers ?? {}, notes: r.notes, message: r.message, locale: r.locale, page: r.page,
  createdAt: r.created_at.toISOString(),
});

export async function insertMessage(m: NewMessage): Promise<FormMessage> {
  const { rows } = await pool.query<Row>(
    `INSERT INTO form_message (kind, name, email, company, phone, answers, notes, message, locale, page)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [m.kind, m.name, m.email, m.company, m.phone, JSON.stringify(m.answers), m.notes, m.message, m.locale, m.page],
  );
  return toMessage(rows[0]);
}

export async function getMessage(id: number): Promise<FormMessage | null> {
  const { rows } = await pool.query<Row>(`SELECT * FROM form_message WHERE id = $1`, [id]);
  return rows[0] ? toMessage(rows[0]) : null;
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // quote everything; neutralise spreadsheet formulas
  return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** Every message (newest first, capped) as CSV, with a UTF-8 BOM so Excel reads Arabic correctly. */
export async function messagesCsv(kind?: MessageKind, cap = 10_000) {
  const params: unknown[] = [];
  const clause = kind ? (params.push(kind), "WHERE kind = $1") : "";
  const { rows } = await pool.query<Row>(`SELECT * FROM form_message ${clause} ORDER BY created_at DESC, id DESC LIMIT ${cap}`, params);
  const header = ["id", "sent_at", "form", "name", "email", "company", "phone", "language", "answers", "notes", "message", "page"];
  const lines = rows.map(toMessage).map((m) => [
    m.id, m.createdAt, m.kind, m.name, m.email, m.company, m.phone, m.locale,
    Object.entries(m.answers).map(([q, a]) => `${q}: ${a}`).join(" | "), m.notes, m.message, m.page,
  ].map(csvCell).join(","));
  return { csv: "﻿" + [header.join(","), ...lines].join("\r\n"), count: rows.length };
}

export type MessageQuery ={ kind?: MessageKind; search?: string; page?: number; pageSize?: number };

/** Newest first, optionally filtered by form and a free-text search over name, email, company and message. */
export async function listMessages({ kind, search, page = 1, pageSize = 25 }: MessageQuery) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (kind) { params.push(kind); where.push(`kind = $${params.length}`); }
  if (search?.trim()) {
    params.push(`%${search.trim().replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    const p = `$${params.length}`;
    where.push(`(name ILIKE ${p} OR email ILIKE ${p} OR company ILIKE ${p} OR message ILIKE ${p})`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const size = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const offset = (Math.max(1, Math.floor(page)) - 1) * size;

  const [list, matching, totals] = await Promise.all([
    pool.query<Row>(`SELECT * FROM form_message ${clause} ORDER BY created_at DESC, id DESC LIMIT ${size} OFFSET ${offset}`, params),
    pool.query<{ count: string }>(`SELECT count(*) FROM form_message ${clause}`, params),
    pool.query<{ kind: MessageKind; count: string }>(`SELECT kind, count(*) FROM form_message GROUP BY kind`),
  ]);
  const count = matching.rows[0]?.count ?? "0";
  const byKind = Object.fromEntries(MESSAGE_KINDS.map((k) => [k, 0])) as Record<MessageKind, number>;
  for (const t of totals.rows) byKind[t.kind] = Number(t.count);
  return { messages: list.rows.map(toMessage), total: Number(count), page: Math.floor(offset / size) + 1, pageSize: size, byKind };
}
