import {
  BookOpenCheck,
  Layers,
  ListTree,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import type { ElementType } from "react";
import type { AssetType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Option {
  value: AssetType;
  label: string;
  description: string;
  icon: ElementType;
}

const OPTIONS: Option[] = [
  {
    value: "worksheet",
    label: "Worksheets",
    description: "Fill-in-the-blanks, short answer & practice problems",
    icon: ClipboardList,
  },
  {
    value: "quiz",
    label: "Quizzes",
    description: "Multiple choice, short answer & true/false",
    icon: BookOpenCheck,
  },
  {
    value: "flashcards",
    label: "Flashcards",
    description: "Interactive front/back study cards",
    icon: Layers,
  },
  {
    value: "mindmap",
    label: "Mind Maps",
    description: "Visual tree & hierarchical outline views",
    icon: ListTree,
  },
  {
    value: "summary",
    label: "Main Points",
    description: "Bullet points, key takeaways & summaries",
    icon: Sparkles,
  },
];

interface Props {
  value: AssetType;
  onChange: (value: AssetType) => void;
}

export function AssetTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
              active
                ? "border-primary bg-accent shadow-sm ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/40",
            )}
          >
            <span
              className={cn(
                "rounded-lg p-2 transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-semibold leading-tight">{opt.label}</span>
            <span className="text-xs text-muted-foreground">
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
