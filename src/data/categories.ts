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
  { id: "tech-notes", zh: "技术笔记", en: "Tech Notes" },
  { id: "project-log", zh: "项目实录", en: "Project Log" },
  { id: "musings", zh: "随想", en: "Musings" },
];

export const CATEGORY_IDS: string[] = CATEGORIES.map((c) => c.id);

const DEF_BY_ID: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

/** Localized label; falls back to the raw id (schema keeps this unreachable). */
export function categoryLabel(locale: Locale, id: string): string {
  return DEF_BY_ID[id]?.[locale] ?? id;
}
