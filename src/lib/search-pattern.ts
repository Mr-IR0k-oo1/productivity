/** Escapes LIKE wildcards so a search for "50%" matches literally, and wraps for a contains match. */
export function toLikePattern(query: string) {
  return `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
