/**
 * Derives a URL-safe slug from an admin-typed table name, e.g.
 * "Maintenance Log" -> "maintenance-log". Custom entity tables route as
 * /tables/[slug] (Section 5.4), so this needs to stay collision-checked by
 * the caller — see uniqueSlug below.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Appends a numeric suffix until `taken` no longer contains the slug —
 * handles two tables named "Maintenance" without a DB round-trip per guess.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
