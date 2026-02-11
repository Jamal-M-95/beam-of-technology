import { z } from "zod";
import type { Lang } from "./i18n";

export const LangSchema = z.union([z.literal("en"), z.literal("ar")]);

export const ChatSchema = z.object({
  lang: LangSchema,
  rfpText: z.string().default(""),
  messages: z
    .array(
      z.object({
        role: z.union([z.literal("user"), z.literal("assistant")]),
        content: z.string()
      })
    )
    .default([])
});

export const ProposalSchema = z.object({
  lang: LangSchema,
  rfpText: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.union([z.literal("user"), z.literal("assistant")]),
        content: z.string()
      })
    )
    .default([]),
  previousProposal: z.string().optional()
});

export const PdfSchema = z.object({
  lang: LangSchema,
  proposalMarkdown: z.string().min(1)
});

export type LangType = Lang;
