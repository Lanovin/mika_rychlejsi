import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_NON_POOLING,
    process.env.POSTGRES_URL_NO_SSL,
  ];

  for (const candidate of candidates) {
    const normalized = candidate?.trim();
    if (normalized) {
      return normalized;
    }
  }

  const host = process.env.PGHOST?.trim() || process.env.POSTGRES_HOST?.trim();
  const database = process.env.PGDATABASE?.trim() || process.env.POSTGRES_DATABASE?.trim();
  const user = process.env.PGUSER?.trim() || process.env.POSTGRES_USER?.trim();
  const password = process.env.PGPASSWORD?.trim() || process.env.POSTGRES_PASSWORD?.trim();
  const port = process.env.PGPORT?.trim() || process.env.POSTGRES_PORT?.trim();

  if (!host || !database || !user || !password) {
    return undefined;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const portSegment = port ? `:${port}` : "";

  return `postgresql://${encodedUser}:${encodedPassword}@${host}${portSegment}/${database}?sslmode=require`;
}

const databaseUrl = resolveDatabaseUrl();
const JSON_STORE_TABLE = "app_json_store";
const UPLOADS_TABLE = "app_uploads";

declare global {
  var __mikaStoragePool: Pool | undefined;
  var __mikaStorageSchemaPromise: Promise<void> | undefined;
}

type DefaultValueFactory<T> = T | (() => T);

function hasFileNotFoundCode(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "ENOENT";
}

function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveDefaultValue<T>(defaultValue: DefaultValueFactory<T>): T {
  return typeof defaultValue === "function"
    ? cloneJsonValue((defaultValue as () => T)())
    : cloneJsonValue(defaultValue);
}

export function hasDatabaseStorage() {
  return Boolean(databaseUrl);
}

