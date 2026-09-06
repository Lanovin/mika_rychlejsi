import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Vehicle, FuelType, Transmission } from "@/src/lib/vehicle-types";
import { readDatabaseJson, writeDatabaseJson } from "@/src/lib/server-storage";

const TIPCARS_URL =
  process.env.TIPCARS_URL ||
  "http://export.tipcars.com/inzerce_xml.php?R=ste26244a&F=2529&T=N&Z=N&V=N";

const PHOTO_ZDROJOVE = "https://img.tipcars.com/fotky_zdrojove/";
const isVercelDeployment = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const configuredTimeout = Number.parseInt(process.env.TIPCARS_TIMEOUT_MS ?? "", 10);

// Na Vercelu musí celé načtení stránky (feed + databáze + render) stihnout
// limit funkce, proto je limit na pokus krátký. Dva pokusy se do něj vejdou.
const TIPCARS_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : (isVercelDeployment ? 3500 : 15000);
const TIPCARS_ATTEMPTS = 2;
const TIPCARS_RETRY_DELAY_MS = 250;

// Strop pro celé stahování včetně opakování. Bez něj mohly dva pokusy sežrat
// tolik času, že funkce na Vercelu spadla na vlastní limit a návštěvník dostal
// místo stránky chybu – tedy přesně to, čemu se opakováním předchází.
const TIPCARS_TOTAL_BUDGET_MS = isVercelDeployment ? 6000 : 32000;
const TIPCARS_MIN_ATTEMPT_MS = 1200;

// Když se feed nepodaří stáhnout, nemá smysl to zkoušet u každého požadavku
// znovu – každý takový pokus je několik sekund čekání navíc pro návštěvníka.
// Po neúspěchu se proto chvíli servíruje záloha bez čekání.
const TIPCARS_FAILURE_COOLDOWN_MS = 60 * 1000;

// Poslední úspěšně stažený feed v databázi. Paměť funkce na Vercelu je
// krátkodobá; po studeném startu by bez tohoto snímku spadla nabídka na
// data/inventory.json, kde jsou jen ukázkové vozy s cizími fotkami.
const SNAPSHOT_STORE_KEY = "tipcars-snapshot";
const SNAPSHOT_MIN_WRITE_INTERVAL_MS = 10 * 60 * 1000;
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Server Tipcars je běžný Apache; požadavky bez rozumné identifikace
// hostitelé rádi odmítají, tak se představíme.
const TIPCARS_USER_AGENT = "MikaAutoWeb/1.0 (+https://www.mikaauto.cz)";

/** Adresa bez query stringu – v logu nechceme přístupový token feedu. */
function tipcarsUrlForLog() {
  return TIPCARS_URL.split("?")[0];
}

function describeFetchError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return `vypršel limit ${TIPCARS_TIMEOUT_MS} ms`;
    }
    const code = (err as { cause?: { code?: string } }).cause?.code;
    return code ? `${err.name}: ${err.message} (${code})` : `${err.name}: ${err.message}`;
  }
  return String(err);
}

function photoUrl(nazev: string): string {
  // nazev = "14544030_1.jpg" → need "fotky_zdrojove/14544030_1/0/x/x.jpg"
  const base = nazev.replace(/\.[^.]+$/, ""); // strip extension
  return `${PHOTO_ZDROJOVE}${base}/0/x/x.jpg`;
}

// Simple XML text extraction helpers (no external parser needed)
function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?=[\\s>/])([^>]*)>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[2].trim() : "";
}

function getAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?=[\\s>/])([^>]*)>([\\s\\S]*?)</${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[2].trim());
  }
  return results;
}

function getAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?=[\\s>/])[^>]*>[\\s\\S]*?</${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[0]);
  }
  return results;
}

function mapFuel(raw: string): FuelType {
  const lower = raw.toLowerCase();
  if (lower.includes("hybrid")) return "hybrid";
  if (lower.includes("nafta") || lower.includes("diesel")) return "nafta";
  if (lower.includes("benz")) return "benzín";
  if (lower.includes("elekt")) return "elektro";
  if (lower.includes("lpg")) return "LPG";
  if (lower.includes("cng")) return "CNG";
  return "benzín";
}

function mapTransmission(equipmentList: string[]): Transmission {
  const joined = equipmentList.join(" ").toLowerCase();
  if (joined.includes("aut. převodovka") || joined.includes("automat")) {
    return "automatická";
  }
  return "manuální";
}

