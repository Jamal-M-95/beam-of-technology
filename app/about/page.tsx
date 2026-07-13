'use client';

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";

export default function AboutPage() {
  const { lang } = useLang();

  return (
    <section className="pt-32 pb-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8">
            {lang === "ar" ? "من " : "About "}
            <span className="text-primary">{lang === "ar" ? "نحن" : "Us"}</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            {lang === "ar"
              ? "نبني جسراً عملياً بين التفكير الاستراتيجي والتنفيذ الرقمي عبر حلول تقنية حديثة وموثوقة."
              : "We design practical digital foundations that bridge strategic thinking with reliable technical execution."}
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left mt-16">
            <div className="glass-panel p-8 rounded-2xl border-white/10">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">{lang === "ar" ? "رسالتنا" : "Our Mission"}</h3>
              <p className="text-gray-400">
                {lang === "ar"
                  ? "تمكين الأعمال بحلول تقنية وذكاء اصطناعي عملية ترفع الجودة وتسرّع التنفيذ."
                  : "To empower organizations with practical technology and AI solutions that improve quality and accelerate delivery."}
              </p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border-white/10">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">{lang === "ar" ? "رؤيتنا" : "Our Vision"}</h3>
              <p className="text-gray-400">
                {lang === "ar"
                  ? "أن تكون التقنية عاملاً واضحاً للنمو والاستقرار والتوسع المستدام لدى عملائنا."
                  : "A future where technology becomes a clear driver of growth, resilience, and sustainable scale."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
