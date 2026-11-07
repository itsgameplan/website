import type { Locale } from "@/i18n/translations";

/** Where every form and contact link sends email. */
export const CONTACT_EMAIL = "marketing@itsgameplan.com";

/**
 * Forms are delivered to CONTACT_EMAIL by Web3Forms. The access key is set in the
 * NEXT_PUBLIC_WEB3FORMS_KEY environment variable (.env.local locally, the host's env settings in production).
 */
export const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
export const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";

export type SitePage = "venture" | "advisory" | "contact";
const PAGE_SLUGS: Record<SitePage, string> = { venture: "venture-program", advisory: "advisory", contact: "contact" };

/** The standalone pages, e.g. /en/venture-program, /ar/contact. */
export const pagePath = (locale: Locale, page: SitePage) => `/${locale}/${PAGE_SLUGS[page]}`;