function parseYear(madeDate: string): number {
  // madeDate format: YYYYMM e.g. "201804"
  const y = parseInt(madeDate.substring(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeVehicleText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasVatDeduction(...texts: string[]): boolean {
  const normalized = normalizeVehicleText(texts.join(" "));

  if (/\bbez(?:\s+moznosti)?\s+odpo(?:cet|ctu)\s+dph\b/.test(normalized)) {
    return false;
  }

  return (
    /\bodpo(?:cet|ctu|ctem)\s+dph\b/.test(normalized)
    || /\bdph\s+odecitateln(?:a|e|ou)\b/.test(normalized)
    || /\b(?:moznost|moznosti|mozny|mozna|mozne)\s+odpo(?:cet|ctu)\s+dph\b/.test(normalized)
    || /\bs\s+moznosti\s+odpoctu\s+dph\b/.test(normalized)
  );
}

function parseCarXml(carXml: string): Vehicle | null {
  const tipcarsId = getTag(carXml, "custom_car_id");
  if (!tipcarsId) return null;

  // Skip non-public or removed vehicles
  const vyrazeny = getTag(carXml, "vyrazeny");
  if (vyrazeny === "A") return null;

  const manufacturer = decodeEntities(getTag(carXml, "manufacturer_text"));
  const model = decodeEntities(getTag(carXml, "model_text"));
  const typeInfo = decodeEntities(getTag(carXml, "type_info"));
  const kindText = decodeEntities(getTag(carXml, "kind_text"));
  const bodyText = decodeEntities(getTag(carXml, "body_text"));
  const rawPriceWithoutVat = parseInt(getTag(carXml, "price"), 10) || 0;
  const rawPriceWithVat = parseInt(getTag(carXml, "price_2"), 10) || rawPriceWithoutVat;
  const priceWithoutVat = rawPriceWithoutVat > 0 && rawPriceWithVat > 0 && rawPriceWithoutVat !== rawPriceWithVat
    ? rawPriceWithoutVat
    : undefined;
  const price = rawPriceWithVat || rawPriceWithoutVat || 0;
  const mileage = parseInt(getTag(carXml, "tachometr"), 10) || 0;
  const powerKw = parseInt(getTag(carXml, "engine_power"), 10) || 0;
  const engineVolume = parseInt(getTag(carXml, "engine_volume"), 10) || 0;
  const fuelText = decodeEntities(getTag(carXml, "fuel_text"));
  const colorText = decodeEntities(getTag(carXml, "color_text"));
  const vin = getTag(carXml, "vin");
  const stk = getTag(carXml, "stk_to");
  const conditionText = decodeEntities(getTag(carXml, "condition_text"));
  const note = decodeEntities(getTag(carXml, "note"));
  const madeDate = getTag(carXml, "made_date");
  const dateIn = getTag(carXml, "date_in");

  // Photos – extract <photos> wrapper first, then individual <photo> entries
  let mainPhoto = "";
  const gallery: string[] = [];
  const photosContent = getTag(carXml, "photos");
  if (photosContent) {
    const photoRe = /<photo\b[^>]*>([\s\S]*?)<\/photo>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = photoRe.exec(photosContent)) !== null) {
      const inner = pm[1];
      const nameMatch = inner.match(/<nazev[^>]*>([\s\S]*?)<\/nazev>/i);
      const nazev = nameMatch ? nameMatch[1].trim() : "";
      if (!nazev) continue;
      const url = photoUrl(nazev);
      gallery.push(url);
      const mainMatch = inner.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch && mainMatch[1].trim() === "1") {
        mainPhoto = url;
      }
    }
  }

  if (!mainPhoto && gallery.length > 0) {
    mainPhoto = gallery[0];
  }

  // Equipment
  const equipmentTexts = getAllTags(carXml, "equipment_text").map(decodeEntities);

  // Tipcars dedicated VAT-deduction flag: <dph>A</dph> = yes, <dph>N</dph> = no
  const dphTag = getTag(carXml, "dph").trim().toUpperCase();
  const vatDeduction = Boolean(priceWithoutVat)
    || dphTag === "A"
    || (dphTag !== "N" && hasVatDeduction(note, ...equipmentTexts));

  const fuel = mapFuel(fuelText);
  const transmission = mapTransmission(equipmentTexts);
  const year = parseYear(madeDate);

  const title = `${manufacturer} ${model}${typeInfo ? " " + typeInfo : ""}`;
  const id = slugify(`${manufacturer}-${model}-${year}-${tipcarsId}`);

  return {
    id,
    tipcarsId,
    title,
    make: manufacturer,
    model,
    year,
    price,
    priceWithVat: price,
    priceWithoutVat,
    vatDeduction,
    mileage,
    fuel,
    transmission,
    body: bodyText,
    powerKw,
    engineVolume,
    color: colorText,
    vin,
    stk,
    condition: conditionText,
    kind: kindText || "Osobní",
    location: "Praha 9 – Čakovice",
    description: note,
    imageUrl: mainPhoto,
    gallery,
    equipment: equipmentTexts,
    published: true,
    featured: false,
    createdAt: dateIn || new Date().toISOString(),
    updatedAt: dateIn || new Date().toISOString(),
  };
}

