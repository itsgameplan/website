"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Download, LogOut, Mail, RefreshCw, Search, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { FormMessage, MessageKind } from "@/lib/messages";

type Result = { messages: FormMessage[]; total: number; page: number; pageSize: number; byKind: Record<MessageKind, number> };

const KIND_LABEL: Record<MessageKind, string> = { venture: "Venture Program", advisory: "Advisory", contact: "Contact" };
const TABS: (MessageKind | "all")[] = ["all", "venture", "advisory", "contact"];
const PAGE_SIZE = 25;

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** All form messages from the site, newest first: filter by form, search, page through, expand to read. */
export function MessagesPanel({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [kind, setKind] = useState<MessageKind | "all">("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // search as you type, without a request per keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { setSearch(query); setPage(1); }, 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (kind !== "all") params.set("kind", kind);
    if (search.trim()) params.set("q", search.trim());
    fetch(`/api/messages?${params}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) { router.replace("/admin/login"); return; }
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
        setData(await res.json());
        setError("");
      })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message || "Could not load messages."); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [kind, search, page, reloadKey, router]);

  // AI Gateway: draft a first reply for one message
  const [drafts, setDrafts] = useState<Record<number, { busy?: boolean; text?: string; error?: string }>>({});
  const draftFor = async (id: number) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], busy: true, error: undefined } }));
    try {
      const res = await fetch(`/api/messages/${id}/draft`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      setDrafts((d) => ({ ...d, [id]: { text: body.draft } }));
    } catch (err) {
      setDrafts((d) => ({ ...d, [id]: { ...d[id], busy: false, error: err instanceof Error ? err.message : "Could not draft a reply." } }));
    }
  };

  // Object Storage: export the current form's messages as a CSV in the bucket, download via a presigned link
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<{ ok: boolean; text: string } | null>(null);
  const exportCsv = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      const res = await fetch(`/api/messages/export${kind === "all" ? "" : `?kind=${kind}`}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      window.location.assign(body.url);
      setExportNote({ ok: true, text: `Exported ${body.count} messages. The download link works for ${Math.round(body.expiresIn / 60)} minutes.` });
    } catch (err) {
      setExportNote({ ok: false, text: err instanceof Error ? err.message : "Export failed." });
    } finally {
      setExporting(false);
    }
  };

  const refresh = useCallback(() => { setLoading(true); setReloadKey((k) => k + 1); }, []);
  const pickKind = (k: MessageKind | "all") => { setLoading(true); setKind(k); setPage(1); setOpen(null); };
  const goPage = (p: number) => { setLoading(true); setPage(p); setOpen(null); };
  const signOut = async () => { await authClient.signOut(); window.location.assign("/admin/login"); };

  const allCount = data ? Object.values(data.byKind).reduce((a, b) => a + b, 0) : 0;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="ga-shell">
      <header className="ga-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gameplan-logo-white.png" alt="Gameplan" width={120} height={30} />
        <span className="ga-top-title">Admin</span>
        <div className="ga-top-user">
          <span className="ga-muted">{user.email}</span>
          <button type="button" className="ga-btn ga-btn-ghost" onClick={signOut}><LogOut size={15} />Sign out</button>
        </div>
      </header>

      <section className="ga-pad">
        <div className="ga-head">
          <div>
            <h1>Messages</h1>
            <p className="ga-muted">Everything sent through the Contact, Venture Program and Advisory forms, in English and Arabic.</p>
          </div>
          <div className="ga-head-actions">
            <button type="button" className="ga-btn ga-btn-ghost" onClick={exportCsv} disabled={exporting}>
              <Download size={15} />{exporting ? "Exporting…" : kind === "all" ? "Export CSV" : `Export ${KIND_LABEL[kind]} CSV`}
            </button>
            <button type="button" className="ga-btn ga-btn-ghost" onClick={refresh} aria-label="Refresh"><RefreshCw size={15} className={loading ? "ga-spin" : ""} />Refresh</button>
          </div>
        </div>
        {exportNote && <p className={exportNote.ok ? "ga-note" : "ga-error"} role="status">{exportNote.text}</p>}

        <div className="ga-toolbar">
          <div className="ga-tabs" role="tablist" aria-label="Form">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={kind === t} className={`ga-tab ${kind === t ? "is-on" : ""}`} onClick={() => pickKind(t)}>
                {t === "all" ? "All forms" : KIND_LABEL[t]}
                <span className="ga-count">{data ? (t === "all" ? allCount : data.byKind[t]) : "–"}</span>
              </button>
            ))}
          </div>
          <label className="ga-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => { setLoading(true); setQuery(e.target.value); }} placeholder="Search name, email, company or message" aria-label="Search messages" />
          </label>
        </div>

        {error && <p className="ga-error" role="alert">{error}</p>}

        <div className="ga-list" aria-busy={loading}>
          {data && data.messages.length === 0 && !loading && (
            <p className="ga-empty">{search || kind !== "all" ? "No messages match." : "No messages yet. They'll appear here as soon as someone sends a form."}</p>
          )}
          {data?.messages.map((m) => {
            const isOpen = open === m.id;
            return (
              <article key={m.id} className={`ga-msg ${isOpen ? "is-open" : ""}`}>
                <button type="button" className="ga-msg-row" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen}>
                  <span className={`ga-kind ga-kind-${m.kind}`}>{KIND_LABEL[m.kind]}</span>
                  <span className="ga-msg-who">
                    <strong>{m.name}</strong>
                    <span className="ga-muted">{m.company ? `${m.company} · ` : ""}{m.email}</span>
                  </span>
                  <span className="ga-msg-preview ga-muted">{m.notes || Object.values(m.answers).join(" · ") || m.message.split("\n").find((l) => l.trim() && !l.endsWith(","))}</span>
                  <span className="ga-msg-date ga-muted">{fmtDate(m.createdAt)}{m.locale === "ar" && <span className="ga-lang">AR</span>}</span>
                  <ChevronDown size={16} className="ga-chev" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="ga-msg-body">
                    <dl className="ga-facts">
                      <div><dt>Email</dt><dd><a href={`mailto:${m.email}`}>{m.email}</a></dd></div>
                      {m.phone && <div><dt>Phone</dt><dd><a href={`tel:${m.phone}`}>{m.phone}</a></dd></div>}
                      {m.company && <div><dt>Company</dt><dd>{m.company}</dd></div>}
                      {Object.entries(m.answers).map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}
                      {m.notes && <div><dt>Notes</dt><dd>{m.notes}</dd></div>}
                      <div><dt>Sent from</dt><dd>{m.page ? <a href={m.page} target="_blank" rel="noreferrer">{m.page.replace(/^https?:\/\//, "")}</a> : "—"}</dd></div>
                    </dl>
                    <div className="ga-letter">
                      <span className="ga-label">Full message</span>
                      <pre dir={m.locale === "ar" ? "rtl" : "ltr"}>{m.message}</pre>
                      <div className="ga-actions">
                        <a className="ga-btn ga-btn-primary" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Gameplan")}${drafts[m.id]?.text ? `&body=${encodeURIComponent(drafts[m.id].text!)}` : ""}`}>
                          <Mail size={15} />{drafts[m.id]?.text ? "Reply with this draft" : "Reply by email"}
                        </a>
                        <button type="button" className="ga-btn ga-btn-ghost" onClick={() => draftFor(m.id)} disabled={drafts[m.id]?.busy}>
                          <Sparkles size={15} />{drafts[m.id]?.busy ? "Drafting…" : drafts[m.id]?.text ? "Redraft" : "Draft a reply with AI"}
                        </button>
                      </div>
                      {drafts[m.id]?.error && <p className="ga-error" role="alert">{drafts[m.id].error}</p>}
                      {drafts[m.id]?.text !== undefined && (
                        <label className="ga-draft">
                          <span className="ga-label">AI draft · edit before sending</span>
                          <textarea dir={m.locale === "ar" ? "rtl" : "ltr"} rows={8} value={drafts[m.id].text}
                            onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: { ...d[m.id], text: e.target.value } }))} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {data && data.total > data.pageSize && (
          <nav className="ga-pager" aria-label="Pages">
            <button type="button" className="ga-btn ga-btn-ghost" disabled={page <= 1} onClick={() => goPage(page - 1)}><ChevronLeft size={15} />Newer</button>
            <span className="ga-muted">Page {data.page} of {pages} · {data.total} messages</span>
            <button type="button" className="ga-btn ga-btn-ghost" disabled={page >= pages} onClick={() => goPage(page + 1)}>Older<ChevronRight size={15} /></button>
          </nav>
        )}
      </section>
    </main>
  );
}
