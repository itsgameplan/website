import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactPage } from "@/components/contact-page";
import { briefForms } from "@/i18n/brief-forms";
import { programs } from "@/i18n/programs";
import { dictionaries, hasLocale } from "@/i18n/translations";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { title: `${programs[lang].nav.contact} · Gameplan`, description: briefForms[lang].contact.intro };
}

export default async function Page({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <ContactPage locale={lang} t={dictionaries[lang]} />;
}
