'use client';

import { useLang } from "@/components/LanguageProvider";
import GetStartedClient from "./start-client";

export default function GetStartedPage() {
  const { lang } = useLang();
  return (
    <div className="space-y-8">
      <section className="glass rounded-3xl p-8 md:p-12">
        <h1 className="text-3xl font-black md:text-5xl">
          {lang === "ar" ? "ابدأ الآن" : "Get Started"}
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-white/70 md:text-base">
          {lang === "ar"
            ? "ارفع ملف RFP أو الصق نصّه، ثم دردش مع المساعد، وبعدها أنشئ عرضًا فنيًا كاملًا مع مصفوفة توافق وخطة تنفيذ."
            : "Upload your RFP (or paste it), chat with the assistant, then generate a complete technical proposal with a compliance matrix and implementation plan."}
        </p>
      </section>

      <GetStartedClient />
    </div>
  );
}
