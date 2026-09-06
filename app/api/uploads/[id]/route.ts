import { readUploadFromStorage } from "@/src/lib/server-storage";

/**
 * Obrázky nahrané v CMS. Adresa obsahuje UUID, takže obsah pod jedním id se
 * nikdy nemění – proto se smí cachovat natvrdo a držet v paměti funkce.
 *
 * Dřív šel každý požadavek přímo do databáze a jakákoli její chyba (studený
 * start Neonu, vyčerpaný pool, výpadek sítě) skončila neošetřenou výjimkou,
 * tedy stavem 500 a rozbitým obrázkem na stránce. Teď se čte z paměti, chyba
 * se odchytí, jednou zopakuje a odpověď se nikdy neuloží do cache jako chyba.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CachedUpload {
  fileName: string;
  contentType: string;
  content: Buffer;
  etag: string;
}

const MEMORY_CACHE_MAX_ENTRIES = 32;
const MEMORY_CACHE_MAX_BYTES = 32 * 1024 * 1024;
const RETRY_DELAY_MS = 150;

declare global {
  var __mikaUploadCache: Map<string, CachedUpload> | undefined;
  var __mikaUploadMisses: Map<string, number> | undefined;
}

const NEGATIVE_CACHE_TTL_MS = 60 * 1000;

function getCache() {
  if (!globalThis.__mikaUploadCache) {
    globalThis.__mikaUploadCache = new Map();
  }
  return globalThis.__mikaUploadCache;
}

function getMissCache() {
  if (!globalThis.__mikaUploadMisses) {
    globalThis.__mikaUploadMisses = new Map();
  }
  return globalThis.__mikaUploadMisses;
}

function cacheUpload(id: string, upload: CachedUpload) {
  const cache = getCache();
  cache.delete(id);
  cache.set(id, upload);

  let bytes = 0;
  for (const entry of cache.values()) {
    bytes += entry.content.length;
  }

  // Nejstarší záznamy ven, dokud se cache nevejde do limitu. Mapa si drží
  // pořadí vkládání, takže první klíč je vždy ten nejdéle nepoužitý.
  while (cache.size > MEMORY_CACHE_MAX_ENTRIES || (bytes > MEMORY_CACHE_MAX_BYTES && cache.size > 1)) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    const evicted = cache.get(oldest.value);
    cache.delete(oldest.value);
    bytes -= evicted?.content.length ?? 0;
  }
}

function sanitizeHeaderFileName(value: string) {
  return value.replace(/["\\r\n]/g, "-");
}

function isValidId(id: string) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(id);
}

async function loadUpload(id: string): Promise<CachedUpload | null> {
  const cached = getCache().get(id);
  if (cached) {
    // Znovu vložit = posunout na konec pořadí, aby se nevyhodil zrovna
    // obrázek, který je na stránce pořád vidět.
    cacheUpload(id, cached);
    return cached;
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const upload = await readUploadFromStorage(id);
      if (!upload) {
        return null;
      }

      const content = Buffer.isBuffer(upload.content) ? upload.content : Buffer.from(upload.content);
      const entry: CachedUpload = {
        fileName: upload.fileName,
        contentType: upload.contentType || "application/octet-stream",
        content,
        etag: `"${id}-${content.length}"`,
      };
      cacheUpload(id, entry);
      return entry;
    } catch (error) {
      lastError = error;
      if (attempt === 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  if (!isValidId(id)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  // Neexistující id se krátce pamatuje, aby rozbitý odkaz v CMS nebušil
  // do databáze při každém načtení stránky.
  const missedAt = getMissCache().get(id);
  if (missedAt && Date.now() - missedAt < NEGATIVE_CACHE_TTL_MS) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  let upload: CachedUpload | null;
  try {
    upload = await loadUpload(id);
  } catch (error) {
    console.error(`[uploads] Obrázek ${id} se nepodařilo načíst z databáze.`, error);
    // Chyba na naší straně se nesmí zapamatovat – prohlížeč i CDN to musí
    // příště zkusit znovu, jinak zůstane obrázek rozbitý až do dalšího nasazení.
    return new Response("Upload temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "5" },
    });
  }

  if (!upload) {
    getMissCache().set(id, Date.now());
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": upload.contentType,
    "Content-Length": String(upload.content.length),
    "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    "ETag": upload.etag,
    "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(upload.fileName)}"`,
  };

  if (request.headers.get("if-none-match") === upload.etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(new Uint8Array(upload.content), { headers });
}
