import path from "node:path";
import { cache } from "react";
import type { Vehicle, VehicleLabels } from "@/src/lib/vehicle-types";
import { fetchTipcarsVehicles } from "@/src/lib/tipcars";
import { readStoredJson, writeStoredJson } from "@/src/lib/server-storage";

const labelsPath = path.join(process.cwd(), "data", "vehicle-labels.json");

const LABELS_MEMORY_TTL_MS = 60 * 1000;
let labelsMemoryCache: { data: VehicleLabels; expiresAt: number } | null = null;

async function readLabelsUncached(): Promise<VehicleLabels> {
  return readStoredJson<VehicleLabels>({
    storeKey: "vehicle-labels",
    filePath: labelsPath,
    defaultValue: () => ({}),
  });
}

const readLabels = cache(async (): Promise<VehicleLabels> => {
  const now = Date.now();
  if (labelsMemoryCache && labelsMemoryCache.expiresAt > now) {
    return labelsMemoryCache.data;
  }
  const data = await readLabelsUncached();
  labelsMemoryCache = { data, expiresAt: now + LABELS_MEMORY_TTL_MS };
  return data;
});

async function writeLabels(labels: VehicleLabels) {
  await writeStoredJson({
    storeKey: "vehicle-labels",
    filePath: labelsPath,
    data: labels,
  });
  labelsMemoryCache = { data: labels, expiresAt: Date.now() + LABELS_MEMORY_TTL_MS };
}

function applyLabels(vehicles: Vehicle[], labels: VehicleLabels): Vehicle[] {
  return vehicles.map((v) => {
    const label = labels[v.tipcarsId];
    if (label) {
      return {
        ...v,
        featured: label.featured,
        published: label.published !== undefined ? label.published : true,
      };
    }
    return v;
  });
}

function sortVehicles(vehicles: Vehicle[]) {
  return [...vehicles].sort((a, b) => {
    // Featured first, then by date
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const readVehicles = cache(async (): Promise<Vehicle[]> => {
  const [tipcarsVehicles, labels] = await Promise.all([
    fetchTipcarsVehicles(),
    readLabels(),
  ]);
  const labeled = applyLabels(tipcarsVehicles, labels);
  return sortVehicles(labeled);
});

export const readPublishedVehicles = cache(async (): Promise<Vehicle[]> => {
  const vehicles = await readVehicles();
  return vehicles.filter((v) => v.published);
});

/**
 * Adresa vozu končí id z Tipcars (`…-2024-25297744`). Textová část se odvozuje
 * z názvu, který klient v Tipcars může přepsat – pak by starý odkaz (Google,
 * sdílený chat, sitemap z minulé hodiny) skončil na 404. Proto se po přesné
 * shodě zkouší ještě shoda podle id na konci adresy.
 */
export const readVehicleById = cache(async (id: string): Promise<Vehicle | null> => {
  const vehicles = await readVehicles();
  const exact = vehicles.find((v) => v.id === id);
  if (exact) return exact;

  const tipcarsId = id.split("-").pop();
  if (!tipcarsId) return null;
  return vehicles.find((v) => v.tipcarsId === tipcarsId) ?? null;
});

export async function setVehicleLabel(
  tipcarsId: string,
  updates: { featured?: boolean; published?: boolean }
) {
  const labels = await readLabels();
  const existing = labels[tipcarsId] ?? { featured: false, published: true };
  labels[tipcarsId] = {
    featured: updates.featured ?? existing.featured,
    published: updates.published ?? existing.published,
  };
  await writeLabels(labels);
}

export async function readVehicleLabels(): Promise<VehicleLabels> {
  return readLabels();
}
