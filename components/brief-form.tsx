"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Mail, RotateCcw } from "lucide-react";
import { briefForms, type BriefGroup, type BriefKind } from "@/i18n/brief-forms";
import type { Locale } from "@/i18n/translations";
import { CONTACT_EMAIL } from "@/lib/site-links";

type Picks = Record<string, string[]>;

/** "a", "a and b", "a, b and c" — in the page's language. */
function joinList(items: string[], and: string, sep: string) {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(sep)} ${and}${and.length > 1 ? " " : ""}${items[items.length - 1]}`;
}

/**
 * Click-to-compose form: pick options on one side and the email writes itself on the other.
 * "Send" opens the visitor's own mail app with everything filled in, addressed to CONTACT_EMAIL.
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
  const [edited, setEdited] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
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
  const missingPick = !pickedIds.length && !notes.trim() && edited === null;
  const ready = !missingName && !missingPick;

  const toggle = (g: BriefGroup, id: string) => {
    setSent(false);
    setPicks((prev) => {
      const cur = prev[g.id] ?? [];
      const next = g.multi ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : cur[0] === id ? [] : [id];
      return { ...prev, [g.id]: next };
    });
  };

  const send = () => {
    setTried(true);
    if (!ready) return;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = href;
    setSent(true);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`${ui.to}: ${CONTACT_EMAIL}\n${ui.subjectLabel}: ${subject}\n\n${message}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the text is still selectable in the box */ }
  };

  return (
    <form className="gp-brief" onSubmit={(e) => { e.preventDefault(); send(); }} noValidate>
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
            onChange={(e) => { setEdited(e.target.value); setSent(false); }}
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
            <button type="submit" className="gp-primary gp-brief-send" aria-disabled={!ready}>
              {ui.send}<Mail size={18} />
            </button>
            <button type="button" className="gp-brief-copy gp-mono" onClick={copyMessage} disabled={!message}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? ui.copied : ui.copy}
            </button>
          </div>
          <div className="gp-brief-status" aria-live="polite">
            {tried && missingName && <p className="is-warn">{ui.needName}</p>}
            {tried && !missingName && missingPick && <p className="is-warn">{ui.needPick}</p>}
            {sent && <p><strong>{ui.sentTitle}</strong> {ui.sentBody} <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a>.</p>}
          </div>
        </div>
      </div>

      {/* the picks */}
      <div className="gp-brief-picks">
        <span className="gp-brief-step gp-mono">01 · {ui.stepAbout}</span>
        <div className="gp-brief-fields">
          <label className={tried && missingName ? "is-invalid" : ""}>
            <span>{ui.name}</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setSent(false); }} placeholder={ui.namePh} autoComplete="name" required />
          </label>
          <label>
            <span>{ui.company} <em>{ui.optional}</em></span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={ui.companyPh} autoComplete="organization" />
          </label>
          <label>
            <span>{ui.email} <em>{ui.optional}</em></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ui.emailPh} autoComplete="email" dir="ltr" />
          </label>
          {wantsPhone && (
            <label className="gp-brief-appear">
              <span>{ui.phone}</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={ui.phonePh} autoComplete="tel" dir="ltr" />
            </label>
          )}
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
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSent(false); }} placeholder={ui.notesPh} rows={3} />
        </label>
      </div>
    </form>
  );
}
