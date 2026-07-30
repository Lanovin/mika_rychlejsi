"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Lang = "cs" | "en";

const STORAGE_KEY = "mika-lang";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "cs",
  toggleLang: () => {},
});

function readStoredLang(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "cs" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server vždy vykreslí češtinu, uloženou volbu proto načítáme až po
  // hydrataci – jinak by se rozešel serverový a klientský HTML.
  const [lang, setLang] = useState<Lang>("cs");

  useEffect(() => {
    const stored = readStoredLang();
    if (stored) {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Zablokované úložiště (privátní režim) – jazyk vydrží aspoň do reloadu.
    }
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "cs" ? "en" : "cs"));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
