import { Download, FileDown, Cpu, Wrench } from "lucide-react";
import type { GenerateResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportMarkdown, printArea } from "@/lib/export";
import { QuizRenderer } from "./renderers/QuizRenderer";
import { FlashcardRenderer } from "./renderers/FlashcardRenderer";
import { MindMapRenderer } from "./renderers/MindMapRenderer";
import { WorksheetRenderer } from "./renderers/WorksheetRenderer";
import { SummaryRenderer } from "./renderers/SummaryRenderer";

interface Props {
  result: GenerateResponse;
}

export function AssetView({ result }: Props) {
  const { asset, meta } = result;
  const printable = asset.type === "worksheet" || asset.type === "summary";

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {meta.mock ? (
            <Badge variant="warning" className="gap-1">
              <Wrench className="h-3 w-3" /> Mock Mode
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Cpu className="h-3 w-3" /> {meta.provider} · {meta.model}
            </Badge>
          )}
          {meta.repaired && <span>JSON auto-repaired</span>}
          {meta.retries > 0 && (
            <span>
              · {meta.retries} retr{meta.retries === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {printable && (
            <Button variant="outline" size="sm" onClick={printArea}>
              <FileDown className="h-4 w-4" /> Export to PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMarkdown(asset)}
          >
            <Download className="h-4 w-4" /> Export Markdown
          </Button>
        </div>
      </div>

      {asset.type === "quiz" && <QuizRenderer quiz={asset} />}
      {asset.type === "flashcards" && <FlashcardRenderer deck={asset} />}
      {asset.type === "mindmap" && <MindMapRenderer map={asset} />}
      {asset.type === "worksheet" && <WorksheetRenderer worksheet={asset} />}
      {asset.type === "summary" && <SummaryRenderer summary={asset} />}
    </div>
  );
}
