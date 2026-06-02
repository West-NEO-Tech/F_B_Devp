import { useEffect, useState } from "react";
import { Bot, ArrowRight, Check, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { marketQABaseDescription, type MarketQAQuestion } from "@/hooks/use-market-qa";

interface StepMarketInfoProps {
  description: string;
  productType: string;
  onChange: (field: "description", value: string) => void;
  questions: MarketQAQuestion[];
  targetCount: number;
  isGenerating: boolean;
  onFinish: () => void;
}

function formatSupplement(qa: { q: string; a: string }[]): string {
  const lines = ["", "### Market Info (Q&A)", ""];
  for (const item of qa) {
    lines.push(`- Q: ${item.q}`);
    lines.push(`  A: ${item.a}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function StepMarketInfo({
  description,
  onChange,
  questions,
  targetCount,
  isGenerating,
  onFinish,
}: StepMarketInfoProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  const sessionKey = marketQABaseDescription(description);
  const current = questions[page];
  const currentAnswer = current ? (answers[current.id] ?? "") : "";
  const hasCurrentQuestion = !!current;
  const allReady = questions.length >= targetCount && !isGenerating;
  const isLast =
    allReady && page >= targetCount - 1;
  const showInitialLoading = !hasCurrentQuestion;
  const waitingForMore =
    hasCurrentQuestion && page === questions.length - 1 && questions.length < targetCount && isGenerating;
  const askFor = current?.askFor?.filter((s) => s.trim()) ?? [];

  useEffect(() => {
    setPage(0);
    setAnswers({});
  }, [sessionKey]);

  useEffect(() => {
    if (page >= questions.length && questions.length > 0) {
      setPage(questions.length - 1);
    }
  }, [questions.length, page]);

  function syncToDescription(nextAnswers: Record<string, string>) {
    const pairs = questions
      .map((q) => ({ q: q.question, a: (nextAnswers[q.id] ?? "").trim() }))
      .filter((x) => x.a.length > 0);
    if (pairs.length === 0) return;
    const supplement = formatSupplement(pairs);
    const next = description.includes("### Market Info (Q&A)")
      ? description.replace(/### Market Info \(Q&A\)[\s\S]*$/m, supplement.trimStart())
      : `${description.trimEnd()}\n${supplement}\n`;
    onChange("description", next);
  }

  function next() {
    if (!current) return;
    if (!currentAnswer.trim()) return;
    const updated = { ...answers, [current.id]: currentAnswer };
    setAnswers(updated);
    syncToDescription(updated);
    if (isLast) {
      toast({ title: "Saved" });
      onFinish();
      return;
    }
    if (page < questions.length - 1) {
      setPage((p) => p + 1);
    }
    toast({ title: "Saved" });
  }

  function skip() {
    if (!current) return;
    if (isLast) {
      onFinish();
      return;
    }
    if (page < questions.length - 1) {
      setPage((p) => p + 1);
    }
  }

  function insertExample() {
    if (!current?.exampleAnswer?.trim()) return;
    setAnswers((prev) => ({ ...prev, [current.id]: current.exampleAnswer!.trim() }));
    toast({
      title: "Example inserted",
      description: "Edit the text to match your situation.",
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-foreground">Additional Information</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Answer a few detailed questions to improve the quality of the business analysis report.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 text-sm font-semibold">
          <Bot className="h-4 w-4 text-primary" />
          Questions
        </CardHeader>
        <CardContent className="space-y-3">
          {showInitialLoading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Preparing your first question…
            </div>
          ) : !hasCurrentQuestion ? (
            <div className="text-sm text-muted-foreground py-4">
              No questions available. Go back and complete Description and Product Type.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Question {page + 1} of {targetCount}
                {questions.length < targetCount && isGenerating ? " (more loading…)" : ""}
              </div>
              <div
                key={current.id}
                className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
              >
                <div className="text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap">
                  {current.question}
                </div>
                {askFor.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Please include:</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                      {askFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {current.why && (
                  <p className="text-xs text-muted-foreground italic">{current.why}</p>
                )}
                <Textarea
                  value={currentAnswer}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                  }
                  placeholder="Answer each point above in as much detail as you can…"
                  rows={7}
                  className="text-sm"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={insertExample}
                    disabled={!current.exampleAnswer?.trim()}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI-generated example
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={skip}
                      disabled={isLast && !allReady}
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      onClick={next}
                      disabled={
                        !currentAnswer.trim() ||
                        (isLast && !allReady) ||
                        (page >= questions.length - 1 && !isLast && waitingForMore)
                      }
                    >
                      {isLast ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Finish
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Next
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {waitingForMore && (
                <p className="text-xs text-muted-foreground text-center">
                  Next question is being prepared…
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
