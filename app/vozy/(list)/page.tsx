import type { Metadata } from "next";
import { InventoryPageClient } from "@/src/components/InventoryPageClient";
import { readPublishedVehicles } from "@/src/lib/vehicle-store";
import { readContent } from "@/src/lib/content-store";
import { toVehicleListItem } from "@/src/lib/vehicle-types";

interface InventoryPageContent {
  kicker?: string;
  title?: string;
  subtitle?: string;
}

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nabídka vozů – Ojeté vozy na prodej",
  description: "Prohlédněte si aktuální nabídku prověřených ojetých vozů v autobazaru Mika Auto. Filtrujte podle značky, modelu, ceny a dalších parametrů.",
  alternates: { canonical: "/vozy" },
  openGraph: {
    title: "Nabídka vozů | Mika Auto",
    description: "Aktuální nabídka prověřených ojetých vozů autobazaru Mika Auto Brno.",
  },
};

export default async function InventoryPage() {
  const [vehicles, content] = await Promise.all([readPublishedVehicles(), readContent()]);
  const cs = content.inventory as InventoryPageContent | undefined;
  const en = (content.inventory_en ?? cs) as InventoryPageContent | undefined;

  return (
    <InventoryPageClient
      vehicles={vehicles.map(toVehicleListItem)}
      cs={cs}
      en={en}
    />
  );
}
