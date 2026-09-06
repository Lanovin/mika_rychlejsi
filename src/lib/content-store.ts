import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { readStoredJson, writeStoredJson } from "@/src/lib/server-storage";

export type ContentData = Record<string, unknown>;

const contentPath = path.join(process.cwd(), "data", "content.json");

const MEMORY_CACHE_TTL_MS = 60 * 1000;

let memoryCache: { data: ContentData; expiresAt: number } | null = null;

/**
 * Výchozí obsah z repozitáře, který se použije jen pro klíče, jež v databázi
 * vůbec nejsou.
 *
 * Databáze drží poslední uložení z CMS. Když se do kódu přidá nová stránka
 * nebo sekce, uložený snímek o ní neví a stránka spadne na `undefined`
 * (typicky bílá stránka / chyba 500). Doplňují se schválně jen chybějící
 * klíče nejvyšší úrovně – hlubší slučování by vracelo obsah, který někdo
 * v CMS záměrně smazal.
 */
function withFileDefaults(stored: ContentData, defaults: ContentData | null): ContentData {
  if (!defaults) return stored;

  const merged: ContentData = { ...stored };
  for (const [key, value] of Object.entries(defaults)) {
    if (merged[key] === undefined || merged[key] === null) {
      merged[key] = value;
    }
  }
  return merged;
}

async function readFileDefaults(): Promise<ContentData | null> {
  try {
    const raw = await readFile(contentPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ContentData) : null;
  } catch {
    return null;
  }
}

async function readContentUncached(): Promise<ContentData> {
  const [stored, defaults] = await Promise.all([
    readStoredJson<ContentData>({
      storeKey: "content",
      filePath: contentPath,
      defaultValue: {},
    }),
    readFileDefaults(),
  ]);

  return withFileDefaults(stored, defaults);
}

export const readContent = cache(async (): Promise<ContentData> => {
  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.data;
  }
  const data = await readContentUncached();
  memoryCache = { data, expiresAt: now + MEMORY_CACHE_TTL_MS };
  return data;
});

export async function writeContent(data: ContentData): Promise<void> {
  await writeStoredJson({
    storeKey: "content",
    filePath: contentPath,
    data,
  });
  memoryCache = { data, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS };
}

export function invalidateContentCache(): void {
  memoryCache = null;
}
