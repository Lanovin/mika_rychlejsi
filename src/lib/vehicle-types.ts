export const FUEL_OPTIONS = ["benzín", "nafta", "hybrid", "elektro", "LPG", "CNG"] as const;
export const TRANSMISSION_OPTIONS = ["manuální", "automatická"] as const;

export type FuelType = (typeof FUEL_OPTIONS)[number];
export type Transmission = (typeof TRANSMISSION_OPTIONS)[number];

export interface Vehicle {
  id: string;
  tipcarsId: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceWithVat?: number;
  priceWithoutVat?: number;
  vatDeduction?: boolean;
  mileage: number;
  fuel: FuelType;
  transmission: Transmission;
  body: string;
  powerKw: number;
  engineVolume: number;
  kind: string;
  color: string;
  vin: string;
  stk: string;
  condition: string;
  location: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  equipment: string[];
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleLabels {
  [tipcarsId: string]: {
    featured: boolean;
    published: boolean;
  };
}

/**
 * Ořezaný vůz pro výpisy (karty, slider, filtry).
 *
 * Props serverových komponent putují do prohlížeče dvakrát – jednou v HTML,
 * podruhé v RSC payloadu. Když se do výpisu poslal celý `Vehicle`, jel s ním
 * i popis, výbava a hlavně `gallery` (u 71 vozů přes 2 000 adres fotek).
 * Homepage tak měla přes 440 kB a nabídka vozů přes 670 kB HTML – na mobilu
 * se stránka dlouho tvářila jako prázdná a při přerušeném stahování
 * nedoběhla hydratace vůbec. Výpis potřebuje jen pole níže.
 */
export interface VehicleListItem {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceWithoutVat?: number;
  vatDeduction?: boolean;
  mileage: number;
  fuel: FuelType;
  transmission: Transmission;
  body: string;
  powerKw: number;
  kind: string;
  imageUrl: string;
  featured: boolean;
}

export function toVehicleListItem(vehicle: Vehicle): VehicleListItem {
  return {
    id: vehicle.id,
    title: vehicle.title,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    priceWithoutVat: vehicle.priceWithoutVat,
    vatDeduction: vehicle.vatDeduction,
    mileage: vehicle.mileage,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    body: vehicle.body,
    powerKw: vehicle.powerKw,
    kind: vehicle.kind,
    imageUrl: vehicle.imageUrl,
    featured: vehicle.featured,
  };
}
