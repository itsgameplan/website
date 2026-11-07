import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerticalsPage } from "@/components/verticals-page";
import { dictionaries, hasLocale } from "@/i18n/translations";

export async function generateMetadata({ params }: PageProps<"/[lang]/verticals">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = dictionaries[lang];
  return { title: `${t.heritageCta} · Gameplan`, description: t.verticalsMeta };
}

export default async function Page({ params }: PageProps<"/[lang]/verticals">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <VerticalsPage locale={lang} t={dictionaries[lang]} />;
}
