import { StoreCategory } from '../models/storefront.model';

/** Finds the first category whose name contains any keyword (case-insensitive).
 *  Classic sections are fixed in design but categories belong to the shop,
 *  so sections link by name rather than by hard-coded id. From myskin_web. */
export function findCategoryByKeywords(
  categories: StoreCategory[],
  keywords: string[],
): StoreCategory | undefined {
  const needles = keywords.map((k) => k.toLowerCase());
  return categories.find((c) => needles.some((n) => c.name.toLowerCase().includes(n)));
}

/** Top-level categories plus every child, flattened. */
export function flattenCategories(categories: StoreCategory[]): StoreCategory[] {
  return categories.flatMap((c) => [c, ...flattenCategories(c.children ?? [])]);
}
