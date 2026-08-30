import { languages, defaultLocale, type Locale } from "./ui";

/** All locales the site serves, in a stable order. */
export const LOCALES = Object.keys(languages) as Locale[];

/**
 * URL prefix for a locale. The default locale is served from the site root
 * (`prefixDefaultLocale: false`), every other locale under `/<locale>`.
 */
export function prefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Resolve the locale of a `[...locale]` route, defaulting to the site default. */
export function localeFrom(
  params: Record<string, string | undefined>
): Locale {
  const raw = params.locale;
  return raw && (LOCALES as string[]).includes(raw)
    ? (raw as Locale)
    : defaultLocale;
}

/**
 * Static paths for a `[...locale]` route. The default locale yields an
 * `undefined` segment so it is served without a prefix.
 */
export function localePaths(): { params: { locale?: string } }[] {
  return LOCALES.map((l) => ({
    params: { locale: l === defaultLocale ? undefined : l },
  }));
}

/**
 * Fan a per-locale `getStaticPaths` body out over every locale, preserving the
 * prefix-omitting behaviour of `localePaths`.
 */
export async function forEachLocale<T>(
  build: (locale: Locale) => Promise<T[]> | T[]
): Promise<T[]> {
  const out: T[] = [];
  for (const { params } of localePaths()) {
    const locale = localeFrom(params);
    out.push(...(await build(locale)));
  }
  return out;
}
