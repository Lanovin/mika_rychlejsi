/**
 * Fotky z Tipcars.
 *
 * Tipcars ke každému snímku hostuje tři hotové velikosti. Když si rovnou
 * vezmeme tu správnou, nemusí obrázek procházet přes optimalizátor Next.js.
 * Ten se u inzerátů choval nespolehlivě hlavně na mobilu – telefon si žádá
 * jiné šířky než desktop, takže šlo pokaždé o novou transformaci, a když
 * neprošla, zůstala v inzerátu jen ikona rozbitého obrázku.
 *
 *   fotky_male       120 ×   90   ~3 kB    – náhledy pod galerií
 *   fotky_velke      800 ×  600   ~55 kB   – karty vozů a hlavní fotka
 *   fotky_zdrojove  1920 × 1440  ~240 kB   – lightbox a velké displeje
 */

const TIPCARS_HOST = "img.tipcars.com";

export const TIPCARS_VARIANTS = ["fotky_male", "fotky_velke", "fotky_zdrojove"] as const;

export type TipcarsVariant = (typeof TIPCARS_VARIANTS)[number];

export function isTipcarsImage(url: string): boolean {
  return typeof url === "string" && url.includes(TIPCARS_HOST);
}

/** Přepne URL fotky na jinou hotovou velikost od Tipcars. */
export function tipcarsVariant(url: string, variant: TipcarsVariant): string {
  if (!isTipcarsImage(url)) return url;

  for (const known of TIPCARS_VARIANTS) {
    if (url.includes(`/${known}/`)) {
      return known === variant ? url : url.replace(`/${known}/`, `/${variant}/`);
    }
  }

  return url;
}

/**
 * Loader pro next/image: místo `/_next/image?...` vrátí přímou adresu
 * odpovídající velikosti. Obrázky tak servíruje CDN Tipcars, ale prohlížeč
 * si díky `sizes` pořád vybírá podle šířky displeje.
 */
export function tipcarsLoader({ src, width }: { src: string; width: number }): string {
  if (!isTipcarsImage(src)) return src;
  if (width <= 200) return tipcarsVariant(src, "fotky_male");
  if (width <= 1000) return tipcarsVariant(src, "fotky_velke");
  return tipcarsVariant(src, "fotky_zdrojove");
}
