/**
 * Jediná definice slugu pro celý web.
 *
 * Dřív bylo `slugify` zkopírované v sedmi souborech (hlavička, sitemap,
 * kontakt, služby, feed…). Adresy služeb se odvozují z názvů v CMS, takže
 * stačilo, aby se jedna kopie lišila, a odkaz z menu vedl na 404. Jedna
 * kopie = jedna pravda.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
