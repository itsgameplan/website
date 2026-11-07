import type { Locale } from "@/i18n/translations";

/**
 * "EN / ع" in the header language pill. Each script is its own box with line-height 1,
 * so the pill can centre them and the Arabic letter can be optically lined up with "EN".
 */
export function LangLabel({ locale }: { locale: Locale }) {
  const en = <span className="gp-lang-en" key="en">EN</span>;
  const ar = <span className="gp-lang-ar" lang="ar" key="ar">ع</span>;
  return (
    <span className="gp-lang-label" dir="ltr">
      {locale === "en" ? en : ar}
      <span className="gp-lang-sep" aria-hidden="true">/</span>
      {locale === "en" ? ar : en}
    </span>
  );
}
