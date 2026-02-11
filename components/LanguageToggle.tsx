'use client';

import React from "react";
import { useLang } from "./LanguageProvider";

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-extrabold text-white/85 hover:bg-white/10"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label="Toggle language"
      title="Toggle language"
    >
      {lang === "en" ? "AR" : "EN"}
    </button>
  );
}
