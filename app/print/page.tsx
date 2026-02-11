'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function PrintPage() {
  const [proposal, setProposal] = useState("");
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    const p = localStorage.getItem("last_proposal") || "";
    const l = (localStorage.getItem("last_proposal_lang") as any) || "en";
    setProposal(p);
    setLang(l === "ar" ? "ar" : "en");
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="Logo" width={48} height={48} />
            <div>
              <div className="text-sm font-bold">Beam Of Technology</div>
              <div className="text-xs text-black/60">{lang === "ar" ? "عرض فني" : "Technical Proposal"}</div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white"
          >
            {lang === "ar" ? "طباعة / حفظ PDF" : "Print / Save PDF"}
          </button>
        </div>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {proposal || (lang === "ar" ? "لا يوجد محتوى." : "No content.")}
        </div>
      </div>
    </div>
  );
}
