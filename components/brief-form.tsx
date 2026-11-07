"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleCheck, Copy, RotateCcw, Send } from "lucide-react";
import { briefForms, type BriefGroup, type BriefKind } from "@/i18n/brief-forms";
import type { Locale } from "@/i18n/translations";
import { CONTACT_EMAIL, WEB3FORMS_ENDPOINT, WEB3FORMS_KEY } from "@/lib/site-links";

type Picks = Record<string, string[]>;
type Status = "idle" | "sending" | "sent" | "error";

/** Subject lines as they land in the Gameplan inbox (always English, so the team can sort them). */
const INBOX_SUBJECT: Record<BriefKind, (name: string) => string> = {
  advisory: (name) => `New Advisory enquiry: ${name}`,
  venture: (name) => `New Venture Program application: ${name}`,
  contact: (name) => `New contact message: ${name}`,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "a", "a and b", "a, b and c" — in the page's language. */
function joinList(items: string[], and: string, sep: string) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(sep)} ${and}${and.length > 1 ? " " : ""}${items[items.length - 1]}`;
}

/**
 * Click-to-compose form: pick options on one side and the message writes itself on the other.
 * "Send" stores the submission in the database (POST /api/messages, read in /admin) and emails it
 * to CONTACT_EMAIL through Web3Forms, then shows a thank-you.
 * The message stays editable; once edited, picks no longer overwrite it (until "rewrite").
 */
export function BriefForm({ locale, kind, preset }: {
  locale: Locale; kind: BriefKind;
  /** picks set from elsewhere on the page (e.g. the audience switcher); applied whenever they change */
  preset?: Picks;
}) {
  const { ui, [kind]: copy } = briefForms[locale];
  const [picks, setPicks] = useState<Picks>({});
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [botcheck, setBotcheck] = useState(false);
  const [edited, setEdited] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  const presetKey = JSON.stringify(preset ?? {});
  useEffect(() => {
    if (preset && Object.keys(preset).length) setPicks((prev) => ({ ...prev, ...preset }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey]);

  const pickedIds = Object.values(picks).flat();
  const wantsPhone = !!copy.phoneFor?.some((id) => pickedIds.includes(id));

  const phrase = (g: BriefGroup, id: string) => {
    const c = g.choices.find((o) => o.id === id)!;
    return c.say ?? (g.lower ? c.label.toLowerCase() : c.label);
  };

  const generated = useMemo(() => {
    const lines: string[] = [];
    const sentences = copy.groups
      .filter((g) => picks[g.id]?.length)
      .map((g) => g.template.replace("{x}", joinList(picks[g.id].map((id) => phrase(g, id)), ui.and, ui.sep)));
    if (!name.trim() && !sentences.length && !notes.trim()) return "";
    lines.push(ui.hello, "");
    if (name.trim()) lines.push(ui.iAm(name.trim(), company.trim()));
    lines.push(...sentences);
    if (notes.trim()) lines.push("", notes.trim());
    const reply = ui.replyTo(email.trim(), wantsPhone ? phone.trim() : "");
    lines.push("", ui.thanks, name.trim() || "—");
    if (reply) lines.push(reply);
    return lines.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, name, company, email, phone, notes, wantsPhone, kind, locale]);

  const message = edited ?? generated;
  const subject = `${copy.subject}${company.trim() ? ` · ${company.trim()}` : name.trim() ? ` · ${name.trim()}` : ""}`;
  const missingName = !name.trim();
  const missingEmail = !email.trim();
  const badEmail = !missingEmail && !EMAIL_RE.test(email.trim());
  const missingPick = !pickedIds.length && !notes.trim() && edited === null;
  const ready = !missingName && !missingEmail && !badEmail && !missingPick;
  const sending = status === "sending";

  /** any change after a failed send clears the error (the answers themselves are never cleared) */
  const touched = () => { if (status === "error") setStatus("idle"); };

  const toggle = (g: BriefGroup, id: string) => {
    touched();
    setPicks((prev) => {
      const cur = prev[g.id] ?? [];
      const next = g.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : cur[0] === id ? [] : [id];
      return { ...prev, [g.id]: next };
    });
  };

  /** every answer as its own field, labelled in English for the inbox */
  const fields = () => {
    const en = briefForms.en[kind];
    const out: Record<string, string> = {};
    for (const g of en.groups) {
      const ids = picks[g.id];
      if (ids?.length) out[g.label] = ids.map((id) => g.choices.find((c) => c.id === id)?.label ?? id).join(", ");
    }
    return out;
  };

  /** stores the submission in the site's database (read in the admin panel) */
  const saveToDatabase = async (answers: Record<string, string>, page: string) => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind, name: name.trim(), email: email.trim(), company: company.trim(),
        phone: wantsPhone ? phone.trim() : "", answers, notes: notes.trim(), message, locale, page, botcheck,
      }),
    });
    if (!res.ok) throw new Error(`database: HTTP ${res.status}`);
  };

  /** emails the submission to CONTACT_EMAIL through Web3Forms */
  const sendEmail = async (answers: Record<string, string>, page: string) => {
    if (!WEB3FORMS_KEY) throw new Error("email: NEXT_PUBLIC_WEB3FORMS_KEY is not set");
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: INBOX_SUBJECT[kind](name.trim()),
        from_name: "Gameplan website",
        replyto: email.trim(),
        botcheck,
        Name: name.trim(),
        Company: company.trim() || "—",
        Email: email.trim(),
        ...(wantsPhone && phone.trim() ? { Phone: phone.trim() } : {}),
        ...answers,
        ...(notes.trim() ? { Notes: notes.trim() } : {}),
        Message: message,
        Language: locale === "ar" ? "Arabic" : "English",
        Page: page,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) throw new Error(`email: ${data?.message || `HTTP ${res.status}`}`);
  };

  /** saved and emailed in parallel; the visitor sees success if either one got through */
  const send = async () => {
    setTried(true);
    if (!ready || sending) return;
    setStatus("sending");
    const answers = fields();
    const page = window.location.href;
    const results = await Promise.allSettled([saveToDatabase(answers, page), sendEmail(answers, page)]);
    results.forEach((r) => { if (r.status === "rejected") console.error("Form send:", r.reason); });
    setStatus(results.some((r) => r.status === "fulfilled") ? "sent" : "error");
  };

  const reset = () => {
    setPicks({}); setName(""); setCompany(""); setEmail(""); setPhone(""); setNotes("");
    setEdited(null); setTried(false); setStatus("idle");
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`${ui.to}: ${CONTACT_EMAIL}\n${ui.subjectLabel}: ${subject}\n\n${message}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the text is still selectable in the box */ }
  };

  if (status === "sent") {
    return (
      <div className="gp-brief gp-brief-done" role="status" aria-live="polite">
        <div className="gp-brief-letter">
          <div className="gp-brief-letter-card gp-brief-thanks">
            <CircleCheck size={34} aria-hidden="true" />
            <h3>{ui.sentTitle}</h3>
            <p>{ui.sentBody} <strong dir="ltr">{email.trim()}</strong>.</p>
            <button type="button" className="gp-mono" onClick={reset}>{ui.sendAnother}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="gp-brief" onSubmit={(e) => { e.preventDefault(); void send(); }} noValidate aria-busy={sending}>
      {/* the message, written live from the picks */}
      <div className="gp-brief-letter">
        <div className="gp-brief-letter-card">
          <span className="gp-brief-step gp-mono">{ui.yourMessage}</span>
          <dl className="gp-brief-head">
            <div><dt>{ui.to}</dt><dd dir="ltr">{CONTACT_EMAIL}</dd></div>
            <div><dt>{ui.subjectLabel}</dt><dd>{subject}</dd></div>
          </dl>
          <textarea
            className="gp-brief-body"
            value={message}
            placeholder={ui.placeholder}
            onChange={(e) => { setEdited(e.target.value); touched(); }}
            aria-label={ui.yourMessage}
            rows={12}
          />
          {edited !== null && (
            <p className="gp-brief-note">
              {ui.edited}{" "}
              <button type="button" onClick={() => setEdited(null)}><RotateCcw size={13} />{ui.reset}</button>
            </p>
          )}
          <div className="gp-brief-actions">
            <button type="submit" className="gp-primary gp-brief-send" aria-disabled={!ready || sending} aria-busy={sending} disabled={sending}>
              {sending ? ui.sending : ui.send}<Send size={18} />
            </button>
            <button type="button" className="gp-brief-copy gp-mono" onClick={copyMessage} disabled={!message}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? ui.copied : ui.copy}
            </button>
          </div>
          <div className="gp-brief-status" aria-live="polite">
            {tried && missingName && <p className="is-warn">{ui.needName}</p>}
            {tried && !missingName && missingEmail && <p className="is-warn">{ui.needEmail}</p>}
            {tried && !missingName && badEmail && <p className="is-warn">{ui.badEmail}</p>}
            {tried && !missingName && !missingEmail && !badEmail && missingPick && <p className="is-warn">{ui.needPick}</p>}
            {status === "error" && <p className="is-error">{ui.errorBody} <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a>.</p>}
          </div>
        </div>
      </div>

      {/* the picks */}
      <div className="gp-brief-picks">
        <span className="gp-brief-step gp-mono">01 · {ui.stepAbout}</span>
        <div className="gp-brief-fields">
          <label className={tried && missingName ? "is-invalid" : ""}>
            <span>{ui.name}</span>
            <input value={name} onChange={(e) => { setName(e.target.value); touched(); }} placeholder={ui.namePh} autoComplete="name" required />
          </label>
          <label>
            <span>{ui.company} <em>{ui.optional}</em></span>
            <input value={company} onChange={(e) => { setCompany(e.target.value); touched(); }} placeholder={ui.companyPh} autoComplete="organization" />
          </label>
          <label className={tried && (missingEmail || badEmail) ? "is-invalid" : ""}>
            <span>{ui.email}</span>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); touched(); }} placeholder={ui.emailPh} autoComplete="email" dir="ltr" required aria-invalid={tried && (missingEmail || badEmail)} />
          </label>
          {wantsPhone && (
            <label className="gp-brief-appear">
              <span>{ui.phone}</span>
              <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); touched(); }} placeholder={ui.phonePh} autoComplete="tel" dir="ltr" />
            </label>
          )}
          {/* honeypot: hidden from people, bots tick it and Web3Forms drops the submission */}
          <input type="checkbox" name="botcheck" className="gp-brief-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true"
            checked={botcheck} onChange={(e) => setBotcheck(e.target.checked)} />
        </div>

        <span className="gp-brief-step gp-mono">02 · {ui.stepPick}</span>
        {copy.groups.map((g) => (
          <fieldset key={g.id} className="gp-brief-group">
            <legend>{g.label} <em>{g.multi ? ui.pickMany : ui.pickOne}</em></legend>
            <div className="gp-brief-chips">
              {g.choices.map((c) => {
                const on = picks[g.id]?.includes(c.id) ?? false;
                return (
                  <button key={c.id} type="button" className={`gp-chip ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => toggle(g, c.id)}>
                    {on && <Check size={13} />}{c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <label className="gp-brief-notes">
          <span>{ui.notes} <em>{ui.optional}</em></span>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); touched(); }} placeholder={ui.notesPh} rows={3} />
        </label>
      </div>
    </form>
  );
}
