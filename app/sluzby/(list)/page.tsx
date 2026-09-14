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

type SluzbyContent = {
	header: { kicker: string; title: string; description: string };
	summaryCards: { kicker: string; title: string }[];
	services: { icon: string; title: string; shortDesc: string; longDesc: string }[];
};

const EMPTY_SLUZBY: SluzbyContent = {
	header: { kicker: "", title: "", description: "" },
	summaryCards: [],
	services: [],
};

// Obsah přichází z CMS, takže se nedá spoléhat na to, že je kompletní.
// Doplnění prázdných polí je levnější než bílá stránka.
function normalize(raw: unknown): SluzbyContent | null {
	if (!raw || typeof raw !== "object") return null;
	const value = raw as Partial<SluzbyContent>;
	return {
		header: value.header ?? EMPTY_SLUZBY.header,
		summaryCards: Array.isArray(value.summaryCards) ? value.summaryCards : [],
		services: Array.isArray(value.services) ? value.services : [],
	};
}

export default async function ServicesPage() {
	const content = await readContent();
	const cs = normalize(content.sluzby) ?? EMPTY_SLUZBY;
	const en = normalize(content.sluzby_en) ?? cs;

	return <ServicesPageClient cs={cs} en={en} />;
}
