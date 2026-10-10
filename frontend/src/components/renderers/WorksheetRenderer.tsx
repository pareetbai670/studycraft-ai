import { useState } from "react";
import { Eye, EyeOff, Lightbulb } from "lucide-react";
import type { Worksheet } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  worksheet: Worksheet;
}

const TYPE_LABEL: Record<string, string> = {
  fill_blank: "Fill in the blank",
  short_answer: "Short answer",
  practice_problem: "Practice problem",
};

export function WorksheetRenderer({ worksheet }: Props) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div id="print-area" className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{worksheet.title}</h2>
          {worksheet.instructions && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {worksheet.instructions}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="no-print"
          onClick={() => setShowAnswers((s) => !s)}
        >
          {showAnswers ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          {showAnswers ? "Hide answers" : "Show answers"}
        </Button>
      </div>

      <ol className="space-y-5">
        {worksheet.exercises.map((ex, i) => (
          <li key={i} className="rounded-xl border bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {i + 1}
              </span>
              <Badge variant="outline">{TYPE_LABEL[ex.type] ?? ex.type}</Badge>
            </div>
            <p className="text-[15px] leading-relaxed">{ex.prompt}</p>

            {ex.type !== "fill_blank" && (
              <div
                className="mt-3 h-16 rounded-md border border-dashed bg-muted/30"
                aria-hidden
              />
            )}

            {ex.hint && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 text-amber-500" /> {ex.hint}
              </p>
            )}

            {showAnswers && (
              <div className="mt-3 rounded-lg border border-emerald-500 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/40">
                <span className="font-semibold">Answer: </span>
                {ex.answer}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
