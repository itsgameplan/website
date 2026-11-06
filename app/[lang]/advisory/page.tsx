import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdvisoryPage } from "@/components/advisory-page";
import { programs } from "@/i18n/programs";
import { dictionaries, hasLocale } from "@/i18n/translations";

export async function generateMetadata({ params }: PageProps<"/[lang]/advisory">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const copy = programs[lang].advisory;
  return { title: `${programs[lang].nav.advisory} · Gameplan`, description: copy.intro };
}

export default async function Page({ params }: PageProps<"/[lang]/advisory">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <AdvisoryPage locale={lang} t={dictionaries[lang]} />;
}
