import { readContent } from "@/src/lib/content-store";
import { HeaderClient } from "@/components/HeaderClient";

interface AlertContent {
  active?: boolean;
  text?: string;
  text_en?: string;
}

interface KontaktContent {
  phone: string;
  hours: { weekdays: string; saturday: string; sunday: string };
}

interface ServiceItem {
  title: string;
  shortDesc: string;
  longDesc: string;
}

interface SluzbyContent {
  services: ServiceItem[];
}

export async function Header() {
  const content = await readContent();
  const alert = content.alert as AlertContent | undefined;
  const kontaktCs = content.kontakt as KontaktContent | undefined;
  const kontaktEn = (content.kontakt_en ?? kontaktCs) as KontaktContent | undefined;
  const sluzbyCs = content.sluzby as SluzbyContent | undefined;
  const sluzbyEn = (content.sluzby_en ?? sluzbyCs) as SluzbyContent | undefined;
  const servicesCs = sluzbyCs?.services ?? [];
  const servicesEn = sluzbyEn?.services ?? [];

  return (
    <HeaderClient
      alert={alert}
      kontaktCs={kontaktCs}
      kontaktEn={kontaktEn}
      servicesCs={servicesCs}
      servicesEn={servicesEn}
    />
  );
}

