// Katalog výbavy vozu pro formulář výkupu.
// Rozsah odpovídá běžným inzertním portálům (Sauto apod.).
// Ukládá se `id`, takže výběr přežije přepnutí jazyka a do e-mailu se vždy
// pošlou české názvy.

export interface EquipmentItem {
  id: string;
  cs: string;
  en: string;
}

export interface EquipmentGroup {
  id: string;
  cs: string;
  en: string;
  items: EquipmentItem[];
}

export const equipmentGroups: EquipmentGroup[] = [
  {
    id: "komfort",
    cs: "Komfort",
    en: "Comfort",
    items: [
      { id: "klimatizace", cs: "Klimatizace", en: "Air conditioning" },
      { id: "klimatizace_auto", cs: "Automatická klimatizace", en: "Automatic climate control" },
      { id: "klimatizace_2zonova", cs: "Dvouzónová klimatizace", en: "Dual-zone climate control" },
      { id: "klimatizace_3zonova", cs: "Tří- a vícezónová klimatizace", en: "Three-zone or more climate control" },
      { id: "tempomat", cs: "Tempomat", en: "Cruise control" },
      { id: "tempomat_adaptivni", cs: "Adaptivní tempomat", en: "Adaptive cruise control" },
      { id: "vyhrivana_sedadla", cs: "Vyhřívaná sedadla", en: "Heated seats" },
      { id: "ventilovana_sedadla", cs: "Ventilovaná sedadla", en: "Ventilated seats" },
      { id: "masazni_sedadla", cs: "Masážní sedadla", en: "Massage seats" },
      { id: "el_sedadla", cs: "Elektricky nastavitelná sedadla", en: "Electrically adjustable seats" },
      { id: "pamet_sedadel", cs: "Paměť sedadel", en: "Seat memory" },
      { id: "kozene_calouneni", cs: "Kožené čalounění", en: "Leather upholstery" },
      { id: "vyhrivany_volant", cs: "Vyhřívaný volant", en: "Heated steering wheel" },
      { id: "multifunkcni_volant", cs: "Multifunkční volant", en: "Multifunction steering wheel" },
      { id: "vyhrivane_celni_sklo", cs: "Vyhřívané čelní sklo", en: "Heated windscreen" },
      { id: "el_okna", cs: "Elektrické ovládání oken", en: "Electric windows" },
      { id: "el_zrcatka", cs: "Elektrické ovládání zrcátek", en: "Electric mirrors" },
      { id: "vyhrivana_zrcatka", cs: "Vyhřívaná zrcátka", en: "Heated mirrors" },
      { id: "sklopna_zrcatka", cs: "Sklopná zrcátka", en: "Folding mirrors" },
      { id: "bezklicove_odemykani", cs: "Bezklíčové odemykání a startování", en: "Keyless entry and start" },
      { id: "el_vika_kufru", cs: "Elektrické víko kufru", en: "Power tailgate" },
      { id: "nezavisle_topeni", cs: "Nezávislé topení", en: "Auxiliary heating" },
      { id: "deleny_zadni_sedak", cs: "Dělená zadní sedadla", en: "Split-folding rear seats" },
    ],
  },
  {
    id: "bezpecnost",
    cs: "Bezpečnost a asistenty",
    en: "Safety and assistance",
    items: [
      { id: "abs", cs: "ABS", en: "ABS" },
      { id: "asr", cs: "ASR (kontrola trakce)", en: "ASR (traction control)" },
      { id: "esp", cs: "ESP (stabilizace)", en: "ESP (stability control)" },
      { id: "airbag_ridice", cs: "Airbag řidiče", en: "Driver airbag" },
      { id: "airbag_spolujezdce", cs: "Airbag spolujezdce", en: "Passenger airbag" },
      { id: "bocni_airbagy", cs: "Boční airbagy", en: "Side airbags" },
      { id: "hlavove_airbagy", cs: "Hlavové airbagy", en: "Curtain airbags" },
      { id: "isofix", cs: "ISOFIX", en: "ISOFIX" },
      { id: "imobilizer", cs: "Imobilizér", en: "Immobiliser" },
      { id: "alarm", cs: "Alarm", en: "Alarm" },
      { id: "centralni_zamykani", cs: "Centrální zamykání", en: "Central locking" },
      { id: "nouzove_brzdeni", cs: "Asistent nouzového brzdění", en: "Emergency braking assist" },
      { id: "hlidani_pruhu", cs: "Asistent jízdy v pruzích", en: "Lane keeping assist" },
      { id: "mrtvy_uhel", cs: "Hlídání mrtvého úhlu", en: "Blind spot monitoring" },
      { id: "rozjezd_do_kopce", cs: "Asistent rozjezdu do kopce", en: "Hill start assist" },
      { id: "cteni_znacek", cs: "Rozpoznávání dopravních značek", en: "Traffic sign recognition" },
      { id: "hlidani_unavy", cs: "Hlídání únavy řidiče", en: "Driver fatigue detection" },
      { id: "tlak_v_pneu", cs: "Kontrola tlaku v pneumatikách", en: "Tyre pressure monitoring" },
    ],
  },
  {
    id: "parkovani",
    cs: "Parkování",
    en: "Parking",
    items: [
      { id: "parkovaci_senzory_vzadu", cs: "Parkovací senzory vzadu", en: "Rear parking sensors" },
      { id: "parkovaci_senzory_vpredu", cs: "Parkovací senzory vpředu", en: "Front parking sensors" },
      { id: "couvaci_kamera", cs: "Couvací kamera", en: "Rear view camera" },
      { id: "kamera_360", cs: "Kamera 360°", en: "360° camera" },
      { id: "parkovaci_asistent", cs: "Parkovací asistent", en: "Parking assistant" },
    ],
  },
  {
    id: "svetla",
    cs: "Světla",
    en: "Lights",
    items: [
      { id: "xenony", cs: "Xenonové světlomety", en: "Xenon headlights" },
      { id: "led_svetla", cs: "LED světlomety", en: "LED headlights" },
      { id: "matrix_led", cs: "Matrix / laserové světlomety", en: "Matrix / laser headlights" },
      { id: "mlhovky", cs: "Mlhové světlomety", en: "Fog lights" },
      { id: "denni_sviceni", cs: "Denní svícení", en: "Daytime running lights" },
      { id: "automaticke_svetlomety", cs: "Automatické světlomety", en: "Automatic headlights" },
      { id: "adaptivni_svetlomety", cs: "Adaptivní světlomety", en: "Adaptive headlights" },
      { id: "ostrikovace_svetlometu", cs: "Ostřikovače světlometů", en: "Headlight washers" },
    ],
  },
  {
    id: "multimedia",
    cs: "Multimédia",
    en: "Multimedia",
    items: [
      { id: "navigace", cs: "Navigace", en: "Navigation" },
      { id: "bluetooth", cs: "Bluetooth", en: "Bluetooth" },
      { id: "handsfree", cs: "Handsfree", en: "Hands-free" },
      { id: "usb", cs: "USB / AUX vstup", en: "USB / AUX input" },
      { id: "apple_carplay", cs: "Apple CarPlay", en: "Apple CarPlay" },
      { id: "android_auto", cs: "Android Auto", en: "Android Auto" },
      { id: "dab_radio", cs: "DAB rádio", en: "DAB radio" },
      { id: "cd_prehravac", cs: "CD přehrávač", en: "CD player" },
      { id: "premiovy_zvuk", cs: "Prémiový zvukový systém", en: "Premium sound system" },
      { id: "digitalni_stit", cs: "Digitální přístrojový štít", en: "Digital instrument cluster" },
      { id: "head_up", cs: "Head-up displej", en: "Head-up display" },
      { id: "dotykovy_displej", cs: "Dotykový displej", en: "Touchscreen" },
    ],
  },
  {
    id: "exterier",
    cs: "Exteriér a podvozek",
    en: "Exterior and chassis",
    items: [
      { id: "stresni_okno", cs: "Střešní okno", en: "Sunroof" },
      { id: "panoramaticka_strecha", cs: "Panoramatická střecha", en: "Panoramic roof" },
      { id: "stresni_nosic", cs: "Střešní nosič", en: "Roof rails" },
      { id: "tazne_zarizeni", cs: "Tažné zařízení", en: "Tow bar" },
      { id: "lita_kola", cs: "Litá kola", en: "Alloy wheels" },
      { id: "metaliza", cs: "Metalíza", en: "Metallic paint" },
      { id: "tonovana_skla", cs: "Tónovaná skla", en: "Tinted windows" },
      { id: "pohon_4x4", cs: "Pohon 4x4", en: "All-wheel drive" },
      { id: "adaptivni_podvozek", cs: "Adaptivní podvozek", en: "Adaptive suspension" },
      { id: "vzduchovy_podvozek", cs: "Vzduchový podvozek", en: "Air suspension" },
      { id: "start_stop", cs: "Systém start-stop", en: "Start-stop system" },
    ],
  },
  {
    id: "stav",
    cs: "Stav a doklady",
    en: "Condition and documents",
    items: [
      { id: "servisni_kniha", cs: "Servisní kniha", en: "Service book" },
      { id: "prvni_majitel", cs: "První majitel", en: "First owner" },
      { id: "koupeno_v_cr", cs: "Koupeno v ČR", en: "Bought in Czechia" },
      { id: "garazovano", cs: "Garážováno", en: "Garage kept" },
      { id: "nekuracke", cs: "Nekuřácké", en: "Non-smoking" },
      { id: "zimni_pneu", cs: "Zimní pneumatiky", en: "Winter tyres" },
      { id: "letni_pneu", cs: "Letní pneumatiky", en: "Summer tyres" },
      { id: "sada_zimnich_kol", cs: "Sada zimních kol navíc", en: "Extra set of winter wheels" },
      { id: "rezerva", cs: "Rezervní kolo", en: "Spare wheel" },
      { id: "dve_sady_klicu", cs: "Dvě sady klíčů", en: "Two sets of keys" },
    ],
  },
];

/** Nejčastější položky – zobrazují se v prvním (nesbaleném) řádku. */
export const quickEquipmentIds = [
  "klimatizace",
  "klimatizace_auto",
  "navigace",
  "tempomat",
  "vyhrivana_sedadla",
  "parkovaci_senzory_vzadu",
  "couvaci_kamera",
  "tazne_zarizeni",
];

const itemsById = new Map<string, EquipmentItem>(
  equipmentGroups.flatMap((group) => group.items.map((item) => [item.id, item] as const))
);

export const allEquipmentItems: EquipmentItem[] = [...itemsById.values()];

export function getEquipmentItem(id: string) {
  return itemsById.get(id);
}

/** České názvy vybrané výbavy – pro e-mail obchodníkovi. */
export function equipmentLabelsCs(ids: string[]) {
  return ids.map((id) => itemsById.get(id)?.cs ?? id);
}
