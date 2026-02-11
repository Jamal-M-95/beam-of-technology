import type { Lang } from "./i18n";

export function systemPrompt(lang: Lang) {
  return lang === "ar"
    ? `أنت مساعد محترف لكتابة العروض الفنية (Technical Proposals) بناءً على مستند RFP/SOW. 
- اكتب بشكل رسمي ومناسب للجهات الحكومية/الشركات.
- استخدم عناوين واضحة، نقاط، وجداول عند الحاجة.
- انتبه للتوافق (Compliance) واذكر الافتراضات والمخاطر وخطة التنفيذ والدعم.
- لا تخترع معلومات غير موجودة؛ إذا كانت معلومة ناقصة ضعها ضمن "Assumptions / Clarifications".`
    : `You are a professional assistant for writing technical proposals based on RFP/SOW documents.
- Write in a formal, enterprise/government-friendly style.
- Use clear headings, bullets, and tables when useful.
- Focus on compliance, assumptions, risks, implementation plan, testing, and support.
- Do not invent missing information; list it under "Assumptions / Clarifications".`;
}

export function chatPrompt(lang: Lang, rfpText: string) {
  return lang === "ar"
    ? `هذا نص RFP/SOW (قد يكون مختصرًا):

${rfpText}

أجب على أسئلة المستخدم بالاعتماد على النص أعلاه.`
    : `Here is the RFP/SOW text (may be partial):

${rfpText}

Answer the user's questions based on the text above.`;
}

export function proposalPrompt(opts: { lang: Lang; rfpText: string; previousProposal?: string }) {
  const { lang, rfpText, previousProposal } = opts;

  const baseStructureEn = `Generate a COMPLETE technical proposal in Markdown with the following sections:
1) Executive Summary
2) Understanding of Requirements
3) Proposed Technical Approach
4) Target Architecture (OpenShift / VMware / BareMetal) + integration & interoperability
5) Detailed Bill of Materials (BOM) – servers, storage, network, licenses (use vendor options where applicable)
6) Implementation Plan (12 months): phases, milestones, dependencies
7) Testing & Commissioning Plan
8) Documentation & Handover
9) Support & Warranty (24x7, 3 years)
10) Compliance Matrix (table): Requirement | Response | Compliance (Y/N/Partial) | Notes
11) Assumptions / Clarifications
12) Risks & Mitigations
13) Appendices (if needed)

Use the RFP text as the main source. If any detail is missing, keep it as a clear assumption and ask for clarification in the assumptions section.
Keep it professional and deliverable-ready.`;

  const baseStructureAr = `أنشئ عرضًا فنيًا كاملاً بصيغة Markdown ويتضمن الأقسام التالية:
1) الملخص التنفيذي
2) فهم المتطلبات
3) النهج الفني المقترح
4) المعمارية المستهدفة (OpenShift / VMware / BareMetal) + التكامل والتوافق بين البيئات
5) قائمة المواد التفصيلية (BOM): خوادم، تخزين، شبكة، رخص (مع خيارات الموردين عند الحاجة)
6) خطة التنفيذ (12 شهرًا): مراحل، معالم، اعتمادات
7) خطة الاختبار والتشغيل التجريبي والتسليم
8) التوثيق والتسليم (Handover)
9) الدعم والضمان (24×7 لمدة 3 سنوات)
10) مصفوفة التوافق (جدول): المتطلب | الاستجابة | التوافق (نعم/لا/جزئي) | ملاحظات
11) الافتراضات / نقاط الاستيضاح
12) المخاطر وخطط المعالجة
13) ملاحق (عند الحاجة)

اعتمد على نص RFP كمصدر رئيسي. إذا كانت تفاصيل ناقصة، ضعها كافتراض واضح واطلب توضيحًا ضمن قسم الافتراضات.
اكتب بشكل احترافي وجاهز للتسليم.`;

  const refinement = previousProposal
    ? (lang === "ar"
        ? `

مهم: يوجد عرض سابق. أعد الإنشاء بالاعتماد على العرض السابق أدناه، وحسّن الصياغة، واملأ أي فجوات، وحافظ على نفس الفكرة العامة، وأضاف قيمة/تفاصيل مفيدة دون اختراع.

---
العرض السابق:
${previousProposal}
---
`
        : `

Important: A previous proposal exists. Regenerate based on it, improve wording, fill gaps, keep the same overall idea, and add useful details without hallucinating.

---
Previous Proposal:
${previousProposal}
---
`)
    : "";

  const rfpBlock = lang === "ar"
    ? `

نص RFP/SOW:
${rfpText}
`
    : `

RFP/SOW Text:
${rfpText}
`;

  return (lang === "ar" ? baseStructureAr : baseStructureEn) + refinement + rfpBlock;
}
