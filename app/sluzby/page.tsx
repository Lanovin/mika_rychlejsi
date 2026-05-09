import type { Metadata } from "next";
import { readContent } from "@/src/lib/content-store";
import { ServicesPageClient } from "@/src/components/ServicesPageClient";

export const metadata: Metadata = {
	title: "Služby – Mika Auto",
	description: "Financování, pojištění, výkup, protiúčet i převody vozidel. Přehled služeb autobazaru Mika Auto na jednom místě.",
	alternates: { canonical: "/sluzby" },
	openGraph: {
		title: "Služby | Mika Auto",
		description: "Přehled služeb Mika Auto: financování, pojištění, výkup, protiúčet a další pomoc kolem vozu.",
	},
};

export default async function ServicesPage() {
	const content = await readContent();
	const cs = content.sluzby as {
		header: { kicker: string; title: string; description: string };
		summaryCards: { kicker: string; title: string }[];
		services: { icon: string; title: string; shortDesc: string; longDesc: string }[];
	};
	const en = (content.sluzby_en ?? cs) as typeof cs;

	return <ServicesPageClient cs={cs} en={en} />;
}
