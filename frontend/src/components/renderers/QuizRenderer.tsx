import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { Quiz } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  quiz: Quiz;
}

export function QuizRenderer({ quiz }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const score = useMemo(() => {
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (revealed[i] && isCorrect(q.answer, answers[i])) correct += 1;
    });
    return correct;
  }, [answers, revealed, quiz.questions]);

  const answeredCount = Object.keys(revealed).length;

  function choose(qi: number, option: string) {
    if (revealed[qi]) return;
    setAnswers((a) => ({ ...a, [qi]: option }));
    setRevealed((r) => ({ ...r, [qi]: true }));
  }

  function reset() {
    setAnswers({});
    setRevealed({});
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-10 flex items-center justify-between rounded-xl border bg-card/90 p-4 backdrop-blur">
        <div>
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">
            {answeredCount}/{quiz.questions.length} answered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              score === quiz.questions.length &&
              answeredCount === quiz.questions.length
                ? "success"
                : "secondary"
            }
            className="text-sm"
          >
            Score: {score}/{quiz.questions.length}
          </Badge>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {quiz.questions.map((q, qi) => {
        const picked = answers[qi];
        const isRevealed = revealed[qi];
        const hasOptions = q.options && q.options.length > 0;
        return (
          <Card key={qi} className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-start gap-2 text-base">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {qi + 1}
                </span>
                <span>{q.question}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasOptions ? (
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => {
                    const chosen = picked === opt;
                    const correct = isCorrect(q.answer, opt);
                    return (
                      <button
                        key={oi}
                        onClick={() => choose(qi, opt)}
                        disabled={isRevealed}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-all disabled:cursor-default",
                          !isRevealed && "hover:border-primary hover:bg-accent",
                          isRevealed &&
                            correct &&
                            "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40",
                          isRevealed &&
                            chosen &&
                            !correct &&
                            "border-destructive bg-red-50 dark:bg-red-950/40",
                          isRevealed && !correct && !chosen && "opacity-60",
                        )}
                      >
                        <span>{opt}</span>
                        {isRevealed && correct && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                        {isRevealed && chosen && !correct && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ShortAnswer
                  revealed={isRevealed}
                  value={picked ?? ""}
                  answer={q.answer}
                  onReveal={(val) => choose(qi, val)}
                />
              )}

              {isRevealed && q.explanation && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <span className="font-semibold">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ShortAnswer({
  revealed,
  value,
  answer,
  onReveal,
}: {
  revealed: boolean;
  value: string;
  answer: string;
  onReveal: (val: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <div className="space-y-2">
      <textarea
        value={revealed ? value : draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={revealed}
        placeholder="Type your answer…"
        className="min-h-[70px] w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
      />
      {!revealed ? (
        <Button size="sm" variant="secondary" onClick={() => onReveal(draft)}>
          Reveal model answer
        </Button>
      ) : (
        <div className="rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
          <span className="font-semibold">Model answer: </span>
          {answer}
        </div>
      )}
    </div>
  );
}

function isCorrect(answer: string, picked?: string): boolean {
  if (!picked) return false;
  return answer.trim().toLowerCase() === picked.trim().toLowerCase();
}
