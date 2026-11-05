import { notFound } from "next/navigation";
import { GameplanHome } from "@/components/gameplan-home";
import { dictionaries, hasLocale } from "@/i18n/translations";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return <GameplanHome locale={lang} t={dictionaries[lang]} />;
}
