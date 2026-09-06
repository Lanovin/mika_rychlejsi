"use client";

import { Suspense, useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { VehicleCard } from "@/src/components/VehicleCard";
import { SkeletonCard } from "@/src/components/SkeletonCard";
import type { VehicleListItem } from "@/src/lib/vehicle-types";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface InventoryFilters {
  makes: string[];
  models: string[];
  minPrice: number;
  maxPrice: number;
  minMileage: number;
  maxMileage: number;
  bodies: string[];
  transmission: string;
  fuel: string;
  kind: string;
}

const INITIAL_FILTERS: InventoryFilters = {
  makes: [],
  models: [],
  minPrice: 0,
  maxPrice: 5000000,
  minMileage: 0,
  maxMileage: 400000,
  bodies: [],
  transmission: "",
  fuel: "",
  kind: ""
};

interface InventoryPageClientProps {
  vehicles: VehicleListItem[];
  cs?: { kicker?: string; title?: string; subtitle?: string };
  en?: { kicker?: string; title?: string; subtitle?: string };
}

type SortOption = "recommended" | "price-asc" | "price-desc" | "year-desc" | "mileage-asc";

function getInitialFilters(initialQuickFilters?: { make?: string; model?: string; maxPrice?: string }): InventoryFilters {
  return {
    ...INITIAL_FILTERS,
    makes: initialQuickFilters?.make ? [initialQuickFilters.make] : [],
    models: initialQuickFilters?.model ? [initialQuickFilters.model] : [],
    maxPrice: initialQuickFilters?.maxPrice ? Number(initialQuickFilters.maxPrice) : INITIAL_FILTERS.maxPrice
  };
}

function getQuickFiltersFromSearchParams(searchParams: { get(name: string): string | null } | null) {
  return {
    make: searchParams?.get("make") ?? undefined,
    model: searchParams?.get("model") ?? undefined,
    maxPrice: searchParams?.get("maxPrice") ?? undefined,
  };
}

function InventorySearchParamsSync({
  onFiltersChange,
}: {
  onFiltersChange: (filters: InventoryFilters) => void;
}) {
  const searchParams = useSearchParams();
  const urlQuickFilters = getQuickFiltersFromSearchParams(searchParams);
  const urlQuickFiltersKey = `${urlQuickFilters.make ?? ""}|${urlQuickFilters.model ?? ""}|${urlQuickFilters.maxPrice ?? ""}`;

  useEffect(() => {
    onFiltersChange(getInitialFilters(urlQuickFilters));
  }, [onFiltersChange, urlQuickFiltersKey]);

  return null;
}

export function InventoryPageClient({ vehicles, cs, en }: InventoryPageClientProps) {
  const [filters, setFilters] = useState<InventoryFilters>(() => getInitialFilters());
  const [pendingFilters, setPendingFilters] = useState<InventoryFilters>(() => getInitialFilters());
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState<SortOption>("recommended");
  const { lang } = useLanguage();
  const c = lang === "en" ? (en ?? cs) : (cs ?? en);

  const syncFiltersFromUrl = useCallback((nextFilters: InventoryFilters) => {
    setFilters(nextFilters);
    setPendingFilters(nextFilters);
    setSort("recommended");
  }, []);

  const allMakes = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.make))).sort(), [vehicles]);

  const modelsByMake = useMemo(() => {
    const map: Record<string, string[]> = {};
    vehicles.forEach((vehicle) => {
      if (!map[vehicle.make]) {
        map[vehicle.make] = [];
      }
      if (!map[vehicle.make].includes(vehicle.model)) {
        map[vehicle.make].push(vehicle.model);
      }
    });
    return map;
  }, [vehicles]);

  const allBodies = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.body))).sort(), [vehicles]);
  const allKinds = useMemo(() => Array.from(new Set(vehicles.map((vehicle) => vehicle.kind).filter(Boolean))).sort(), [vehicles]);
  const allTransmissions = [t("trans.manual", lang), t("trans.auto", lang)];
  const allFuels = [t("fuel.benzin", lang), t("fuel.nafta", lang), t("fuel.hybrid", lang), t("fuel.elektro", lang)];

  const filteredCars = useMemo(() => {
    const nextCars = vehicles.filter((car) => {
      const matchesMake = filters.makes.length === 0 || filters.makes.includes(car.make);
      const matchesModel = filters.models.length === 0 || filters.models.includes(car.model);
      const matchesPrice = car.price >= filters.minPrice && car.price <= filters.maxPrice;
      const matchesMileage = car.mileage >= filters.minMileage && car.mileage <= filters.maxMileage;
      const matchesBody = filters.bodies.length === 0 || filters.bodies.includes(car.body);
      const matchesTransmission = !filters.transmission || car.transmission === filters.transmission;
      const matchesFuel = !filters.fuel || car.fuel === filters.fuel;
      const matchesKind = !filters.kind || car.kind === filters.kind;

      return matchesMake && matchesModel && matchesPrice && matchesMileage && matchesBody && matchesTransmission && matchesFuel && matchesKind;
    });

    return [...nextCars].sort((first, second) => {
      switch (sort) {
        case "price-asc":
          return first.price - second.price;
        case "price-desc":
          return second.price - first.price;
        case "year-desc":
          return second.year - first.year;
        case "mileage-asc":
          return first.mileage - second.mileage;
        default:
          return Number(second.featured) - Number(first.featured) || second.year - first.year;
      }
    });
  }, [filters, sort, vehicles]);

  const removeFilter = (partial: Partial<InventoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPendingFilters((prev) => ({ ...prev, ...partial }));
  };

  const removeToggleMake = (make: string) => {
    const update = (prev: InventoryFilters) => {
      const newMakes = prev.makes.filter((item) => item !== make);
      const allowedModels = newMakes.flatMap((item) => modelsByMake[item] ?? []);
      const nextModels = prev.models.filter((model) => allowedModels.includes(model));
      return { ...prev, makes: newMakes, models: nextModels };
    };
    setFilters(update);
    setPendingFilters(update);
  };

  const removeToggleModel = (model: string) => {
    const update = (prev: InventoryFilters) => ({
      ...prev, models: prev.models.filter((item) => item !== model)
    });
    setFilters(update);
    setPendingFilters(update);
  };

  const removeToggleBody = (body: string) => {
    const update = (prev: InventoryFilters) => ({
      ...prev, bodies: prev.bodies.filter((item) => item !== body)
    });
    setFilters(update);
    setPendingFilters(update);
  };

  const activeFilterChips = [
    ...filters.makes.map((make) => ({ label: make, onRemove: () => removeToggleMake(make) })),
    ...filters.models.map((model) => ({ label: model, onRemove: () => removeToggleModel(model) })),
    ...filters.bodies.map((body) => ({ label: body, onRemove: () => removeToggleBody(body) })),
    ...(filters.transmission ? [{ label: filters.transmission, onRemove: () => removeFilter({ transmission: "" }) }] : []),
    ...(filters.fuel ? [{ label: filters.fuel, onRemove: () => removeFilter({ fuel: "" }) }] : []),
    ...(filters.kind ? [{ label: filters.kind, onRemove: () => removeFilter({ kind: "" }) }] : []),
    ...(filters.minPrice > 0 || filters.maxPrice < INITIAL_FILTERS.maxPrice
      ? [{ label: `${filters.minPrice.toLocaleString("cs-CZ")}–${filters.maxPrice.toLocaleString("cs-CZ")} Kč`, onRemove: () => removeFilter({ minPrice: INITIAL_FILTERS.minPrice, maxPrice: INITIAL_FILTERS.maxPrice }) }]
      : []),
    ...(filters.minMileage > 0 || filters.maxMileage < INITIAL_FILTERS.maxMileage
      ? [{ label: `${filters.minMileage.toLocaleString("cs-CZ")}–${filters.maxMileage.toLocaleString("cs-CZ")} km`, onRemove: () => removeFilter({ minMileage: INITIAL_FILTERS.minMileage, maxMileage: INITIAL_FILTERS.maxMileage }) }]
      : [])
  ];

  const resetFilters = () => {
    setIsLoading(true);
    setPendingFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    setSort("recommended");
    setTimeout(() => setIsLoading(false), 250);
  };

  const handleFilterChange = (partial: Partial<InventoryFilters>) => {
    setPendingFilters((prev) => ({ ...prev, ...partial }));
  };

  const applyFilters = () => {
    setIsLoading(true);
    setFilters({ ...pendingFilters });
    setTimeout(() => setIsLoading(false), 250);
  };

  const toggleMake = (make: string) => {
    const newMakes = pendingFilters.makes.includes(make)
      ? pendingFilters.makes.filter((item) => item !== make)
      : [...pendingFilters.makes, make];

    const allowedModels = newMakes.flatMap((item) => modelsByMake[item] ?? []);
    const nextModels = pendingFilters.models.filter((model) => allowedModels.includes(model));

    handleFilterChange({ makes: newMakes, models: nextModels });
  };

  const toggleModel = (model: string) => {
    const newModels = pendingFilters.models.includes(model)
      ? pendingFilters.models.filter((item) => item !== model)
      : [...pendingFilters.models, model];
    handleFilterChange({ models: newModels });
  };

  const toggleBody = (body: string) => {
    const newBodies = pendingFilters.bodies.includes(body)
      ? pendingFilters.bodies.filter((item) => item !== body)
      : [...pendingFilters.bodies, body];
    handleFilterChange({ bodies: newBodies });
  };

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Lock body scroll when mobile filters are open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  const applyAndClose = () => {
    applyFilters();
    setMobileFiltersOpen(false);
  };

  const activeCount = activeFilterChips.length;

  return (
    <div className="container-page py-10">
      <Suspense fallback={null}>
        <InventorySearchParamsSync onFiltersChange={syncFiltersFromUrl} />
      </Suspense>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 reveal-on-scroll">
        <div>
          <p className="section-kicker">{c?.kicker || t("inv.kicker", lang)}</p>
          <h1
            className="mt-2 text-3xl font-semibold uppercase tracking-[0.03em] sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
          >
            {c?.title || t("inv.title", lang)}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {c?.subtitle || t("inv.subtitle", lang)}
          </p>
        </div>
        <div className="card-panel px-4 py-3 text-sm text-secondary">
          {t("inv.showing", lang)} <span className="font-semibold" style={{ color: "var(--cream)" }}>{filteredCars.length}</span> {t("inv.of", lang)} {vehicles.length} {t("inv.vehicles", lang)}
        </div>
      </header>

      {/* Mobile filter toggle button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("inv.narrow", lang)}
          {activeCount > 0 && (
            <span
              className="ml-1 inline-flex h-5 w-5 items-center justify-center text-[10px] font-bold"
              style={{ background: "var(--gold)", color: "var(--black-rich)", borderRadius: "50%" }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileFiltersOpen(false)}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[280px,minmax(0,1fr)]">
        <aside
          className={`${
            mobileFiltersOpen
              ? "fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[340px] translate-x-0"
              : "hidden lg:flex lg:translate-x-0"
          } flex flex-col transition-transform duration-300 ease-in-out lg:sticky lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:top-[100px] lg:max-h-[calc(100vh-120px)]`}
          style={{ background: "var(--black-card)", border: "1px solid var(--black-border)" }}
        >
          {/* Filter header – always visible */}
          <div className="flex items-center justify-between gap-3 border-b p-4" style={{ borderColor: "var(--black-border)" }}>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--cream)" }}>
                <SlidersHorizontal className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                {t("inv.narrow", lang)}
              </h2>
              <p className="mt-1 truncate text-xs text-muted">{t("inv.narrowDesc", lang)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-semibold transition" style={{ color: "var(--gold)" }}>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="lg:hidden" style={{ color: "var(--cream-muted)" }}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--black-border) transparent" }}>
            <div className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("filter.make", lang)}</label>
                <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--black-border) transparent" }}>
                  {allMakes.map((make) => (
                    <div key={make}>
                      <label className="flex cursor-pointer items-center" style={{ color: "var(--cream-muted)" }}>
                        <input type="checkbox" checked={pendingFilters.makes.includes(make)} onChange={() => toggleMake(make)} className="mr-2" />
                        {make}
                      </label>
                      {pendingFilters.makes.includes(make) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {(modelsByMake[make] ?? []).map((model) => (
                            <label key={model} className="flex cursor-pointer items-center text-xs text-secondary">
                              <input type="checkbox" checked={pendingFilters.models.includes(model)} onChange={() => toggleModel(model)} className="mr-2" />
                              {model}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.price", lang)}</label>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="text-xs text-secondary">{t("inv.from", lang)} {pendingFilters.minPrice.toLocaleString("cs-CZ")} Kč</label>
                    <input type="range" min="0" max="5000000" step="50000" value={pendingFilters.minPrice} onChange={(event) => handleFilterChange({ minPrice: Number(event.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-secondary">{t("inv.to", lang)} {pendingFilters.maxPrice.toLocaleString("cs-CZ")} Kč</label>
                    <input type="range" min="0" max="5000000" step="50000" value={pendingFilters.maxPrice} onChange={(event) => handleFilterChange({ maxPrice: Number(event.target.value) })} className="w-full" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.mileage", lang)}</label>
                <div className="mt-2 space-y-2">
                  <div>
                    <label className="text-xs text-secondary">{t("inv.from", lang)} {pendingFilters.minMileage.toLocaleString("cs-CZ")} km</label>
                    <input type="range" min="0" max="400000" step="10000" value={pendingFilters.minMileage} onChange={(event) => handleFilterChange({ minMileage: Number(event.target.value) })} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-secondary">{t("inv.to", lang)} {pendingFilters.maxMileage.toLocaleString("cs-CZ")} km</label>
                    <input type="range" min="0" max="400000" step="10000" value={pendingFilters.maxMileage} onChange={(event) => handleFilterChange({ maxMileage: Number(event.target.value) })} className="w-full" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.body", lang)}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allBodies.map((body) => (
                    <label
                      key={body}
                      className="inline-flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                      style={{
                        border: pendingFilters.bodies.includes(body) ? "1px solid var(--gold-dim)" : "1px solid var(--black-border)",
                        background: pendingFilters.bodies.includes(body) ? "rgba(212,175,55,0.08)" : "var(--black-card)",
                        color: pendingFilters.bodies.includes(body) ? "var(--gold)" : "var(--cream-muted)"
                      }}
                    >
                      <input type="checkbox" checked={pendingFilters.bodies.includes(body)} onChange={() => toggleBody(body)} className="hidden" />
                      {body}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.transmission", lang)}</label>
                <select value={pendingFilters.transmission} onChange={(event) => handleFilterChange({ transmission: event.target.value })} className="mt-1 w-full">
                  <option value="">{t("inv.allTrans", lang)}</option>
                  {allTransmissions.map((transmission) => (
                    <option key={transmission} value={transmission}>{transmission}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.fuel", lang)}</label>
                <select value={pendingFilters.fuel} onChange={(event) => handleFilterChange({ fuel: event.target.value })} className="mt-1 w-full">
                  <option value="">{t("inv.allFuel", lang)}</option>
                  {allFuels.map((fuel) => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>

              {allKinds.length > 1 && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">{t("inv.kind", lang)}</label>
                <select value={pendingFilters.kind} onChange={(event) => handleFilterChange({ kind: event.target.value })} className="mt-1 w-full">
                  <option value="">{t("inv.allKinds", lang)}</option>
                  {allKinds.map((kind) => (
                    <option key={kind} value={kind}>{kind}</option>
                  ))}
                </select>
              </div>
              )}
            </div>
          </div>

          {/* Sticky apply button at bottom */}
          <div className="border-t p-4" style={{ borderColor: "var(--black-border)", background: "var(--black-card)" }}>
            <button
              type="button"
              onClick={applyAndClose}
              className="btn-primary w-full"
              style={{ padding: '14px 20px', fontSize: '13px' }}
            >
              {t("inv.search", lang)} ({filteredCars.length})
            </button>
          </div>
        </aside>

        <section>
          <div className="card-panel mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between reveal-on-scroll reveal-on-scroll--delay">
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--cream)" }}>{t("inv.activeFilters", lang)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeFilterChips.length > 0 ? activeFilterChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.onRemove}
                    className="px-3 py-1.5 text-xs font-semibold transition"
                    style={{
                      border: "1px solid var(--gold-dim)",
                      background: "var(--black-card)",
                      color: "var(--gold)"
                    }}
                  >
                    {chip.label} ×
                  </button>
                )) : <span className="text-sm text-muted">{t("inv.noFilters", lang)}</span>}
              </div>
            </div>

            <label className="block text-sm font-medium" style={{ color: "var(--cream-muted)" }}>
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {t("inv.sorting", lang)}
              </span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="w-full sm:min-w-64">
                <option value="recommended">{t("inv.recommended", lang)}</option>
                <option value="price-asc">{t("inv.priceAsc", lang)}</option>
                <option value="price-desc">{t("inv.priceDesc", lang)}</option>
                <option value="year-desc">{t("inv.yearDesc", lang)}</option>
                <option value="mileage-asc">{t("inv.mileageAsc", lang)}</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : filteredCars.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCars.map((car) => (
                <VehicleCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="card-panel p-8 text-center">
              <h2 className="text-lg font-semibold" style={{ color: "var(--cream)" }}>{t("inv.noResults", lang)}</h2>
              <p className="mt-2 text-sm text-secondary">{t("inv.noResultsDesc", lang)}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
