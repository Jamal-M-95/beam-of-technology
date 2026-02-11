import Groq from "groq-sdk";

export function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey });
}

export function getModel() {
  return process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
}

/**
 * Optional OpenAI (commented) - if you want to switch later:
 *
 * 1) npm i openai
 * 2) set OPENAI_API_KEY in .env.local
 * 3) uncomment the code below and update routes to call OpenAI instead of Groq
 *
 * // import OpenAI from "openai";
 * // export function getOpenAI() {
 * //   const key = process.env.OPENAI_API_KEY;
 * //   if (!key) throw new Error("Missing OPENAI_API_KEY");
 * //   return new OpenAI({ apiKey: key });
 * // }
 */