function getPool() {
  if (!databaseUrl) {
    return null;
  }

  if (!globalThis.__mikaStoragePool) {
    // Without these timeouts an unreachable/suspended database makes
    // pool.connect()/query() wait forever, which hangs every dynamic page
    // (black screen) and the contact API. With them the error path kicks in
    // and readStoredJson falls back to the bundled JSON files.
    globalThis.__mikaStoragePool = new Pool({
      connectionString: databaseUrl,
      max: 3,
      // Neon se po nečinnosti uspí; probuzení trvá i pár sekund, proto je
      // limit na navázání spojení štědřejší než limit na samotný dotaz.
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      // Zaseknutý dotaz znamená čekajícího návštěvníka; propadnutí na
      // soubory v repozitáři je lepší než stránka načítající se deset sekund.
      // Přes Neon pooler drží limit hlavně `query_timeout` (hlídá si ho
      // klient) – serverový `statement_timeout` přes pgbouncer neprojde.
      // Do konfigurace spojení se nesmí dostat `options`, ten Neon pooler
      // odmítá už při navazování spojení.
      query_timeout: 8000,
      statement_timeout: 8000,
      ssl: databaseUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  return globalThis.__mikaStoragePool;
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

/** 42P01 = relation does not exist – tabulka ještě nevznikla. */
function isMissingTableError(error: unknown) {
  return errorCode(error) === "42P01";
}

/**
 * Souběžné `CREATE TABLE IF NOT EXISTS` může skončit chybou z jedinečného
 * indexu v systémovém katalogu. Znamená to jediné: tabulku právě vyrobil
 * někdo jiný, což je přesně ten kýžený stav.
 */
function isConcurrentCreateError(error: unknown) {
  const code = errorCode(error);
  return code === "23505" || code === "42P07";
}

/**
 * Založení tabulek.
 *
 * Dřív to hlídal `pg_advisory_lock`. Jenže spojení jde přes Neon pooler
 * (pgbouncer v transakčním režimu), kde `lock` a `unlock` mohou skončit na
 * dvou různých serverových sezeních – zámek se pak neuvolní a **další
 * studený start na něm čeká, dokud nevyprší časový limit dotazu**. To se
 * navenek projevilo jako pomalá nebo prázdná stránka a jako obsah, který se
 * tiše vrátil ke starým souborům v repozitáři.
 *
 * Zámek tu nebyl potřeba: `CREATE TABLE IF NOT EXISTS` je idempotentní
 * a jediný možný souběh se dá poznat podle chybového kódu a ignorovat.
 */
async function createStorageTables(pool: Pool): Promise<void> {
  const statements = [
    `
      CREATE TABLE IF NOT EXISTS ${JSON_STORE_TABLE} (
        store_key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS ${UPLOADS_TABLE} (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        content BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
  ];

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (!isConcurrentCreateError(error)) {
        throw error;
      }
    }
  }
}

async function ensureStorageSchema(pool: Pool): Promise<void> {
  if (!globalThis.__mikaStorageSchemaPromise) {
    globalThis.__mikaStorageSchemaPromise = createStorageTables(pool).catch((error) => {
      // Neúspěch se nepamatuje, ať to jde příště zkusit znovu.
      globalThis.__mikaStorageSchemaPromise = undefined;
      throw error;
    });
  }

  await globalThis.__mikaStorageSchemaPromise;
}

/**
 * Spustí dotaz nad úložištěm. Tabulky se zakládají až ve chvíli, kdy dotaz
 * narazí na to, že neexistují – běžný požadavek tak má jediné kolečko do
 * databáze místo šesti (spojení, zámek, dvě DDL, odemknutí, teprve dotaz).
 */
async function withStorage<T>(run: (pool: Pool) => Promise<T>): Promise<T | null> {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  try {
    return await run(pool);
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  await ensureStorageSchema(pool);
  return run(pool);
}

async function readJsonFile<T>(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (hasFileNotFoundCode(error)) {
      return null;
    }
    throw error;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function readStoredJson<T>(options: {
  storeKey: string;
  filePath: string;
  defaultValue: DefaultValueFactory<T>;
}): Promise<T> {
  const { storeKey, filePath, defaultValue } = options;
  const fallbackValue = await readJsonFile<T>(filePath);

  if (!hasDatabaseStorage()) {
    return fallbackValue ?? resolveDefaultValue(defaultValue);
  }

  try {
    const stored = await withStorage(async (pool) => {
      const result = await pool.query<{ value: T }>(
        `SELECT value FROM ${JSON_STORE_TABLE} WHERE store_key = $1`,
        [storeKey],
      );

      if (result.rowCount && result.rows[0]) {
        return { value: result.rows[0].value };
      }

      const seededValue = fallbackValue ?? resolveDefaultValue(defaultValue);
      await pool.query(
        `
          INSERT INTO ${JSON_STORE_TABLE} (store_key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (store_key) DO NOTHING
        `,
        [storeKey, JSON.stringify(seededValue)],
      );
      return { value: seededValue };
    });

    if (stored) {
      return stored.value;
    }

    return fallbackValue ?? resolveDefaultValue(defaultValue);
  } catch (error) {
    console.warn(`[storage] Failed to read ${storeKey} from database, falling back to file storage.`, error);
    return fallbackValue ?? resolveDefaultValue(defaultValue);
  }
}

export async function writeStoredJson<T>(options: {
  storeKey: string;
  filePath: string;
  data: T;
}): Promise<void> {
  const { storeKey, filePath, data } = options;

  if (hasDatabaseStorage()) {
    try {
      const written = await withStorage(async (pool) => {
        await pool.query(
          `
            INSERT INTO ${JSON_STORE_TABLE} (store_key, value, updated_at)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (store_key)
            DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          `,
          [storeKey, JSON.stringify(data)],
        );
        return true;
      });

      if (written) {
        return;
      }
    } catch (error) {
      console.warn(`[storage] Failed to write ${storeKey} to database, falling back to file storage.`, error);
    }
  }

  await writeJsonFile(filePath, data);
}

/**
 * Čtení hodnoty výhradně z databáze – bez souborové zálohy.
 *
 * Používá se pro data, která žádný soubor v repozitáři nezálohuje
 * (např. poslední úspěšně stažený feed Tipcars). Když databáze není
 * nastavená nebo selže, vrací `null` a volající si poradí sám.
 */
export async function readDatabaseJson<T>(storeKey: string): Promise<T | null> {
  if (!hasDatabaseStorage()) {
    return null;
  }

  try {
    const stored = await withStorage(async (pool) => {
      const result = await pool.query<{ value: T }>(
        `SELECT value FROM ${JSON_STORE_TABLE} WHERE store_key = $1`,
        [storeKey],
      );

      return result.rowCount && result.rows[0] ? { value: result.rows[0].value } : null;
    });

    return stored ? stored.value : null;
  } catch (error) {
    console.warn(`[storage] Failed to read ${storeKey} from database.`, error);
    return null;
  }
}

/**
 * Zápis výhradně do databáze. Na Vercelu je souborový systém read-only,
 * takže se tady záměrně nikam nepropadá – vrací se jen, jestli se to povedlo.
 */
export async function writeDatabaseJson<T>(storeKey: string, data: T): Promise<boolean> {
  if (!hasDatabaseStorage()) {
    return false;
  }

  try {
    const written = await withStorage(async (pool) => {
      await pool.query(
        `
          INSERT INTO ${JSON_STORE_TABLE} (store_key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
          ON CONFLICT (store_key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `,
        [storeKey, JSON.stringify(data)],
      );
      return true;
    });

    return written === true;
  } catch (error) {
    console.warn(`[storage] Failed to write ${storeKey} to database.`, error);
    return false;
  }
}

export async function saveUploadToStorage(options: {
  fileName: string;
  contentType: string;
  content: Buffer;
}) {
  const id = randomUUID();

  const saved = await withStorage(async (pool) => {
    await pool.query(
      `
        INSERT INTO ${UPLOADS_TABLE} (id, file_name, content_type, content, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
      [id, options.fileName, options.contentType, options.content],
    );
    return true;
  });

  if (!saved) {
    return null;
  }

  return {
    id,
    url: `/api/uploads/${id}`,
  };
}

export async function readUploadFromStorage(id: string) {
  return withStorage(async (pool) => {
    const result = await pool.query<{
      fileName: string;
      contentType: string;
      content: Buffer;
    }>(
      `
        SELECT file_name AS "fileName", content_type AS "contentType", content
        FROM ${UPLOADS_TABLE}
        WHERE id = $1
      `,
      [id],
    );

    if (!result.rowCount || !result.rows[0]) {
      return null;
    }

    return result.rows[0];
  });
}