"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, km } from "@/lib/km";

export type LanguageMode = "km" | "en";

export type TranslationText = typeof km | typeof en;

interface LanguageContextValue {
  language: LanguageMode;
  setLanguage: (language: LanguageMode) => void;
  text: TranslationText;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>("km");

  useEffect(() => {
    const stored = window.localStorage.getItem("somleng-language");
    if (stored === "km" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("somleng-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      text: language === "km" ? km : en,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
