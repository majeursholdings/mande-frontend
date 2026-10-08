/**
 * Every page of a list the API pages with a `before` cursor, newest first,
 * joined into one: for screens that search, filter and act on the whole list
 * in the browser. Stops at `maxItems` so a huge list can't run away; past
 * that, the newest `maxItems` show.
 */
export async function fetchAllPages<T>(
  fetchPage: (before: string | undefined) => Promise<{ items: T[]; nextBefore: string | null }>,
  maxItems: number,
): Promise<T[]> {
  const items: T[] = [];
  let before: string | undefined;
  do {
    const page = await fetchPage(before);
    items.push(...page.items);
    before = page.nextBefore ?? undefined;
  } while (before && items.length < maxItems);
  return items.slice(0, maxItems);
}