// Poslední známá dobrá data. Drží se i po vypršení TTL – když feed vypadne,
// je stará nabídka pořád lepší než prázdná stránka nebo ukázkové vozy.
let cachedVehicles: Vehicle[] | null = null;
let cacheTimestamp = 0;
let cacheIsFallback = false;
let nextAttemptAt = 0;
let lastSnapshotWriteAt = 0;
let lastSnapshotFingerprint = "";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const INVENTORY_PATH = path.join(process.cwd(), "data", "inventory.json");

async function loadLocalInventory(): Promise<Vehicle[]> {
  try {
    const raw = await readFile(INVENTORY_PATH, "utf8");
    const data = JSON.parse(raw);
    const vehicles: Vehicle[] = (data.vehicles ?? []).map((rawVehicle: Record<string, unknown>) => {
      const description = typeof rawVehicle.description === "string" ? rawVehicle.description : "";
      const equipment = Array.isArray(rawVehicle.equipment)
        ? rawVehicle.equipment.filter((item): item is string => typeof item === "string")
        : [];
      const price = typeof rawVehicle.price === "number" ? rawVehicle.price : 0;
      const priceWithVat = typeof rawVehicle.priceWithVat === "number" ? rawVehicle.priceWithVat : price;
      const priceWithoutVat = typeof rawVehicle.priceWithoutVat === "number" ? rawVehicle.priceWithoutVat : undefined;
      const vatDeduction = typeof rawVehicle.vatDeduction === "boolean"
        ? rawVehicle.vatDeduction
        : Boolean(priceWithoutVat) || hasVatDeduction(description, ...equipment);

      return {
        tipcarsId: typeof rawVehicle.tipcarsId === "string"
          ? rawVehicle.tipcarsId
          : String(rawVehicle.id ?? ""),
        engineVolume: typeof rawVehicle.engineVolume === "number" ? rawVehicle.engineVolume : 0,
        color: typeof rawVehicle.color === "string" ? rawVehicle.color : "",
        vin: typeof rawVehicle.vin === "string" ? rawVehicle.vin : "",
        stk: typeof rawVehicle.stk === "string" ? rawVehicle.stk : "",
        condition: typeof rawVehicle.condition === "string" ? rawVehicle.condition : "",
        kind: typeof rawVehicle.kind === "string" ? rawVehicle.kind : "Osobní",
        ...rawVehicle,
        price,
        priceWithVat,
        priceWithoutVat,
        description,
        equipment,
        vatDeduction,
      } as unknown as Vehicle;
    });
    return vehicles;
  } catch (e) {
    console.error("Failed to load local inventory:", e);
    return [];
  }
}

interface TipcarsSnapshot {
  savedAt: string;
  vehicles: Vehicle[];
}

/** Levný otisk nabídky – aby se do databáze nezapisovala nezměněná data. */
function snapshotFingerprint(vehicles: Vehicle[]): string {
  return `${vehicles.length}:${vehicles.map((v) => `${v.tipcarsId}@${v.price}@${v.updatedAt}`).join("|")}`;
}

/** Uloží poslední úspěšný feed jako zálohu pro studené starty. */
function saveSnapshot(vehicles: Vehicle[]): void {
  const now = Date.now();
  const fingerprint = snapshotFingerprint(vehicles);

  if (fingerprint === lastSnapshotFingerprint) return;
  if (now - lastSnapshotWriteAt < SNAPSHOT_MIN_WRITE_INTERVAL_MS) return;

  // Nastavuje se ještě před zápisem, aby souběžné požadavky nezapisovaly
  // tutéž nabídku několikrát.
  lastSnapshotWriteAt = now;
  lastSnapshotFingerprint = fingerprint;

  // Zápis vědomě neblokuje vykreslení stránky. Když ho Vercel po odeslání
  // odpovědi utne, prostě se uloží až při některém dalším obnovení feedu.
  void writeDatabaseJson<TipcarsSnapshot>(SNAPSHOT_STORE_KEY, {
    savedAt: new Date().toISOString(),
    vehicles,
  }).catch(() => {
    lastSnapshotFingerprint = "";
  });
}

async function loadSnapshot(): Promise<Vehicle[]> {
  const snapshot = await readDatabaseJson<TipcarsSnapshot>(SNAPSHOT_STORE_KEY);
  if (!snapshot || !Array.isArray(snapshot.vehicles) || snapshot.vehicles.length === 0) {
    return [];
  }

  const savedAt = Date.parse(snapshot.savedAt);
  if (Number.isFinite(savedAt) && Date.now() - savedAt > SNAPSHOT_MAX_AGE_MS) {
    console.warn(`[tipcars] Záloha nabídky je starší než 7 dní (${snapshot.savedAt}), nepoužívám ji.`);
    return [];
  }

  return snapshot.vehicles;
}

