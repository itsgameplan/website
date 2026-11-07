"use client";

import { PageShell } from "@/components/page-shell";
import { VerticalsSection } from "@/components/sections/verticals-section";
import type { Dictionary, Locale } from "@/i18n/translations";

/** /verticals — our three pillars and athlete sponsorship, linked from the heritage chapter. */
export function VerticalsPage({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <PageShell locale={locale} t={t} page="verticals">
      <VerticalsSection t={t} />
    </PageShell>
  );
}
