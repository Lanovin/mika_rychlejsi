import type { MetadataRoute } from "next";
import { readPublishedVehicles } from "@/src/lib/vehicle-store";
import { readContent } from "@/src/lib/content-store";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mikaauto.cz";

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/vozy`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/sluzby`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/kontakt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/o-nas`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Vehicle pages
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const vehicles = await readPublishedVehicles();
    vehiclePages = vehicles.map((v) => ({
      url: `${siteUrl}/vozy/${v.id}`,
      lastModified: new Date(v.updatedAt || v.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch { /* ignore */ }

  // Service pages
  let servicePages: MetadataRoute.Sitemap = [];
  try {
    const content = await readContent();
    const sluzby = content.sluzby as { services?: { title: string }[] } | undefined;
    if (sluzby?.services) {
      servicePages = sluzby.services.map((s) => ({
        url: `${siteUrl}/sluzby/${slugify(s.title)}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch { /* ignore */ }

  return [...staticPages, ...vehiclePages, ...servicePages];
}
