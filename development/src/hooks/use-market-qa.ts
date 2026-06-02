import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

const MARKET_QA_MARKER = "### Market Info (Q&A)";

export const MIN_MARKET_QUESTIONS = 3;
export const MAX_MARKET_QUESTIONS = 5;

/** Description used for question generation (excludes saved Q&A answers). */
export function marketQABaseDescription(description: string): string {
  const idx = description.indexOf(MARKET_QA_MARKER);
  return (idx >= 0 ? description.slice(0, idx) : description).trim();
}

export interface MarketQAEntry {
  question: string;
  answer: string;
}

/** Parse Q&A block appended during the Market Info wizard step. */
/** Serialize Market Info Q&A answers into the description appendix block. */
export function formatMarketQASupplement(entries: MarketQAEntry[]): string {
  if (entries.length === 0) return "";
  const lines = ["", MARKET_QA_MARKER, ""];
  for (const { question, answer } of entries) {
    if (!question.trim() || !answer.trim()) continue;
    lines.push(`- Q: ${question}`);
    lines.push(`  A: ${answer.trim()}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

/** Combine base description with optional Market Info Q&A block. */
export function buildProjectDescription(
  baseDescription: string,
  qaEntries: MarketQAEntry[]
): string {
  const base = baseDescription.trim();
  const supplement = formatMarketQASupplement(qaEntries);
  if (!supplement) return base;
  return base ? `${base}\n${supplement}\n` : `${supplement}\n`;
}

export function parseMarketQAFromDescription(description: string): MarketQAEntry[] {
  const idx = description.indexOf(MARKET_QA_MARKER);
  if (idx < 0) return [];

  const section = description.slice(idx + MARKET_QA_MARKER.length).trim();
  if (!section) return [];

  const entries: MarketQAEntry[] = [];
  for (const part of section.split(/\n- Q:\s*/)) {
    if (!part.trim()) continue;
    const answerMatch = part.match(/\n\s*A:\s*/);
    if (!answerMatch || answerMatch.index === undefined) continue;
    const question = part.slice(0, answerMatch.index).trim();
    const answer = part.slice(answerMatch.index + answerMatch[0].length).trim();
    if (question && answer) entries.push({ question, answer });
  }
  return entries;
}

export function computeMarketQATargetCount(description: string): number {
  const d = description.trim();
  if (!d) return MAX_MARKET_QUESTIONS;
  const lengthScore =
    d.length >= 280 ? 3 : d.length >= 180 ? 4 : d.length >= 100 ? 5 : 5;
  const hasNumbers = /\d/.test(d);
  const hasSegments = /(b2b|b2c|enterprise|consumer|smb|startup|developer|students)/i.test(d);
  const hasGeo =
    /(china|us|usa|europe|apac|australia|singapore|hong kong|beijing|shanghai|shenzhen)/i.test(
      d
    );
  const specificityBoost = (hasNumbers ? 1 : 0) + (hasSegments ? 1 : 0) + (hasGeo ? 1 : 0);
  return Math.max(
    MIN_MARKET_QUESTIONS,
    Math.min(MAX_MARKET_QUESTIONS, lengthScore - Math.floor(specificityBoost / 2))
  );
}

export interface MarketQAQuestion {
  id: string;
  question: string;
  askFor?: string[];
  why?: string | null;
  exampleAnswer?: string | null;
}

interface MarketQAOneResponse {
  question: MarketQAQuestion;
  index: number;
  targetCount: number;
}

function sessionKey(baseDescription: string, productType: string) {
  return `${baseDescription}|||${productType.trim()}`;
}

/**
 * Generate Market Info questions one-by-one in the background.
 * First question appears as soon as it is ready; later questions load while the user answers.
 */
export function useIncrementalMarketQA(
  description: string,
  productType: string,
  enabled: boolean
) {
  const baseDesc = marketQABaseDescription(description);
  const [questions, setQuestions] = useState<MarketQAQuestion[]>([]);
  const [targetCount, setTargetCount] = useState(MIN_MARKET_QUESTIONS);
  const [isGenerating, setIsGenerating] = useState(false);

  const sessionRef = useRef("");
  const runIdRef = useRef(0);

  const startGeneration = useCallback(
    (desc: string, pt: string) => {
      const base = marketQABaseDescription(desc);
      if (!base.trim()) return;

      const session = sessionKey(base, pt);
      if (session === sessionRef.current) return;

      const target = computeMarketQATargetCount(base);
      const runId = ++runIdRef.current;

      sessionRef.current = session;
      setTargetCount(target);
      setQuestions([]);
      setIsGenerating(true);

      const generateFromIndex = async (index: number, accumulated: MarketQAQuestion[]) => {
        if (runIdRef.current !== runId || sessionRef.current !== session) return;

        try {
          const res = await apiRequest<MarketQAOneResponse>(
            "POST",
            "/api/market-qa/questions/one",
            {
              description: base,
              productType: pt.trim(),
              index,
              targetCount: target,
              existingQuestions: accumulated.map((q) => ({
                id: q.id,
                question: q.question,
              })),
            }
          );

          if (runIdRef.current !== runId || sessionRef.current !== session) return;

          const next = [...accumulated, res.question];
          setQuestions(next);

          if (index + 1 < target) {
            void generateFromIndex(index + 1, next);
          } else {
            setIsGenerating(false);
          }
        } catch {
          if (runIdRef.current === runId && sessionRef.current === session) {
            setIsGenerating(false);
          }
        }
      };

      void generateFromIndex(0, []);
    },
    []
  );

  useEffect(() => {
    if (!enabled || !baseDesc.trim()) return;
    const timer = window.setTimeout(() => {
      startGeneration(description, productType);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [enabled, baseDesc, productType, description, startGeneration]);

  return {
    questions,
    targetCount,
    isGenerating,
    hasQuestions: questions.length > 0,
    restart: () => startGeneration(description, productType),
  };
}
