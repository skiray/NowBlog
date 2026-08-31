import type { Locale } from "../i18n/ui";

export interface CategoryDef {
  /** URL slug & frontmatter id — ASCII, stable across locales. */
  id: string;
  /** Chinese label. */
  zh: string;
  /** English label. */
  en: string;
}

/**
 * Single source of truth for categories.
 * - Frontmatter references a category by `id` (validated by the content schema —
 *   an unknown id fails the build).
 * - Add a new category by appending here; order defines listing order.
 */
export const CATEGORIES: CategoryDef[] = [
  { id: "vibe-coding", zh: "Vibe Coding", en: "Vibe Coding" },
  { id: "app", zh: "App", en: "App" },
  { id: "bookkeeping", zh: "记账", en: "Bookkeeping" },
  { id: "tech-talk", zh: "技术探讨", en: "Tech Discussions" },
];

export const CATEGORY_IDS: string[] = CATEGORIES.map((c) => c.id);

const DEF_BY_ID: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

/** Localized label; falls back to the raw id (schema keeps this unreachable). */
export function categoryLabel(locale: Locale, id: string): string {
  return DEF_BY_ID[id]?.[locale] ?? id;
}
