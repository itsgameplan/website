import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VenturePage } from "@/components/venture-page";
import { programs } from "@/i18n/programs";
import { dictionaries, hasLocale } from "@/i18n/translations";

export async function generateMetadata({ params }: PageProps<"/[lang]/venture-program">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const copy = programs[lang].venture;
  return { title: `${programs[lang].nav.venture} · Gameplan`, description: copy.intro };
}

export default async function Page({ params }: PageProps<"/[lang]/venture-program">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <VenturePage locale={lang} t={dictionaries[lang]} />;
}
