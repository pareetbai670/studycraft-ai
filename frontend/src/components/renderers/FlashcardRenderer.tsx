import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, RotateCw } from "lucide-react";
import type { FlashcardDeck } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  deck: FlashcardDeck;
}

export function FlashcardRenderer({ deck }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const card = deck.cards[index];
  const total = deck.cards.length;

  useEffect(() => {
    setFlipped(false);
    setShowHint(false);
  }, [index]);

  function go(delta: number) {
    setIndex((i) => (i + delta + total) % total);
  }

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (!card) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-bold">{deck.title}</h2>
        <Badge variant="secondary">
          {index + 1} / {total}
        </Badge>
      </div>

      <div className="perspective w-full">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="relative block h-72 w-full cursor-pointer"
          aria-label="Flip card"
        >
          <div
            className={cn(
              "flip-card-inner relative h-full w-full",
              flipped && "is-flipped",
            )}
          >
            {/* Front */}
            <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-md">
              <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                Front
              </span>
              <p className="text-xl font-medium">{card.front}</p>
              <span className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
                <RotateCw className="h-3 w-3" /> Click or press Space to flip
              </span>
            </div>
            {/* Back */}
            <div className="flip-face flip-face-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-primary p-8 text-center text-primary-foreground shadow-md">
              <span className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-80">
                Back
              </span>
              <p className="text-lg leading-relaxed">{card.back}</p>
            </div>
          </div>
        </button>
      </div>

      {card.hint && (
        <div className="min-h-[28px] text-center text-sm">
          {showHint ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Lightbulb className="h-4 w-4 text-amber-500" /> {card.hint}
            </span>
          ) : (
            <button
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowHint(true)}
            >
              <Lightbulb className="h-4 w-4" /> Show hint
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => go(-1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button variant="secondary" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="h-4 w-4" /> Flip
        </Button>
        <Button variant="outline" onClick={() => go(1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
