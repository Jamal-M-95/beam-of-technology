'use client';

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Database, Globe, Lock, Zap, Network } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";


export default function Features() {
  const { lang } = useLang();

  const features = [
    {
      icon: BrainCircuit,
      title: lang === "ar" ? "الخدمات التقنية المُدارة" : "Managed IT Services",
      description:
        lang === "ar"
          ? "مراقبة ودعم واستجابة للحوادث على مدار الساعة للحفاظ على استمرارية التشغيل."
          : "24/7 monitoring, incident response, patching, and SLA-driven support to keep operations running smoothly.",
    },
    {
      icon: Database,
      title: lang === "ar" ? "تبنّي السحابة" : "Cloud Adoption",
      description:
        lang === "ar"
          ? "استراتيجية سحابية وهجرة وتحسين ببنية آمنة وتصميم فعّال من حيث التكلفة."
          : "Cloud strategy, migration, and optimization with secure foundations and cost-efficient design.",
    },
    {
      icon: Globe,
      title: lang === "ar" ? "أتمتة DevOps" : "DevOps Automation",
      description:
        lang === "ar"
          ? "خطوط CI/CD وبنية تحتية ككود ونشر مؤتمت لتسليم أسرع بثقة."
          : "CI/CD pipelines, Infrastructure as Code, and automated deployments to ship faster with confidence.",
    },
    {
      icon: Lock,
      title: lang === "ar" ? "الأمان والامتثال" : "Security & Compliance",
      description:
        lang === "ar"
          ? "تقوية الأنظمة والتحكم بالوصول وسياسات عملية لتقليل المخاطر وتلبية متطلبات الامتثال."
          : "Hardening, access control, and best-practice policies to reduce risk and meet compliance needs.",
    },
    {
      icon: Zap,
      title: lang === "ar" ? "الأداء والرصد" : "Performance & Observability",
      description:
        lang === "ar"
          ? "مراقبة شاملة وتحسين مستمر لرفع الاعتمادية والوضوح وتجربة المستخدم."
          : "End-to-end monitoring and tuning to improve reliability, visibility, and user experience.",
    },
    {
      icon: Network,
      title: lang === "ar" ? "تطوير الويب" : "Web Development",
      description:
        lang === "ar"
          ? "مواقع ومنصات حديثة ومتجاوبة مبنية للسرعة وقابلية التوسع والنمو الطويل."
          : "Modern, responsive websites and portals built for speed, scalability, and long-term growth.",
    },
  ];

  return (
    <section id="technology" className="py-24 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold mb-6"
          >
            {lang === "ar" ? "القدرات " : "Core "}
            <span className="text-primary">{lang === "ar" ? "الأساسية" : "Capabilities"}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            {lang === "ar"
              ? "تجمع BEAM.Of Technology بين الهندسة القوية والتنفيذ العملي."
              : "BEAM.Of Technology combines strong engineering with practical execution."}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-secondary/20 blur-[60px] rounded-full" />
            <img 
              src="/beam-design/ai-feature.png" 
              alt="AI Neural Node" 
              className="relative z-10 w-full rounded-2xl border border-white/10 shadow-2xl glass-panel hover:scale-[1.02] transition-transform duration-500" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-3xl font-display font-bold mb-6 text-white">
              {lang === "ar" ? "قدرات تشغيل ذكية" : "Autonomous Intelligence"}
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {lang === "ar"
                ? "تتجاوز Beam.Of Technology مجرد بناء البرمجيات؛ نحن نبني أساسات رقمية يمكن الاعتماد عليها. من تبنّي السحابة وأتمتة DevOps إلى الخدمات التقنية المُدارة ومنصات الويب الحديثة، نصمم حلولاً آمنة وقابلة للتوسع ومهيأة للتشغيل الواقعي."
                : "Beam.Of Technology goes beyond building software. We engineer dependable digital foundations. From cloud adoption and DevOps automation to managed IT services and modern web platforms, we design solutions that are secure, scalable, and built for real-world operations."}
            </p>
            <ul className="space-y-4">
  {[
    lang === "ar" ? 'خدمات تقنية مُدارة ومراقبة 24/7' : 'IT Managed Services & 24/7 Monitoring',
    lang === "ar" ? 'استراتيجية سحابية وهجرة وتحسين' : 'Cloud Strategy, Migration & Optimization',
    lang === "ar" ? 'أتمتة DevOps و CI/CD' : 'DevOps & CI/CD Automation',
    lang === "ar" ? 'البنية التحتية ككود (IaC)' : 'Infrastructure as Code (IaC)',
    lang === "ar" ? 'تحديث التطبيقات' : 'Application Modernization',
    lang === "ar" ? 'تطوير الويب والبوابات' : 'Web & Portal Development',
    lang === "ar" ? 'أفضل ممارسات الأمان والامتثال' : 'Security & Compliance Best Practices',
    lang === "ar" ? 'مراقبة الأداء والرصد' : 'Performance Monitoring & Observability',
    lang === "ar" ? 'استشارات معمارية وتقنية' : 'Architecture & Technology Consulting',
    lang === "ar" ? 'الدعم والصيانة والتحسين المستمر' : 'Support, Maintenance & Continuous Improvement',
  ].map((item) => (
    <li key={item} className="flex items-center gap-3 text-gray-300">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
      {item}
    </li>
  ))}
</ul>

          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-panel border-white/5 hover:border-primary/50 transition-all duration-300 group h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="text-xl font-display font-bold mb-3 text-white group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
