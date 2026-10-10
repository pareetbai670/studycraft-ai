import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AcademicLevel,
  AssetType,
  Difficulty,
  GenerateConfig,
  QuestionStyle,
} from "@/lib/types";

interface Props {
  config: GenerateConfig;
  onChange: (patch: Partial<GenerateConfig>) => void;
  minItems: number;
  maxItems: number;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const STYLES: { value: QuestionStyle; label: string; hint: string }[] = [
  {
    value: "analytical",
    label: "Analytical",
    hint: "Problem-solving & critical thinking",
  },
  {
    value: "theoretical",
    label: "Theoretical",
    hint: "Concepts, definitions & principles",
  },
  {
    value: "practical",
    label: "Practical",
    hint: "Real-world application & cases",
  },
  { value: "mixed", label: "Mixed", hint: "Balanced blend of all styles" },
];

const LEVELS: { value: AcademicLevel; label: string }[] = [
  { value: "high_school", label: "High School / Secondary" },
  { value: "undergraduate", label: "Undergraduate / College" },
  { value: "postgraduate", label: "Postgraduate / Professional" },
  { value: "general", label: "General Learner" },
];

const COUNT_LABEL: Record<AssetType, string> = {
  worksheet: "Exercise Count",
  quiz: "Question Count",
  flashcards: "Card Count",
  mindmap: "Approx. Node Count",
  summary: "Key Takeaway Count",
};

export function ConfigPanel({ config, onChange, minItems, maxItems }: Props) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-primary" />
          Customize
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Difficulty Level</Label>
          <Select
            value={config.difficulty}
            onValueChange={(v) => onChange({ difficulty: v as Difficulty })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Question Style</Label>
          <Select
            value={config.question_style}
            onValueChange={(v) =>
              onChange({ question_style: v as QuestionStyle })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex flex-col">
                    <span>{s.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.hint}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Academic / Standard Level</Label>
          <Select
            value={config.academic_level}
            onValueChange={(v) =>
              onChange({ academic_level: v as AcademicLevel })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{COUNT_LABEL[config.asset_type]}</Label>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-semibold tabular-nums">
              {config.count}
            </span>
          </div>
          <Slider
            min={minItems}
            max={maxItems}
            step={1}
            value={[config.count]}
            onValueChange={([v]) => onChange({ count: v })}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minItems}</span>
            <span>{maxItems}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
