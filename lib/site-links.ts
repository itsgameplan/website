import type { Locale } from "@/i18n/translations";

/** Where every form and contact link sends email. */
export const CONTACT_EMAIL = "marketing@itsgameplan.com";

export type SitePage = "venture" | "advisory" | "contact";
const PAGE_SLUGS: Record<SitePage, string> = { venture: "venture-program", advisory: "advisory", contact: "contact" };

/** The standalone pages, e.g. /en/venture-program, /ar/contact. */
export const pagePath = (locale: Locale, page: SitePage) => `/${locale}/${PAGE_SLUGS[page]}`;
