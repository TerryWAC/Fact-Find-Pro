/** Values are quoted for PostgREST's OR grammar as well as escaped for SQL LIKE. */
export function textSearchFilter(columns: readonly string[], term: string): string {
  const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`
  const quoted = `"${pattern.replace(/[\\"]/g, '\\$&')}"`
  return columns.map((column) => `${column}.ilike.${quoted}`).join(',')
}