/**
 * Náhradní zdroj nabídky, od nejlepšího k nejhoršímu:
 * poslední uložený feed → ukázkové vozy z repozitáře.
 */
async function loadFallbackVehicles(): Promise<Vehicle[]> {
  try {
    const snapshot = await loadSnapshot();
    if (snapshot.length > 0) {
      console.warn(`[tipcars] Používám zálohu nabídky z databáze (${snapshot.length} vozů).`);
      return snapshot;
    }
  } catch (error) {
    console.warn("[tipcars] Zálohu nabídky se z databáze nepodařilo načíst.", error);
  }

  return loadLocalInventory();
}

/**
 * Jeden pokus o stažení feedu.
 *
 * `clearTimeout` je záměrně až v `finally`: `fetch` se vrátí hned po
 * hlavičkách, takže kdyby se limit rušil hned za ním, nehlídal by stahování
 * těla (přes 900 kB XML) vůbec.
 */
async function fetchTipcarsXml(timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(TIPCARS_URL, {
      next: { revalidate: 300 },
      signal: controller.signal,
      headers: { "User-Agent": TIPCARS_USER_AGENT },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    return new TextDecoder("windows-1250").decode(buffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTipcarsVehicles(): Promise<Vehicle[]> {
  const now = Date.now();

  if (cachedVehicles && !cacheIsFallback && now - cacheTimestamp < CACHE_TTL) {
    return cachedVehicles;
  }

  // Feed nedávno selhal a něco k zobrazení máme – neblokujeme návštěvníka
  // dalším čekáním na server, který stejně nejspíš neodpoví.
  if (cachedVehicles && now < nextAttemptAt) {
    return cachedVehicles;
  }

  const startedAt = Date.now();
  let lastReason = "neznámá chyba";

  for (let attempt = 1; attempt <= TIPCARS_ATTEMPTS; attempt += 1) {
    const remainingBudget = TIPCARS_TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (remainingBudget < TIPCARS_MIN_ATTEMPT_MS) {
      lastReason = `${lastReason}; na další pokus už nezbyl čas (limit ${TIPCARS_TOTAL_BUDGET_MS} ms)`;
      break;
    }

    try {
      const xml = await fetchTipcarsXml(Math.min(TIPCARS_TIMEOUT_MS, remainingBudget));

      // Tipcars umí vrátit HTTP 200 a chybu až uvnitř XML – typicky kód 49,
      // "XML export není pro tento přístup povolený".
      const errorMsg = getTag(xml, "chyba");
      if (errorMsg) {
        const errorCode = getTag(xml, "chyba_kod");
        lastReason = `Tipcars odpověděl chybou [${errorCode}]: ${errorMsg.trim()}`;
        break; // Odpověď serveru; opakování nepomůže.
      }

      const vehicles: Vehicle[] = [];
      for (const block of getAllBlocks(xml, "car")) {
        const vehicle = parseCarXml(block);
        if (vehicle) {
          vehicles.push(vehicle);
        }
      }

      if (vehicles.length === 0) {
        lastReason = `feed se stáhl (${xml.length} znaků), ale neobsahoval žádný vůz`;
        break; // Nejspíš změna formátu; opakování nepomůže.
      }

      cachedVehicles = vehicles;
      cacheTimestamp = Date.now();
      cacheIsFallback = false;
      nextAttemptAt = 0;
      saveSnapshot(vehicles);
      return vehicles;
    } catch (err) {
      lastReason = describeFetchError(err);
      if (attempt < TIPCARS_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, TIPCARS_RETRY_DELAY_MS));
      }
    }
  }

  nextAttemptAt = Date.now() + TIPCARS_FAILURE_COOLDOWN_MS;

  // Jediné místo, kde se hlásí propadnutí na zálohu – ať je v logu Vercelu
  // hned vidět, proč se zobrazují záložní inzeráty.
  console.error(
    `[tipcars] Feed se nenačetl ani na ${TIPCARS_ATTEMPTS}. pokus`
    + ` (${Date.now() - startedAt} ms, limit ${TIPCARS_TIMEOUT_MS} ms na pokus): ${lastReason}.`
    + ` Zobrazuji ${cachedVehicles ? "poslední úspěšně načtená data" : "zálohu nabídky"}.`
    + ` Zdroj: ${tipcarsUrlForLog()}`
  );

  if (cachedVehicles) {
    return cachedVehicles;
  }

  const fallback = await loadFallbackVehicles();
  if (fallback.length > 0) {
    cachedVehicles = fallback;
    cacheTimestamp = Date.now();
    cacheIsFallback = true;
  }
  return fallback;
}
