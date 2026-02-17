export function formatDate(iso) {
  if (!iso) return ''
  // iso is YYYY/MM/DD in pokemon-tcg-data sets; sometimes YYYY-MM-DD in other sources
  const s = String(iso).replaceAll('-', '/')
  return s
}
