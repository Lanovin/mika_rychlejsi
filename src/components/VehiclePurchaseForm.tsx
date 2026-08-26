"use client";

import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";
import { carCatalog } from "@/src/data/car-catalog";
import {
  equipmentGroups,
  equipmentLabelsCs,
  getEquipmentItem,
  quickEquipmentIds,
} from "@/src/data/vehicle-equipment";
import { compressImages } from "@/src/lib/image-compress";

const OTHER_VALUE = "__other__";
const MAX_PHOTOS = 20;
/**
 * Rozpočet na fotky po zmenšení. Serverless funkce přijme request do 4,5 MB,
 * zbytek necháváme na textová pole a hlavičky multipartu. Fotky se zmenšují
 * adaptivně, takže se do rozpočtu vejde plný počet snímků.
 */
const MAX_PHOTOS_TOTAL_BYTES = 3.6 * 1024 * 1024;

function EquipmentChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        fontSize: "13px",
        border: `1px solid ${selected ? "var(--gold-dim)" : "var(--black-border)"}`,
        background: selected ? "rgba(201,168,76,0.08)" : "var(--black-card)",
        color: selected ? "var(--gold)" : "var(--cream-muted)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        style={{ display: "none" }}
      />
      {label}
    </label>
  );
}

export function VehiclePurchaseForm() {
  const { lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [compressing, setCompressing] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    brand: "",
    brandOther: "",
    model: "",
    modelOther: "",
    body: "",
    fuel: "",
    color: "",
    colorOther: "",
    year: "",
    mileage: "",
    engineCC: "",
    powerKw: "",
    equipment: [] as string[],
    equipmentNote: "",
    photos: [] as File[],
    owners: "",
    origin: "",
    crashed: "",
    vatDeduction: "",
    transmission: "",
    vin: "",
    stkDay: "",
    stkMonth: "",
    stkYear: "",
    gdpr: false,
  });

  const set = (field: string, value: string | boolean | string[] | File[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setBrand = (value: string) =>
    setForm((prev) => ({ ...prev, brand: value, brandOther: "", model: "", modelOther: "" }));

  const selectedBrand = carCatalog.find((b) => b.brand === form.brand);
  const brandLabel = form.brand === OTHER_VALUE ? form.brandOther : form.brand;
  const modelLabel = form.brand === OTHER_VALUE || form.model === OTHER_VALUE
    ? form.modelOther
    : form.model;

  const toggleEquipment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter((e) => e !== id)
        : [...prev.equipment, id],
    }));
  };

  const photoKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

  // Prohlížeč při každém výběru nahradí obsah inputu, takže si soubory
  // držíme ve stavu a nové výběry přidáváme k předchozím.
  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // Reset umožní vybrat stejný soubor znovu poté, co ho uživatel odebral.
    event.target.value = "";
    if (!picked.length) return;

    const known = new Set(form.photos.map(photoKey));
    const added = picked.filter((file) => !known.has(photoKey(file)));
    const merged = [...form.photos, ...added];

    setError(merged.length > MAX_PHOTOS
      ? (lang === "cs"
        ? `Lze přiložit nejvýše ${MAX_PHOTOS} fotografií.`
        : `You can attach at most ${MAX_PHOTOS} photos.`)
      : "");
    set("photos", merged.slice(0, MAX_PHOTOS));
  };

  const removePhoto = (file: File) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((item) => photoKey(item) !== photoKey(file)),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    const colorLabel = form.color === "jina"
      ? (form.colorOther || t("color.jina", "cs"))
      : form.color
        ? t(`color.${form.color}`, "cs")
        : "";

    const lines = [
      `Značka: ${brandLabel}`,
      `Model: ${modelLabel}`,
      `Karoserie: ${form.body}`,
      `Palivo: ${form.fuel}`,
      colorLabel ? `Barva: ${colorLabel}` : "",
      `Rok: ${form.year}`,
      `Najeto km: ${form.mileage}`,
      `Objem ccm: ${form.engineCC}`,
      `Výkon kW: ${form.powerKw}`,
      form.owners ? `Počet majitelů: ${form.owners}` : "",
      form.origin ? `Původ vozu: ${form.origin}` : "",
      form.crashed ? `Havarováno: ${form.crashed}` : "",
      form.vatDeduction ? `Odpočet DPH: ${form.vatDeduction}` : "",
      form.transmission ? `Převodovka: ${form.transmission}` : "",
      `VIN: ${form.vin}`,
      form.stkDay || form.stkMonth || form.stkYear
        ? `STK do: ${form.stkDay}.${form.stkMonth}.${form.stkYear}`
        : "",
      form.equipment.length ? `Výbava: ${equipmentLabelsCs(form.equipment).join(", ")}` : "",
      form.equipmentNote ? `Poznámka k výbavě: ${form.equipmentNote}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const photos = form.photos.length
        ? await compressImages(form.photos, {
          totalBudgetBytes: MAX_PHOTOS_TOTAL_BYTES,
          onProgress: (done, total) => setCompressing({ done, total }),
        })
        : [];
      setCompressing(null);

      const totalBytes = photos.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_PHOTOS_TOTAL_BYTES) {
        throw new Error(lang === "cs"
          ? "Fotografie se nepodařilo dostatečně zmenšit. Odeberte prosím některé a zkuste to znovu."
          : "The photos could not be shrunk enough. Please remove some and try again.");
      }

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("phone", form.phone);
      payload.append("message", lines);
      payload.append("source", "vykup");
      photos.forEach((file) => payload.append("photos", file, file.name));

      const res = await fetch("/api/contact", {
        method: "POST",
        body: payload,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Odeslání se nezdařilo");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Odeslání se nezdařilo");
    } finally {
      setCompressing(null);
      setSending(false);
    }
  };

  const bodyOptions = [
    { value: "sedan", label: t("vykup.sedan", lang) },
    { value: "combi", label: t("vykup.combi", lang) },
    { value: "hatchback", label: t("vykup.hatchback", lang) },
    { value: "suv", label: t("vykup.suv", lang) },
    { value: "cabrio", label: t("vykup.cabrio", lang) },
    { value: "van", label: t("vykup.van", lang) },
    { value: "coupe", label: t("vykup.coupe", lang) },
    { value: "pickup", label: t("vykup.pickup", lang) },
  ];

  const fuelOptions = [
    { value: "benzin", label: t("fuel.benzin", lang) },
    { value: "nafta", label: t("fuel.nafta", lang) },
    { value: "hybrid", label: t("fuel.hybrid", lang) },
    { value: "hybrid_nafta", label: t("fuel.hybrid_nafta", lang) },
    { value: "plug_in_hybrid", label: t("fuel.plug_in_hybrid", lang) },
    { value: "lpg", label: t("fuel.lpg", lang) },
    { value: "cng", label: t("fuel.cng", lang) },
    { value: "elektro", label: t("fuel.elektro", lang) },
  ];

  const colorOptions = [
    { value: "bila", label: t("color.bila", lang), hex: "#F5F5F5" },
    { value: "cerna", label: t("color.cerna", lang), hex: "#0A0A0A" },
    { value: "stribrna", label: t("color.stribrna", lang), hex: "#C7C7CC" },
    { value: "seda", label: t("color.seda", lang), hex: "#6E6E73" },
    { value: "modra", label: t("color.modra", lang), hex: "#1D4ED8" },
    { value: "svetle_modra", label: t("color.svetle_modra", lang), hex: "#60A5FA" },
    { value: "cervena", label: t("color.cervena", lang), hex: "#DC2626" },
    { value: "vinova", label: t("color.vinova", lang), hex: "#7B1E2B" },
    { value: "zelena", label: t("color.zelena", lang), hex: "#15803D" },
    { value: "zluta", label: t("color.zluta", lang), hex: "#EAB308" },
    { value: "oranzova", label: t("color.oranzova", lang), hex: "#EA580C" },
    { value: "hneda", label: t("color.hneda", lang), hex: "#78350F" },
    { value: "bezova", label: t("color.bezova", lang), hex: "#D6C7A1" },
    { value: "zlata", label: t("color.zlata", lang), hex: "#C9A84C" },
    { value: "fialova", label: t("color.fialova", lang), hex: "#7C3AED" },
    { value: "ruzova", label: t("color.ruzova", lang), hex: "#EC4899" },
    { value: "jina", label: t("color.jina", lang), hex: null as string | null },
  ];

  const fieldRestBorderColor = "rgba(226, 201, 126, 0.38)";
  const fieldFocusBorderColor = "rgba(245, 230, 184, 0.92)";
  const fieldRestBackground = "linear-gradient(180deg, rgba(27, 27, 27, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)";
  const fieldFocusBackground = "linear-gradient(180deg, rgba(53, 41, 15, 0.98) 0%, rgba(27, 20, 8, 0.98) 100%)";

  const setFieldFocusState = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, focused: boolean) => {
    element.style.borderColor = focused ? fieldFocusBorderColor : fieldRestBorderColor;
    element.style.background = focused ? fieldFocusBackground : fieldRestBackground;
    element.style.boxShadow = focused
      ? "0 0 0 1px rgba(245, 230, 184, 0.18), 0 12px 24px rgba(0, 0, 0, 0.18)"
      : "inset 0 0 0 1px rgba(255, 255, 255, 0.03)";
  };

  const photoSummary = form.photos.length
    ? (lang === "cs"
      ? `Vybráno souborů: ${form.photos.length} z ${MAX_PHOTOS}`
      : `Selected files: ${form.photos.length} of ${MAX_PHOTOS}`)
    : (lang === "cs"
      ? `Nevybrali jste žádné soubory (můžete jich přiložit až ${MAX_PHOTOS})`
      : `No files selected (you can attach up to ${MAX_PHOTOS})`);

  // Ve sbaleném stavu ukazujeme jen nejčastější výbavu plus to, co už je vybrané,
  // aby uživatel po sbalení neztratil přehled o svém výběru.
  const collapsedEquipmentIds = [
    ...quickEquipmentIds,
    ...form.equipment.filter((id) => !quickEquipmentIds.includes(id)),
  ];
  const totalEquipmentCount = equipmentGroups.reduce((sum, group) => sum + group.items.length, 0);
  const hiddenEquipmentCount = totalEquipmentCount - collapsedEquipmentIds.length;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    background: fieldRestBackground,
    border: `1px solid ${fieldRestBorderColor}`,
    color: "var(--cream)",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
    transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
    outline: "none",
    appearance: "none",
  };

  const sectionStyle: React.CSSProperties = {
    padding: "18px",
    border: "1px solid rgba(201, 168, 76, 0.2)",
    background: "linear-gradient(180deg, rgba(201, 168, 76, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "var(--gold)",
    marginBottom: "6px",
  };

  if (submitted) {
    return (
      <div className="card-panel p-8 text-center">
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--white)",
          }}
        >
          {t("vykup.thankYou", lang)}
        </h3>
        <p className="mt-2 text-sm text-secondary">
          {t("vykup.thankYouDesc", lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="card-panel p-6 md:p-8">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--white)",
          marginBottom: "4px",
        }}
      >
        {t("vykup.title", lang)}
      </h2>
      <p className="text-sm text-secondary" style={{ marginBottom: "24px" }}>
        {t("vykup.subtitle", lang)}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
        {/* Contact info */}
        <div style={sectionStyle}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label style={labelStyle}>
              {t("vykup.name", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("vykup.email", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("vykup.phone", lang)}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          </div>
        </div>

        {/* Vehicle basic info */}
        <div style={sectionStyle}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label style={labelStyle}>
              {t("vykup.brand", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <select
              required
              value={form.brand}
              onChange={(e) => setBrand(e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            >
              <option value="">{t("vykup.selectBrand", lang)}</option>
              {carCatalog.map((b) => (
                <option key={b.brand} value={b.brand}>{b.brand}</option>
              ))}
              <option value={OTHER_VALUE}>{t("vykup.otherBrand", lang)}</option>
            </select>
          </div>
          {form.brand === OTHER_VALUE && (
            <div>
              <label style={labelStyle}>
                {t("vykup.enterBrand", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.brandOther}
                onChange={(e) => set("brandOther", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>
              {t("vykup.model", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            {form.brand === OTHER_VALUE ? (
              <input
                type="text"
                required
                placeholder={t("vykup.enterModel", lang)}
                value={form.modelOther}
                onChange={(e) => set("modelOther", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            ) : (
              <select
                required
                disabled={!selectedBrand}
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                style={{ ...inputStyle, opacity: selectedBrand ? 1 : 0.55 }}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              >
                <option value="">
                  {selectedBrand ? t("vykup.selectModel", lang) : t("vykup.selectBrand", lang)}
                </option>
                {selectedBrand?.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {selectedBrand && <option value={OTHER_VALUE}>{t("vykup.otherModel", lang)}</option>}
              </select>
            )}
          </div>
          {form.brand !== OTHER_VALUE && form.model === OTHER_VALUE && (
            <div>
              <label style={labelStyle}>
                {t("vykup.enterModel", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.modelOther}
                onChange={(e) => set("modelOther", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>
              {t("vykup.body", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <select
              required
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            >
              <option value="">{t("vykup.selectBody", lang)}</option>
              {bodyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              {t("vykup.fuel", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <select
              required
              value={form.fuel}
              onChange={(e) => set("fuel", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            >
              <option value="">{t("vykup.selectFuel", lang)}</option>
              {fuelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          </div>
        </div>

        {/* Color */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.color", lang)}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {colorOptions.map((opt) => {
              const selected = form.color === opt.value;
              return (
                <label
                  key={opt.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px 6px 8px",
                    fontSize: "13px",
                    border: `1px solid ${selected ? "var(--gold-dim)" : "var(--black-border)"}`,
                    background: selected ? "rgba(201,168,76,0.08)" : "var(--black-card)",
                    color: selected ? "var(--gold)" : "var(--cream-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="color"
                    value={opt.value}
                    checked={selected}
                    onChange={() => set("color", opt.value)}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: opt.hex ?? "conic-gradient(from 0deg, #DC2626, #EAB308, #15803D, #1D4ED8, #7C3AED, #DC2626)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)",
                      flexShrink: 0,
                    }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
          {form.color === "jina" && (
            <input
              type="text"
              placeholder={lang === "cs" ? "Upřesněte barvu" : "Specify colour"}
              value={form.colorOther}
              onChange={(e) => set("colorOther", e.target.value)}
              style={{ ...inputStyle, marginTop: "12px" }}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          )}
        </div>

        {/* Technical details */}
        <div style={sectionStyle}>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div>
            <label style={labelStyle}>
              {t("vykup.year", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="number"
              required
              min="1970"
              max="2026"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("vykup.mileage", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.mileage}
              onChange={(e) => set("mileage", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("vykup.engineCC", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.engineCC}
              onChange={(e) => set("engineCC", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {t("vykup.powerKw", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.powerKw}
              onChange={(e) => set("powerKw", e.target.value)}
              style={inputStyle}
              onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
              onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
            />
          </div>
          </div>
        </div>

        {/* Equipment */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px" }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>{t("vykup.equipment", lang)}</label>
            {form.equipment.length > 0 && (
              <span style={{ fontSize: "12px", color: "var(--cream-muted)" }}>
                {lang === "cs"
                  ? `vybráno: ${form.equipment.length}`
                  : `selected: ${form.equipment.length}`}
              </span>
            )}
          </div>

          {equipmentOpen ? (
            <div style={{ display: "grid", gap: "16px", marginTop: "12px" }}>
              {equipmentGroups.map((group) => (
                <div key={group.id}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--cream-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    {lang === "cs" ? group.cs : group.en}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {group.items.map((item) => (
                      <EquipmentChip
                        key={item.id}
                        label={lang === "cs" ? item.cs : item.en}
                        selected={form.equipment.includes(item.id)}
                        onToggle={() => toggleEquipment(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {collapsedEquipmentIds.map((id) => {
                const item = getEquipmentItem(id);
                if (!item) return null;
                return (
                  <EquipmentChip
                    key={item.id}
                    label={lang === "cs" ? item.cs : item.en}
                    selected={form.equipment.includes(item.id)}
                    onToggle={() => toggleEquipment(item.id)}
                  />
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setEquipmentOpen((open) => !open)}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              border: "1px dashed var(--gold-dim)",
              background: "transparent",
              color: "var(--gold)",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            {equipmentOpen
              ? (lang === "cs" ? "Sbalit výbavu" : "Collapse equipment")
              : (lang === "cs"
                ? `+ Přidat další výbavu (${hiddenEquipmentCount})`
                : `+ Add more equipment (${hiddenEquipmentCount})`)}
          </button>
        </div>

        {/* Equipment note */}
        <div style={{ ...sectionStyle, border: "1px solid rgba(201, 168, 76, 0.5)", background: "linear-gradient(180deg, rgba(201, 168, 76, 0.13) 0%, rgba(255, 255, 255, 0.03) 100%)" }}>
          <label style={{ ...labelStyle, fontSize: "12px", color: "var(--gold-light)" }}>
            {t("vykup.equipmentNote", lang)}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: "0", marginLeft: "6px", color: "var(--cream-muted)" }}>
              {lang === "cs" ? "(zde uveďte další prvky výbavy vašeho vozu)" : "(list any additional vehicle equipment here)"}
            </span>
          </label>
          <textarea
            rows={3}
            value={form.equipmentNote}
            onChange={(e) => set("equipmentNote", e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
            onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
          />
        </div>

        {/* Photos */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.photos", lang)}</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={addPhotos}
            style={{ display: "none" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: "8px" }}>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "auto", minWidth: "190px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.photos.length
                ? (lang === "cs" ? "Přidat další fotky" : "Add more photos")
                : (lang === "cs" ? "Vybrat soubory" : "Choose files")}
            </button>
            <span style={{ fontSize: "13px", color: form.photos.length ? "var(--cream)" : "var(--cream-muted)" }}>
              {photoSummary}
            </span>
          </div>
          {form.photos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {form.photos.map((file) => (
                <span
                  key={photoKey(file)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px 6px 10px",
                    fontSize: "12px",
                    color: "var(--cream)",
                    border: "1px solid rgba(201, 168, 76, 0.28)",
                    background: "rgba(201, 168, 76, 0.1)",
                  }}
                >
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removePhoto(file)}
                    aria-label={lang === "cs" ? `Odebrat ${file.name}` : `Remove ${file.name}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--gold)",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1,
                      padding: "0 2px",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle parameters */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.params", lang)}</label>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: "8px" }}>
            <div>
              <label style={{ ...labelStyle, fontSize: "10px", color: "var(--cream-muted)" }}>
                {t("vykup.owners", lang)}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.owners}
                onChange={(e) => set("owners", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: "10px", color: "var(--cream-muted)" }}>
                {t("vykup.origin", lang)}
              </label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
          </div>
        </div>

        {/* Crashed */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.crashed", lang)}</label>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {[{ value: t("vykup.yes", lang), label: t("vykup.yes", lang) }, { value: t("vykup.no", lang), label: t("vykup.no", lang) }].map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  border: `1px solid ${form.crashed === opt.value ? "var(--gold-dim)" : "var(--black-border)"}`,
                  background: form.crashed === opt.value ? "rgba(201,168,76,0.08)" : "var(--black-card)",
                  color: form.crashed === opt.value ? "var(--gold)" : "var(--cream-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="crashed"
                  value={opt.value}
                  checked={form.crashed === opt.value}
                  onChange={() => set("crashed", opt.value)}
                  style={{ display: "none" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* VAT deduction */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.vatDeduction", lang)}</label>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {[{ value: t("vykup.yes", lang), label: t("vykup.yes", lang) }, { value: t("vykup.no", lang), label: t("vykup.no", lang) }].map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  border: `1px solid ${form.vatDeduction === opt.value ? "var(--gold-dim)" : "var(--black-border)"}`,
                  background: form.vatDeduction === opt.value ? "rgba(201,168,76,0.08)" : "var(--black-card)",
                  color: form.vatDeduction === opt.value ? "var(--gold)" : "var(--cream-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="vatDeduction"
                  value={opt.value}
                  checked={form.vatDeduction === opt.value}
                  onChange={() => set("vatDeduction", opt.value)}
                  style={{ display: "none" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Transmission */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.transmission", lang)}</label>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {[{ value: t("vykup.automatic", lang), label: t("vykup.automatic", lang) }, { value: t("vykup.manual", lang), label: t("vykup.manual", lang) }].map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  border: `1px solid ${form.transmission === opt.value ? "var(--gold-dim)" : "var(--black-border)"}`,
                  background: form.transmission === opt.value ? "rgba(201,168,76,0.08)" : "var(--black-card)",
                  color: form.transmission === opt.value ? "var(--gold)" : "var(--cream-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="transmission"
                  value={opt.value}
                  checked={form.transmission === opt.value}
                  onChange={() => set("transmission", opt.value)}
                  style={{ display: "none" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* VIN */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            {t("vykup.vin", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
          </label>
          <input
            type="text"
            required
            value={form.vin}
            onChange={(e) => set("vin", e.target.value.toUpperCase())}
            placeholder={t("vykup.vinPlaceholder", lang)}
            style={inputStyle}
            onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
            onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
          />
        </div>

        {/* STK validity */}
        <div style={sectionStyle}>
          <label style={labelStyle}>{t("vykup.stkValid", lang)}</label>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, 1fr)", maxWidth: "360px" }}>
            <div>
              <label style={{ ...labelStyle, fontSize: "10px", color: "var(--cream-muted)" }}>
                {t("vykup.day", lang)}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.stkDay}
                onChange={(e) => set("stkDay", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: "10px", color: "var(--cream-muted)" }}>
                {t("vykup.month", lang)}
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={form.stkMonth}
                onChange={(e) => set("stkMonth", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: "10px", color: "var(--cream-muted)" }}>
                {t("vykup.yearField", lang)}
              </label>
              <input
                type="number"
                min="2024"
                max="2035"
                value={form.stkYear}
                onChange={(e) => set("stkYear", e.target.value)}
                style={inputStyle}
                onFocus={(e) => setFieldFocusState(e.currentTarget, true)}
                onBlur={(e) => setFieldFocusState(e.currentTarget, false)}
              />
            </div>
          </div>
        </div>

        {/* GDPR */}
        <div style={sectionStyle}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: "13px",
              color: "var(--cream-muted)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              required
              checked={form.gdpr}
              onChange={(e) => set("gdpr", e.target.checked)}
              style={{ marginTop: "3px", accentColor: "var(--gold)" }}
            />
            <span>
              {t("vykup.gdpr", lang)} <span style={{ color: "var(--gold-light)" }}>*</span>
            </span>
          </label>
        </div>

        {/* Submit */}
        {error && (
          <p style={{ color: "#ef4444", fontSize: "14px", margin: 0 }}>{error}</p>
        )}
        <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "8px" }} disabled={sending}>
          {compressing
            ? (lang === "cs"
              ? `Připravuji fotky… ${compressing.done}/${compressing.total}`
              : `Preparing photos… ${compressing.done}/${compressing.total}`)
            : sending
              ? (lang === "cs" ? "Odesílání…" : "Sending…")
              : t("vykup.send", lang)}
        </button>
      </form>
    </div>
  );
}
